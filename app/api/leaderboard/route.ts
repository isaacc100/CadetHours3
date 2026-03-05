import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function getDateFilter(period: string) {
  const now = new Date();
  switch (period) {
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case "month": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return d;
    }
    case "year": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return d;
    }
    default:
      return undefined;
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "all";
  const includeTravel = searchParams.get("includeTravel") !== "false";

  const settings = await prisma.adminSettings.findFirst();
  const limit = settings?.leaderboardSize ?? 10;

  const dateFilter = getDateFilter(period);
  const where = dateFilter ? { date: { gte: dateFilter } } : {};

  const aggregations = await prisma.entry.groupBy({
    by: ["userId"],
    where,
    _sum: { activityHours: true, travelHours: true, totalHours: true },
    orderBy: { _sum: { totalHours: "desc" } },
    take: limit + 1,
  });

  const userIds = aggregations.map((a) => a.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds }, active: true },
    select: { id: true, name: true, image: true, email: true },
  });

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  const leaderboard = aggregations
    .filter((a) => userMap[a.userId])
    .map((a, i) => ({
      rank: i + 1,
      user: userMap[a.userId],
      hours: includeTravel ? (a._sum.totalHours ?? 0) : (a._sum.activityHours ?? 0),
      activityHours: a._sum.activityHours ?? 0,
      travelHours: a._sum.travelHours ?? 0,
    }))
    .slice(0, limit);

  // Add current user's rank if not in top list
  let myRank = null;
  const myEntry = leaderboard.find((e) => e.user.id === session.user?.id);
  if (!myEntry) {
    const allAggregations = await prisma.entry.groupBy({
      by: ["userId"],
      where,
      _sum: { activityHours: true, travelHours: true, totalHours: true },
      orderBy: { _sum: { totalHours: "desc" } },
    });
    const myIdx = allAggregations.findIndex((a) => a.userId === session.user?.id);
    if (myIdx !== -1) {
      const myAgg = allAggregations[myIdx];
      myRank = {
        rank: myIdx + 1,
        user: await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { id: true, name: true, image: true, email: true },
        }),
        hours: includeTravel
          ? (myAgg._sum.totalHours ?? 0)
          : (myAgg._sum.activityHours ?? 0),
        activityHours: myAgg._sum.activityHours ?? 0,
        travelHours: myAgg._sum.travelHours ?? 0,
      };
    }
  }

  return NextResponse.json({ leaderboard, myRank });
}

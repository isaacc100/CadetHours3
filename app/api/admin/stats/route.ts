import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user?.id || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [userCount, totals, recentLogs] = await Promise.all([
    prisma.user.count({ where: { active: true } }),
    prisma.entry.aggregate({
      _sum: { activityHours: true, travelHours: true, totalHours: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { email: true, name: true } } },
    }),
  ]);

  return NextResponse.json({
    userCount,
    totalActivityHours: totals._sum.activityHours ?? 0,
    totalTravelHours: totals._sum.travelHours ?? 0,
    totalHours: totals._sum.totalHours ?? 0,
    recentLogs,
  });
}

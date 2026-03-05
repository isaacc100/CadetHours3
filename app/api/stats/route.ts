import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? session.user.id;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (userId !== session.user.id && !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [totals, byRole] = await Promise.all([
    prisma.entry.aggregate({
      where: { userId },
      _sum: { activityHours: true, travelHours: true, totalHours: true },
      _count: true,
    }),
    prisma.entry.groupBy({
      by: ["primaryRoleId"],
      where: { userId, primaryRoleId: { not: null } },
      _sum: { totalHours: true },
    }),
  ]);

  const roleIds = byRole.map((r) => r.primaryRoleId).filter(Boolean) as string[];
  const roles = await prisma.role.findMany({ where: { id: { in: roleIds } } });
  const roleMap = Object.fromEntries(roles.map((r) => [r.id, r.name]));

  const roleBreakdown = byRole.map((r) => ({
    role: roleMap[r.primaryRoleId!] ?? "Unknown",
    hours: r._sum.totalHours ?? 0,
  }));

  return NextResponse.json({
    totalActivityHours: totals._sum.activityHours ?? 0,
    totalTravelHours: totals._sum.travelHours ?? 0,
    totalHours: totals._sum.totalHours ?? 0,
    entryCount: totals._count,
    roleBreakdown,
  });
}

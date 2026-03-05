import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") ?? "csv";
  const userId = searchParams.get("userId") ?? session.user.id;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (userId !== session.user.id && !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { userId };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }

  const entries = await prisma.entry.findMany({
    where,
    include: { primaryRole: true, secondaryRoles: { include: { role: true } } },
    orderBy: { date: "desc" },
  });

  if (format === "csv") {
    const header = "Date,Activity Hours,Travel Hours,Total Hours,Primary Role,Notes\n";
    const rows = entries
      .map((e) => {
        const date = e.date.toISOString().split("T")[0];
        const role = e.primaryRole?.name ?? "";
        const notes = `"${(e.notes ?? "").replace(/"/g, '""')}"`;
        return `${date},${e.activityHours},${e.travelHours},${e.totalHours},${role},${notes}`;
      })
      .join("\n");

    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="hours-export.csv"`,
      },
    });
  }

  return NextResponse.json(entries);
}

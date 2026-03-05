import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const entrySchema = z.object({
  activityHours: z.number().min(0).max(24),
  travelHours: z.number().min(0).max(24).default(0),
  notes: z.string().max(2000).optional(),
  primaryRoleId: z.string().optional(),
  secondaryRoleIds: z.array(z.string()).optional(),
  date: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "10");
  const userId = searchParams.get("userId") ?? session.user.id;

  // Non-admins can only see their own entries
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (userId !== session.user.id && !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [entries, total] = await Promise.all([
    prisma.entry.findMany({
      where: { userId },
      include: { primaryRole: true, secondaryRoles: { include: { role: true } } },
      orderBy: { date: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.entry.count({ where: { userId } }),
  ]);

  return NextResponse.json({ entries, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = entrySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const { activityHours, travelHours, notes, primaryRoleId, secondaryRoleIds, date } = parsed.data;
  const totalHours = activityHours + (travelHours ?? 0);

  const entry = await prisma.entry.create({
    data: {
      userId: session.user.id,
      activityHours,
      travelHours: travelHours ?? 0,
      totalHours,
      notes,
      primaryRoleId,
      date: date ? new Date(date) : new Date(),
      secondaryRoles: secondaryRoleIds?.length
        ? { create: secondaryRoleIds.map((roleId) => ({ roleId })) }
        : undefined,
    },
    include: { primaryRole: true, secondaryRoles: { include: { role: true } } },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "ENTRY_CREATED",
      details: JSON.stringify({ entryId: entry.id, totalHours }),
    },
  });

  return NextResponse.json(entry, { status: 201 });
}

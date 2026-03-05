import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  activityHours: z.number().min(0).max(24).optional(),
  travelHours: z.number().min(0).max(24).optional(),
  notes: z.string().max(2000).optional(),
  primaryRoleId: z.string().nullable().optional(),
  secondaryRoleIds: z.array(z.string()).optional(),
  date: z.string().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const entry = await prisma.entry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (entry.userId !== session.user.id && !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const { activityHours, travelHours, notes, primaryRoleId, secondaryRoleIds, date } = parsed.data;
  const newActivity = activityHours ?? entry.activityHours;
  const newTravel = travelHours ?? entry.travelHours;

  // Remove old secondary roles and re-add
  await prisma.entryRole.deleteMany({ where: { entryId: id } });

  const updated = await prisma.entry.update({
    where: { id },
    data: {
      activityHours: newActivity,
      travelHours: newTravel,
      totalHours: newActivity + newTravel,
      notes,
      primaryRoleId,
      date: date ? new Date(date) : undefined,
      secondaryRoles: secondaryRoleIds
        ? { create: secondaryRoleIds.map((roleId) => ({ roleId })) }
        : undefined,
    },
    include: { primaryRole: true, secondaryRoles: { include: { role: true } } },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "ENTRY_UPDATED",
      details: JSON.stringify({ entryId: id }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const entry = await prisma.entry.findUnique({ where: { id } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (entry.userId !== session.user.id && !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.entry.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "ENTRY_DELETED",
      details: JSON.stringify({ entryId: id }),
    },
  });

  return NextResponse.json({ success: true });
}

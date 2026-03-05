import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const updateSchema = z.object({
  active: z.boolean().optional(),
  isAdmin: z.boolean().optional(),
  password: z.string().min(8).max(128).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user?.id || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: any = {};
  if (parsed.data.active !== undefined) updates.active = parsed.data.active;
  if (parsed.data.isAdmin !== undefined) updates.isAdmin = parsed.data.isAdmin;
  if (parsed.data.password) updates.password = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.update({ where: { id }, data: updates });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "ADMIN_USER_UPDATED",
      details: JSON.stringify({ targetUserId: id, fields: Object.keys(updates) }),
    },
  });

  return NextResponse.json({ id: user.id, email: user.email, active: user.active, isAdmin: user.isAdmin });
}

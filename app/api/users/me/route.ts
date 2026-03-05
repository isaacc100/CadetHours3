import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  password: z.string().min(8).max(128).optional(),
  currentPassword: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, image: true, isAdmin: true, active: true, createdAt: true },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.adminSettings.findFirst();
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: any = {};

  if (parsed.data.name !== undefined) {
    if (!settings?.allowNameChange) return NextResponse.json({ error: "Name changes are disabled" }, { status: 403 });
    updates.name = parsed.data.name;
  }

  if (parsed.data.password !== undefined) {
    if (!settings?.allowPasswordChange) return NextResponse.json({ error: "Password changes are disabled" }, { status: 403 });
    if (!parsed.data.currentPassword) return NextResponse.json({ error: "Current password required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.password) return NextResponse.json({ error: "No password set" }, { status: 400 });

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: "Invalid current password" }, { status: 400 });

    updates.password = await bcrypt.hash(parsed.data.password, 12);
  }

  const user = await prisma.user.update({ where: { id: session.user.id }, data: updates });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "PROFILE_UPDATED",
      details: JSON.stringify({ fields: Object.keys(updates) }),
    },
  });

  return NextResponse.json({ id: user.id, email: user.email, name: user.name, image: user.image });
}

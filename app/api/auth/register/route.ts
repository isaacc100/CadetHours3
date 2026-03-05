import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(100).optional(),
});

export async function POST(req: NextRequest) {
  if (process.env.DISABLE_PASSWORD_AUTH === "true") {
    return NextResponse.json({ error: "Password auth is disabled" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const hashed = await bcrypt.hash(parsed.data.password, 12);

  // First user becomes admin
  const userCount = await prisma.user.count();

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      password: hashed,
      name: parsed.data.name,
      isAdmin: userCount === 0,
    },
  });

  // Also init admin settings if first user
  if (userCount === 0) {
    await prisma.adminSettings.upsert({
      where: { id: "singleton" },
      update: {},
      create: { id: "singleton" },
    });
  }

  await prisma.auditLog.create({
    data: { userId: user.id, action: "USER_REGISTERED" },
  });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}

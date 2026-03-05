import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const settingsSchema = z.object({
  leaderboardSize: z.number().int().min(1).max(100).optional(),
  footerText: z.string().max(500).optional(),
  allowNameChange: z.boolean().optional(),
  allowAvatarChange: z.boolean().optional(),
  allowPasswordChange: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.adminSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user?.id || !(session.user as any).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });

  const settings = await prisma.adminSettings.upsert({
    where: { id: "singleton" },
    update: parsed.data,
    create: { id: "singleton", ...parsed.data },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "SETTINGS_UPDATED",
      details: JSON.stringify(parsed.data),
    },
  });

  return NextResponse.json(settings);
}

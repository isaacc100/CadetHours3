import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await prisma.adminSettings.findFirst();
  if (!settings?.allowAvatarChange) {
    return NextResponse.json({ error: "Avatar changes are disabled" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  // Validate file type
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  // Delete old avatar if exists
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.image && user.image.includes("vercel-storage.com")) {
    try {
      await del(user.image);
    } catch {
      // ignore deletion errors
    }
  }

  const ext = file.type.split("/")[1];
  const blob = await put(`avatars/${session.user.id}-${Date.now()}.${ext}`, file, {
    access: "public",
    contentType: file.type,
  });

  await prisma.user.update({ where: { id: session.user.id }, data: { image: blob.url } });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "AVATAR_UPDATED" },
  });

  return NextResponse.json({ url: blob.url });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (user?.image && user.image.includes("vercel-storage.com")) {
    try {
      await del(user.image);
    } catch {
      // ignore deletion errors
    }
  }

  await prisma.user.update({ where: { id: session.user.id }, data: { image: null } });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: "AVATAR_REMOVED" },
  });

  return NextResponse.json({ success: true });
}

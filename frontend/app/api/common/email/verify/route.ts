import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma/client";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, otp } = body;

  if (!email || !otp) return NextResponse.json({ result: false });

  const identifier = `email-verification-otp-${email}`;
  const record = await prisma.baVerification.findFirst({ where: { identifier } });

  if (!record) return NextResponse.json({ result: false });

  if (record.expiresAt < new Date()) {
    await prisma.baVerification.delete({ where: { id: record.id } });
    return NextResponse.json({ result: false });
  }

  const [storedHash, attemptsStr] = record.value.split(":");
  const attempts = parseInt(attemptsStr || "0");

  if (attempts >= 3) {
    await prisma.baVerification.delete({ where: { id: record.id } });
    return NextResponse.json({ result: false });
  }

  const inputHash = crypto.createHash("sha256").update(otp).digest("base64url");

  if (inputHash !== storedHash) {
    await prisma.baVerification.update({
      where: { id: record.id },
      data: { value: `${storedHash}:${attempts + 1}` },
    });
    return NextResponse.json({ result: false });
  }

  await prisma.baVerification.delete({ where: { id: record.id } });
  return NextResponse.json({ result: true });
}

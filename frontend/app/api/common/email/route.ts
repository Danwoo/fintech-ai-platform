import { env } from "@/env";
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import crypto from "crypto";
import path from "path";
import dns from "dns/promises";
import { prisma } from "@/lib/prisma/client";
import { getKSTTime } from "@/utils/common/timeUtils";

function toFriendlyEmailError(message: string): string {
  if (
    /user.*unavailable|account.*unavailable|no such user|user.*not.*exist|does not exist|unknown user|invalid.*mailbox/i.test(
      message,
    )
  )
    return `존재하지 않는 이메일 주소입니다.\n주소를 다시 확인해주세요.`;
  if (/rejected|denied|not allowed/i.test(message)) return `수신 거부된 이메일 주소입니다.`;
  if (/connect|timeout|ECONNREFUSED|ETIMEDOUT/i.test(message))
    return `메일 서버에 연결할 수 없습니다.\n잠시 후 다시 시도해주세요.`;
  if (/authentication|auth|credentials/i.test(message))
    return `메일 서버 인증에 실패했습니다.\n관리자에게 문의해주세요.`;
  return `이메일 발송에 실패했습니다.\n주소를 확인하거나 잠시 후 다시 시도해주세요.`;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { to, html } = body;

  const transporter = nodemailer.createTransport({
    host: env.EMAIL_HOST,
    port: Number(env.EMAIL_PORT),
    secure: true,
    auth: {
      user: env.EMAIL_USER,
      pass: env.EMAIL_PASSWORD,
    },
  });

  // 6자리 랜덤 OTP 생성
  const otp = crypto
    .randomBytes(4)
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 6);

  // SHA-256으로 해싱 (BA emailOtp 플러그인과 동일한 포맷)
  const hashedOTP = crypto.createHash("sha256").update(otp).digest("base64url");

  // MX 레코드 검증
  const domain = to.split("@")[1];
  const subject = `[ACME] 인증 코드: ${otp}`;
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) throw new Error(`No MX records found for domain: ${domain}`);
  } catch (e) {
    const rawError = e instanceof Error ? e.message : String(e);
    await prisma.emailLog.create({
      data: { to, subject, status: "FAIL", error_msg: rawError, reg_dt: getKSTTime() },
    });
    return NextResponse.json(
      { message: `유효하지 않은 이메일 도메인입니다.\n이메일 주소를 다시 확인해주세요.` },
      { status: 400 },
    );
  }

  // BaVerification 테이블에 OTP 저장 (BA emailOtp 포맷: `${hash}:${attempts}`)
  const identifier = `email-verification-otp-${to}`;
  await prisma.baVerification.deleteMany({ where: { identifier } });
  await prisma.baVerification.create({
    data: {
      id: crypto.randomUUID(),
      identifier,
      value: `${hashedOTP}:0`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  let mailTemplate = "";
  mailTemplate +=
    '<table style="width:100%;max-width:800px;background:#F5F7FC;text-align:center;margin:0 auto;padding:30px 0 40px;">';
  mailTemplate += '<tr><td><img src="cid:logo" style="height:100px;margin-top:40px;margin-bottom:40px;"></td></tr>';
  mailTemplate +=
    '<tr><td><div style="border-radius:20px;width:100%;max-width:450px;background:#ffffff;margin:0 auto;padding:24px 20px 28px;">';
  mailTemplate += '<div style="color:#303F67;font-size:52px;font-weight:bold;letter-spacing:6px;">' + otp + "</div>";
  mailTemplate +=
    '<div style="display:inline-block;background:#EEF2FF;color:#303F67;padding:6px 16px;border-radius:8px;margin-top:14px;font-size:14px;">' +
    html +
    "</div>";
  mailTemplate += "</div></td></tr>";
  mailTemplate += "</table>";

  const mailOptions = {
    from: env.EMAIL_USER,
    to,
    subject,
    html: mailTemplate,
    attachments: [
      {
        filename: "logo-svg.png",
        path: path.join(process.cwd(), "public/logo-svg.png"),
        cid: "logo",
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    await prisma.emailLog.create({
      data: { to, subject, status: "SUCCESS", reg_dt: getKSTTime() },
    });
    return NextResponse.json({ message: "Email sent successfully" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await prisma.emailLog.create({
      data: { to, subject, status: "FAIL", error_msg: errorMessage, reg_dt: getKSTTime() },
    });
    return NextResponse.json({ message: toFriendlyEmailError(errorMessage) }, { status: 500 });
  }
}

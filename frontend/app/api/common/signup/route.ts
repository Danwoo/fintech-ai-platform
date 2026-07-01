import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { auth } from "@/lib/auth/auth";
import { DEFAULT_USER_AUTHOR_ID } from "@/constants/protected";
import { getKSTTime } from "@/utils/common/timeUtils";
import { isOEM } from "@/utils/common/edition";
import { getClientIp, rateLimit } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  try {
    // 공개 이메일 존재 확인 — 열거(enumeration) 남용 방어를 위해 IP rate limit
    if (!rateLimit(`signup:check:${getClientIp(req)}`, 20, 60_000)) {
      return NextResponse.json({ result: false, name: "email" }, { status: 429 });
    }

    const { searchParams } = req.nextUrl;
    const getP1 = searchParams.get("p1");
    const email = getP1 ?? "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ result: false, name: "email" });
    }

    // 이미 존재하는 이메일인지 확인
    const data = await prisma.user.findUnique({
      where: { email },
    });

    if (data) {
      return NextResponse.json({ result: true });
    } else {
      return NextResponse.json({ result: false });
    }
  } catch (error) {
    console.error("Email check error:", error);
    return new NextResponse("Internal Server Error!", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { headers } = req;
  const forwardedFor = headers.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0] : "unknown";

  const { email, password, name, dept } = await req.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ result: false, name: "email" });
  }
  if (!password || password.trim().length < 8) {
    return NextResponse.json({ result: false, name: "password" });
  }

  try {
    const data = await prisma.user.findUnique({
      where: { email },
    });

    if (data) {
      return NextResponse.json({ result: false, name: "email" });
    } else {
      let company_id: number | null;
      let appr_at: string;
      let autoGrantRole: boolean;

      if (isOEM()) {
        // OEM: 단일 회사 배포. 도메인 매핑 없이 DB 의 유일 활성 회사로 배정, 항상 승인 대기.
        // 회사 0개/2개+ 는 OEM 불변식 위반 → 큰소리로 실패 (조용히 엉뚱한 회사 배정 방지).
        const companies = await prisma.company.findMany({
          where: { use_at: "Y" },
          select: { id: true },
        });
        if (companies.length === 0) {
          return NextResponse.json({ message: "OEM: 활성 회사가 없습니다." }, { status: 500 });
        }
        if (companies.length > 1) {
          return NextResponse.json({ message: "OEM: 활성 회사가 2개 이상입니다 (설정 오류)." }, { status: 500 });
        }
        company_id = companies[0].id;
        appr_at = "N"; // 운영자 승인 대기
        autoGrantRole = false; // 권한은 운영자가 승인 시 부여
      } else {
        // SaaS: 이메일 도메인 → 회사 자동 매핑 (회사 use_at='Y' 만 매칭)
        const domain = email.split("@")[1]?.toLowerCase() ?? "";
        const companyDomain = domain
          ? await prisma.companyDomain.findFirst({
              where: { domain, company: { use_at: "Y" } },
              select: { company_id: true },
            })
          : null;

        // 매핑 성공 → 즉시 활성 / 매핑 실패 → 시스템관리자 배정 대기
        company_id = companyDomain?.company_id ?? null;
        appr_at = companyDomain ? "Y" : "N";
        autoGrantRole = !!companyDomain;
      }

      // Better Auth로 사용자 생성 (TN_User + BA_Account)
      await auth.api.signUpEmail({
        body: { email, password, name: name || email },
      });

      // 커스텀 필드 업데이트 (Better Auth가 모르는 필드)
      await prisma.user.update({
        where: { email },
        data: {
          dept: dept,
          company_id,
          appr_at,
          emailVerified: true,
          reg_id: email,
          reg_ip: clientIp.replace(/^::ffff:/, ""),
          reg_pid: "signup",
          mod_id: email,
          mod_ip: clientIp.replace(/^::ffff:/, ""),
          mod_pid: "signup",
        },
      });

      // 도메인 매핑된 가입자(즉시 활성)는 일반사용자 권한 자동 부여. OEM 은 승인 시 운영자가 부여.
      if (autoGrantRole) {
        await prisma.authorMember.create({
          data: {
            author_id: DEFAULT_USER_AUTHOR_ID,
            user_id: email,
            reg_id: email,
            reg_dt: getKSTTime(),
            mod_id: email,
            mod_dt: getKSTTime(),
          },
        });
      }

      return NextResponse.json({ result: true });
    }
  } catch (error) {
    return new NextResponse("Internal Server Error!", { status: 500 });
  }
}

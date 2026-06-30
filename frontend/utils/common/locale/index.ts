// utils/common/locale/index.ts
// 앱 공통 언어(en/ko) 상태 + i18n 부트스트랩.
//
// - 상태: localStorage("app-locale") (기본 ko). 전환은 setAppLocale() → reload.
// - 부트스트랩(side-effect): 활성 언어로 DevExtreme 메시지 로드 + Zod config 적용.
//   · DevExtreme: en 은 내장, ko 사전만 등록 후 locale() 설정
//   · Zod: 활성 언어의 apply() 실행
// - components/shared/ui/index.ts, lib/zod/helpers.ts 에서 side-effect import 하면 자동 적용.
// - 언어별 메시지는 ./ko, ./en 폴더 (devextreme/zod/apierrors). 언어 추가 = 폴더 + 아래 매핑 한 줄.
import { loadMessages, locale } from "devextreme/localization";
import { messages as koDevextreme } from "./ko/devextreme";
import * as koZod from "./ko/zod";
import * as enZod from "./en/zod";

export type AppLocale = "ko" | "en";
export const APP_LOCALE_STORAGE_KEY = "app-locale";

/** 현재 활성 언어 (기본 ko). SSR 안전. */
export function getAppLocale(): AppLocale {
  if (typeof window === "undefined") return "ko";
  return window.localStorage.getItem(APP_LOCALE_STORAGE_KEY) === "en" ? "en" : "ko";
}

/** 언어 전환: 저장 후 새로고침 (DevExtreme 위젯·Zod config 는 로드 시 locale 을 읽으므로 reload 로 재적용). */
export function setAppLocale(next: AppLocale): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, next);
  window.location.reload();
}

// ── 부트스트랩 (side-effect) ──
const ZOD_BY_LOCALE: Record<AppLocale, { apply: () => void }> = { ko: koZod, en: enZod };

loadMessages({ ko: koDevextreme });
locale(getAppLocale());
ZOD_BY_LOCALE[getAppLocale()].apply();

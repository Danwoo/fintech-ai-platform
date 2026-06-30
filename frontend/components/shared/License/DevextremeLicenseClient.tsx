"use client";

import config from "devextreme/core/config";
import { DEVEXTREME_LICENSE_KEY } from "@/constants/license";

/**
 * DevExtreme 라이선스 등록용 클라이언트 컴포넌트
 */
export const DevextremeLicenseClient = () => {
  if (typeof window !== "undefined") {
    config({ licenseKey: DEVEXTREME_LICENSE_KEY });
  }
  return null;
};

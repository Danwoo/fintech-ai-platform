export type DateFormatType = "date" | "datetime" | "time";

export interface FormatDateOptions {
  /**
   * 표시 타임존. 기본값은 'Asia/Seoul'(KST)
   * - ISO 문자열을 그대로 보여주는 게 아니라, 지정된 타임존으로 변환된 시간을 표시합니다.
   */
  timeZone?: string;
}

export const formatDate = (value: any, type: DateFormatType, options: FormatDateOptions = {}) => {
  if (!value) return null;

  const date = new Date(value);

  // 유효한 날짜인지 확인
  if (isNaN(date.getTime())) {
    return null;
  }

  switch (type) {
    case "date": {
      // 표시 타임존(기본 KST)의 달력 날짜 — UTC toISOString 은 자정 근처 timestamp 가 하루 어긋남
      const tz = options.timeZone ?? "Asia/Seoul";
      const parts = new Intl.DateTimeFormat("sv-SE", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(date);
      const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
      return `${get("year")}-${get("month")}-${get("day")}`; // YYYY-MM-DD
    }
    case "datetime": {
      // 화면 표시는 기본 KST(Asia/Seoul)로 변환해서 `YYYY-MM-DD HH:mm:ss` 형태로 보여줍니다.
      const tz = options.timeZone ?? "Asia/Seoul";

      const parts = new Intl.DateTimeFormat("sv-SE", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).formatToParts(date);

      const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
      const yyyy = get("year");
      const mm = get("month");
      const dd = get("day");
      const hh = get("hour");
      const mi = get("minute");
      const ss = get("second");

      // 기본 포맷: YYYY-MM-DD HH:mm:ss
      const base = `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
      return base;
    }
    case "time":
      return date.toTimeString().split(" ")[0]; // HH:mm:ss
    default:
      return date.toISOString().split("T")[0];
  }
};

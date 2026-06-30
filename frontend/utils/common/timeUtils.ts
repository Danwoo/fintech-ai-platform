import { addHours, addDays } from "date-fns";
export { addHours, addDays };

/**
 * Date → "YYYY-MM-DD HH:mm:ss" 형식 문자열 변환
 */
export function formatDateTime(date?: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().replace("T", " ").substring(0, 19);
}

/**
 * 날짜 문자열('YYYY-MM-DD')을 그날 끝 'YYYY-MM-DD 23:59:59' 으로 변환
 */
export function toEndOfDay(dateStr: string): string {
  return `${dateStr} 23:59:59`;
}

/**
 * KST 시간을 Unix timestamp로 변환
 * @param date 선택적, 기준 날짜. 없으면 현재 시간 기준
 */
export function getKSTTimestamp(date?: Date): number {
  const baseDate = date ?? new Date();
  return Math.floor(addHours(baseDate, 9).getTime() / 1000);
}

/**
 * KST 기준 현재 시간 반환
 * @param date 선택적, 기준 날짜. 없으면 현재 시간 기준
 */
export function getKSTTime(date?: Date): Date {
  const baseDate = date ?? new Date();
  return addHours(baseDate, 9);
}

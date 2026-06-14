/** fixed MobileNav 높이 + safe area — 탭 페이지 하단 여백 */
export const MOBILE_TAB_BAR_PADDING =
  "calc(4rem + env(safe-area-inset-bottom))";

export const MOBILE_TAB_PATHS = ["/chat", "/trend", "/mypage"] as const;

export function isMobileTabPath(pathname: string): boolean {
  return MOBILE_TAB_PATHS.some((p) => pathname.startsWith(p));
}

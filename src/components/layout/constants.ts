/** fixed MobileNav 높이 + safe area — 탭 페이지 하단 여백 */
export const MOBILE_TAB_BAR_HEIGHT = "3.5rem";
export const MOBILE_TAB_BAR_PADDING = `calc(${MOBILE_TAB_BAR_HEIGHT} + env(safe-area-inset-bottom))`;
export const MOBILE_TAB_BAR_PADDING_CLASS =
  "pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0";

export const MOBILE_TAB_PATHS = ["/chat", "/trend", "/mypage"] as const;

export const MARKETING_PATHS = ["/", "/login", "/signup"] as const;

export function isMarketingPath(pathname: string): boolean {
  return MARKETING_PATHS.some((p) => pathname === p);
}

export function isMobileTabPath(pathname: string): boolean {
  return MOBILE_TAB_PATHS.some((p) => pathname.startsWith(p));
}

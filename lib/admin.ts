export const ADMIN_COOKIE_NAME = "jobclaw-admin";

const HARDCODED_ADMIN_PASSWORD = "admin";

export function isValidAdminPassword(password: string | null | undefined) {
  return password === HARDCODED_ADMIN_PASSWORD;
}

export function readCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

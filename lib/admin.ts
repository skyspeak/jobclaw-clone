export const ADMIN_COOKIE_NAME = "jobclaw-admin";

const defaultAdminPassword = "claws2026";

export function getAdminPassword() {
  return process.env.ADMIN_DASHBOARD_TOKEN || defaultAdminPassword;
}

export function isValidAdminPassword(password: string | null | undefined) {
  return password === getAdminPassword();
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

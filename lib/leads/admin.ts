export function getLeadGenAdminSecret(): string | null {
  const secret =
    process.env.LEAD_GEN_ADMIN_SECRET?.trim() ||
    process.env.ADMIN_SECRET?.trim() ||
    null;
  return secret || null;
}

export function isValidLeadGenAdminKey(key: string | null | undefined): boolean {
  const secret = getLeadGenAdminSecret();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  return key === secret;
}

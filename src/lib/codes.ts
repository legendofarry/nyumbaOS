export const OWNER_CODE = "2000";
export const OWNER_EMAIL = "owner@apt.local";

export function emailForCode(code: string) {
  if (code === OWNER_CODE) return OWNER_EMAIL;
  return `t-${code}@apt.local`;
}

export function passwordForCode(code: string) {
  if (code === OWNER_CODE) return `owner-secret-${code}-aptv1`;
  return `tenant-secret-${code}-aptv1`;
}
// Firebase Auth still needs an email-shaped identifier.
// Tenants never see or type this; the app derives it from the assigned unit ID.
export const tenantEmail = (unitId: string) =>
  `unit-${unitId.toLowerCase().replace(/[^a-z0-9]/g, "")}@nyumbaos.local`;

export const tenantSignupEmail = (phone: string) =>
  `tenant-${phone.toLowerCase().replace(/[^a-z0-9]/g, "")}@nyumbaos.local`;

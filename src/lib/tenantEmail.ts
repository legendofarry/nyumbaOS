// src\lib\tenantEmail.ts
// Firebase Auth still needs email-shaped identifiers.
// Tenants never see or type these; the app derives them from a unit ID or phone.
export const tenantEmail = (unitId: string) =>
  `unit-${unitId.toLowerCase().replace(/[^a-z0-9]/g, "")}@nyumbaos.local`;

export const tenantSignupEmail = (phone: string) =>
  `tenant-${phone.toLowerCase().replace(/[^a-z0-9]/g, "")}@nyumbaos.local`;

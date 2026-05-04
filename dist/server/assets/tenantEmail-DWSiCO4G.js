const tenantEmail = (unitId) => `unit-${unitId.toLowerCase().replace(/[^a-z0-9]/g, "")}@nyumbaos.local`;
const tenantSignupEmail = (phone) => `tenant-${phone.toLowerCase().replace(/[^a-z0-9]/g, "")}@nyumbaos.local`;
export {
  tenantSignupEmail as a,
  tenantEmail as t
};

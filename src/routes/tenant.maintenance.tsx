import { createFileRoute } from "@tanstack/react-router";
import { TenantMaintenance } from "@/pages/tenant/TenantMaintenance";

export const Route = createFileRoute("/tenant/maintenance")({
  component: TenantMaintenance,
});

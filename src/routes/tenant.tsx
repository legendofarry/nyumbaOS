import { createFileRoute } from "@tanstack/react-router";
import { TenantHome } from "@/pages/tenant/TenantHome";

export const Route = createFileRoute("/tenant")({
  component: TenantHome,
});

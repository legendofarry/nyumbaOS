import { createFileRoute } from "@tanstack/react-router";
import { TenantBilling } from "@/pages/tenant/TenantBilling";

export const Route = createFileRoute("/tenant/billing")({
  component: TenantBilling,
});

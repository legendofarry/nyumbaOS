import { createFileRoute } from "@tanstack/react-router";
import { TenantUtilities } from "@/pages/tenant/TenantUtilities";

export const Route = createFileRoute("/tenant/utilities")({
  component: TenantUtilities,
});

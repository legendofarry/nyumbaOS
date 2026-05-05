import { createFileRoute } from "@tanstack/react-router";
import { TenantNotices } from "@/pages/tenant/TenantNotices";

export const Route = createFileRoute("/tenant/notices")({
  component: TenantNotices,
});

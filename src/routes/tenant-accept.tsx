import { createFileRoute } from "@tanstack/react-router";
import { TenantAcceptInvite } from "@/pages/auth/TenantAcceptInvite";
export const Route = createFileRoute("/tenant-accept")({ component: TenantAcceptInvite });

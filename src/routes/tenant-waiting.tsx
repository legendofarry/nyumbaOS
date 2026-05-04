import { createFileRoute } from "@tanstack/react-router";
import { TenantWaiting } from "@/pages/auth/TenantWaiting";

export const Route = createFileRoute("/tenant-waiting")({ component: TenantWaiting });

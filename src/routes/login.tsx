import { createFileRoute } from "@tanstack/react-router";
import { TenantLogin } from "@/pages/auth/TenantLogin";

export const Route = createFileRoute("/login")({ component: TenantLogin });

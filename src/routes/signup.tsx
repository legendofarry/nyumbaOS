import { createFileRoute } from "@tanstack/react-router";
import { TenantSignup } from "@/pages/auth/TenantSignup";

export const Route = createFileRoute("/signup")({ component: TenantSignup });

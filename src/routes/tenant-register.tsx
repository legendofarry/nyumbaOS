import { createFileRoute } from "@tanstack/react-router";
import { TenantRegister } from "@/pages/auth/TenantRegister";

export const Route = createFileRoute("/tenant-register")({ component: TenantRegister });

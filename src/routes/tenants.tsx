import { createFileRoute } from "@tanstack/react-router";
import { Tenants } from "@/pages/Tenants";
export const Route = createFileRoute("/tenants")({ component: Tenants });

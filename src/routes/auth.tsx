import { createFileRoute } from "@tanstack/react-router";
import { OwnerAuth } from "@/pages/auth/OwnerAuth";
export const Route = createFileRoute("/auth")({ component: OwnerAuth });

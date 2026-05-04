import { createFileRoute } from "@tanstack/react-router";
import { Notices } from "@/pages/Notices";
export const Route = createFileRoute("/notices")({ component: Notices });

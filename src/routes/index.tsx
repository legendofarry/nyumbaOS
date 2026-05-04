import { createFileRoute } from "@tanstack/react-router";
import { HomeAuth } from "@/pages/auth/HomeAuth";

export const Route = createFileRoute("/")({
  component: HomeAuth,
});

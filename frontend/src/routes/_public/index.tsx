import { createFileRoute } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/")({
  beforeLoad: () => {
    throw redirect({ to: "/search" });
  },
});

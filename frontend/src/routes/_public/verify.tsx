import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/verify")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_public/verify"!</div>;
}

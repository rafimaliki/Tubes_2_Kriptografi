import { createFileRoute } from "@tanstack/react-router";
import { AppTopbar } from "@/components/app-topbar";

export const Route = createFileRoute("/_public/transactions")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <AppTopbar title="Back" to="/search" />

      <div className="flex flex-col">List of Transactions</div>
    </div>
  );
}

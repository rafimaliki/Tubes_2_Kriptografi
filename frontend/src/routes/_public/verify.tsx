import { createFileRoute } from "@tanstack/react-router";
import { AppTopbar } from "@/components/app-topbar";

type VerifySearch = {
  cert_url?: string;
  aes_key?: string;
  tx_hash?: string;
};

export const Route = createFileRoute("/_public/verify")({
  validateSearch: (search: Record<string, unknown>): VerifySearch => ({
    cert_url: search.cert_url as string | undefined,
    aes_key: search.aes_key as string | undefined,
    tx_hash: search.tx_hash as string | undefined,
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { cert_url, aes_key, tx_hash } = Route.useSearch();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <AppTopbar title="Back to Search" to="/search" />

      <div className="flex flex-col">
        <div>Certificate URL : {cert_url}</div>
        <div>AES Key: {aes_key}</div>
        <div>TX Hash: {tx_hash}</div>
      </div>
    </div>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppLogoHeader } from "@/components/app-logo-header";

export const Route = createFileRoute("/_public/search")({
  component: SearchPage,
});

function SearchPage() {
  const [urlToVerify, setUrlToVerify] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = new URL(urlToVerify);

      const cert_url = url.searchParams.get("cert_url");
      const aes_key = url.searchParams.get("aes_key");
      const tx_hash = url.searchParams.get("tx_hash");

      console.log({ cert_url, aes_key, tx_hash });

      navigate({
        to: "/verify",
        search: {
          cert_url: cert_url || "",
          aes_key: aes_key || "",
          tx_hash: tx_hash || "",
        },
      });
    } catch {
      setError("Invalid URL");
      return;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="min-w-180">
        {/* Logo/Header */}
        <AppLogoHeader title="Verify Certificate" />

        {/* Login Form */}
        <div className="bg-slate-900/50  backdrop-blur-sm border border-slate-800 rounded-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="privateKey"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Certificate URL
              </label>
              <input
                id="urlToVerify"
                value={urlToVerify}
                onChange={(e) => setUrlToVerify(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono text-sm"
                placeholder="Enter your certificate URL..."
                required
              />
              {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-900/50"
            >
              Verify
            </button>
          </form>
        </div>

        <div className="flex justify-center mt-10">
          <Link
            to="/transactions"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors"
          >
            See Transactions
          </Link>
        </div>
      </div>
    </div>
  );
}

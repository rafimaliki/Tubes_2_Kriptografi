import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { AppLogoHeader } from "@/components/app-logo-header";

export const Route = createFileRoute("/admin/login")({
  component: LoginPage,
});

function LoginPage() {
  const [privateKey, setPrivateKey] = useState(`-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgZzB6cCCmSvtuMCsr
GXpbp19W4Txq66PIzsDL/dnUmbKhRANCAAR1szZm70N510mHpGL7Sy9BWJZcM2Xj
Ujo4fAhTk109YLAO7KUQl+9ZdmQbNdx9412FLw4aHRRviXV9RFWdSVvq
-----END PRIVATE KEY-----`);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(privateKey);

    if (!result.ok) {
      setError("Authentication failed");
      setIsLoading(false);
    } else {
      navigate({
        to: "/certificates",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="min-w-180">
        {/* Logo/Header */}
        <AppLogoHeader title="Issuer Authentication" />

        {/* Login Form */}
        <div className="bg-slate-900/50  backdrop-blur-sm border border-slate-800 rounded-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="privateKey"
                className="block text-sm font-medium text-slate-300 mb-2"
              >
                Private Key
              </label>
              <textarea
                id="privateKey"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono text-sm"
                placeholder="Enter your private key..."
                required
              />
              {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

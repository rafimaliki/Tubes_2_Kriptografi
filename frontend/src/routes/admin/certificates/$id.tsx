import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import type { Certificate } from "@/data/mock-certificates";
import { CertificateAPI } from "@/api/certificate.api";
import { Crypto } from "@/lib/Crypto";
import { RevokeModal } from "@/components/revoke-modal";
import { useAuthStore } from "@/store/auth.store";
import { formatDate } from "@/lib/Date";
import { AppTopbar } from "@/components/app-topbar";

export const Route = createFileRoute("/admin/certificates/$id")({
  component: CertificateDetailPage,
});

function CertificateDetailPage() {
  const { id } = Route.useParams();

  const [certificate, setCertificate] = useState<
    (Certificate & { revokeReason?: string }) | null
  >(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);

  const { authenticated } = useAuthStore();

  useEffect(() => {
    let cancelled = false;

    async function loadCertificate() {
      try {
        const res = await CertificateAPI.getById(id);

        if (!cancelled) {
          setCertificate(res);
        }
      } catch (err: any) {
        console.error("Failed to load certificate:", err);
        if (!cancelled) {
          setCertificate(null);
        }
      }
    }

    loadCertificate();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!certificate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 mb-4">
            <svg
              className="w-8 h-8 text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Certificate Not Found
          </h2>
          <p className="text-slate-400 mb-6">
            The requested certificate does not exist.
          </p>
          <Link
            to="/certificates"
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 inline-block"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <AppTopbar title="Back" to="/admin/certificates" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 sm:p-12 shadow-2xl">
          <div className="text-center mb-8 pb-8 border-b border-slate-800">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 mb-6 shadow-lg shadow-blue-900/50">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Certificate of Completion
            </h1>
            <p className="text-slate-400">
              Issued by Secure Certificates Authority
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">
                  Certificate Holder
                </label>
                <p className="text-xl font-semibold text-white">
                  {certificate.ownerName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">
                  Study Program
                </label>
                <p className="text-xl font-semibold text-white">
                  {certificate.study}
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">
                  Issue Date
                </label>
                <p className="text-lg text-white">
                  {formatDate(certificate.issueDate)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">
                  Status
                </label>
                <span
                  className={`px-3 py-1 rounded-full font-medium ${
                    certificate.status === "Valid"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {certificate.status}
                </span>
              </div>
              {certificate.status === "Revoked" && certificate.revokeReason && (
                <div className="bg-slate-800/60 border border-red-500/30 rounded-lg p-3">
                  <label className="block text-sm font-medium text-red-400 mb-1">
                    Revocation Reason
                  </label>
                  <p className="text-slate-200 leading-relaxed">
                    {certificate.revokeReason}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">
                Certificate ID
              </label>
              <p className="text-sm font-mono text-slate-300 bg-slate-950 px-4 py-3 rounded-lg border border-slate-800">
                {certificate.id}
              </p>
            </div>
          </div>

          {authenticated && (
            <div className="mt-8 pt-8 border-t border-slate-800 flex items-center justify-center">
              <button
                onClick={() => setShowRevokeModal(true)}
                disabled={certificate.status === "Revoked" || isRevoking}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-red-900/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRevoking
                  ? "Revoking..."
                  : certificate.status === "Revoked"
                    ? "Certificate Revoked"
                    : "Revoke Certificate"}
              </button>
            </div>
          )}
        </div>
      </main>

      <RevokeModal
        isOpen={showRevokeModal}
        onClose={() => setShowRevokeModal(false)}
        onConfirm={async (reason) => {
          if (!certificate) throw new Error("Missing certificate");

          setIsRevoking(true);

          try {
            const rawUser = localStorage.getItem("app_user");
            if (!rawUser) throw new Error("Not authenticated");

            const user = JSON.parse(atob(rawUser));

            const message = JSON.stringify({
              action: "REVOKE",
              target: certificate.id,
            });
            const signature = await Crypto.signNonce(message, user.private_key);

            await CertificateAPI.revoke({
              target_tx_hash: certificate.id,
              signature,
              issuerAddress: user.name,
              reason,
            });

            setCertificate({
              ...certificate,
              status: "Revoked",
              revokeReason: reason,
            });
            setShowRevokeModal(false);
          } finally {
            setIsRevoking(false);
          }
        }}
      />
    </div>
  );
}

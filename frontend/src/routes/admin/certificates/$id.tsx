import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { mockCertificates } from "@/data/mock-certificates";
import type { Certificate } from "@/data/mock-certificates";
import { useAuthStore } from "@/store/auth.store";

export const Route = createFileRoute("/admin/certificates/$id")({
  component: CertificateDetailPage,
});

function CertificateDetailPage() {
  const { id } = Route.useParams();
  const { authenticated } = useAuthStore();

  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    const cert = mockCertificates.find((c) => c.id === id);
    setCertificate(cert || null);
  }, [id]);

  const handleRevoke = () => {
    if (certificate && certificate.status === "Valid") {
      setIsRevoking(true);
      setTimeout(() => {
        alert("Certificate revoked successfully");
        setIsRevoking(false);
      }, 1000);
    }
  };

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
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            to="/admin/certificates"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-fit"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Certificates
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Certificate Card */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 sm:p-12 shadow-2xl">
          {/* Header */}
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

          {/* Certificate Details */}
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
                  Study/Course
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
                <p className="text-lg text-white">{certificate.issueDate}</p>
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

          {/* Revoke Button */}
          <div className="mt-8 pt-8 border-t border-slate-800 flex items-center justify-center">
            <button
              onClick={handleRevoke}
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
        </div>
      </main>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { AppTopbar } from "@/components/app-topbar";

import { useEffect, useState } from "react";
import { TransactionAPI } from "@/api/ledger.api";
import { formatDate } from "@/lib/Date";

export const Route = createFileRoute("/_public/transactions")({
  component: RouteComponent,
});

function RouteComponent() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      const res = await TransactionAPI.list();
      if (res.ok) {
        console.log("Transactions:", res.data);
        setTransactions(res.data);
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <AppTopbar title="Back" to="/search" />

      {/* List of Transactions */}
      <div className="flex-1 overflow-y-auto max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid gap-4">
          {!loading &&
            transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="block bg-slate-900/50 backdrop-blur-sm border border-slate-800 hover:border-slate-700 rounded-xl p-6 transition-all duration-200 hover:shadow-xl hover:shadow-blue-900/10"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        transaction.transaction_type === "ISSUE"
                          ? "bg-emerald-500"
                          : transaction.transaction_type === "REVOKE"
                            ? "bg-red-500"
                            : "bg-blue-500"
                      }`}
                    ></div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        transaction.transaction_type === "ISSUE"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : transaction.transaction_type === "REVOKE"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      {transaction.transaction_type}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {transaction.transaction_type === "ISSUE" && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Certificate Issued to {transaction.metadata.ownerName}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Study Program:</p>
                          <p className="text-white">
                            {transaction.metadata.studyProgram}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">File Name:</p>
                          <p className="text-white font-mono text-xs">
                            {transaction.metadata.fileName}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Issuer:</p>
                          <p className="text-white">
                            {transaction.metadata.issuer}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">File Hash:</p>
                          <p className="text-white font-mono text-xs break-all">
                            {transaction.metadata.fileHash}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {transaction.transaction_type === "REVOKE" && (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Certificate Revoked
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400">Reason:</p>
                          <p className="text-white">
                            {transaction.metadata.reason}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">
                            Target Certificate ID:
                          </p>
                          <p className="text-white font-mono text-xs break-all">
                            {transaction.metadata.target_cert_id}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Issuer:</p>
                          <p className="text-white">
                            {transaction.metadata.issuer}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-slate-700 pt-3">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-slate-400 mb-1">Previous Hash:</p>
                        <p className="text-slate-300 font-mono break-all">
                          {transaction.previous_hash}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400 mb-1">Current Hash:</p>
                        <p className="text-slate-300 font-mono break-all">
                          {transaction.current_hash}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-slate-400 mb-1 text-xs">Signature:</p>
                      <p className="text-slate-300 font-mono break-all text-xs">
                        {transaction.signature}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {!loading && transactions.length === 0 && (
          <div className="text-center py-16">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-slate-400">No transactions issued yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

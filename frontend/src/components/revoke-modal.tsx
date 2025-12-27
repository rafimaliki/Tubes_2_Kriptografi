import { useState } from "react";

interface RevokeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export function RevokeModal({ isOpen, onClose, onConfirm }: RevokeModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError("Form must not be empty");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await onConfirm(reason);
    } catch (err: any) {
      setError(err?.message || "Failed to revoke certificate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">Revoke Certificate</h2>

        <textarea
          placeholder="Reason for revocation..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-white"
        />

        {error && (
          <p className="text-red-400 text-sm mt-3">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-slate-700 rounded-lg text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white disabled:opacity-50"
          >
            {loading ? "Revoking..." : "Confirm Revoke"}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { CertificateAPI } from "@/api/certificate.api";
import { Crypto } from "@/lib/Crypto";

interface UploadCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadCertificateModal({
  isOpen,
  onClose,
}: UploadCertificateModalProps) {
  const [ownerName, setOwnerName] = useState("");
  const [study, setStudy] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    console.log("file status:", file);
    e.preventDefault();

    if (!file) {
      alert("Please select a file first");
      return;
    }

    setIsSubmitting(true);

    try {
      const rawUser = localStorage.getItem("app_user");

      console.log("rawUser:", rawUser);

      if (!rawUser) {
        alert("Not authenticated");
        return;
      }

      let user: any;
      try {
        const decoded = atob(rawUser);
        user = JSON.parse(decoded);
      } catch (err) {
        console.error("Failed to decode user:", err);
        alert("Invalid user session, please login again");
        localStorage.removeItem("app_user");
        return;
      }


      const buffer = await file.arrayBuffer();
      const hash = await crypto.subtle.digest("SHA-256", buffer);
      const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hash)));

      const signature = await Crypto.signNonce(hashBase64, user.private_key);

      await CertificateAPI.issue({
        file,
        ownerName,
        study,
        signature,
        issuerAddress: user.name,
      });

      alert("Certificate uploaded successfully");

      setOwnerName("");
      setStudy("");
      setFile(null);
      onClose();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">Upload Certificate</h2>
          <button
            title= "Close"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
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
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Certificate File
            </label>

            <div
              onClick={() => document.getElementById("cert-file-input")?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const droppedFile = e.dataTransfer.files?.[0];
                if (droppedFile) setFile(droppedFile);
              }}
              className={`rounded-lg p-8 text-center transition-colors cursor-pointer border-2 ${
                file
                  ? "border-emerald-500/60 bg-emerald-500/10"
                  : "border-dashed border-slate-700 hover:border-slate-600"
              }`}
            >
              {file ? (
                <>
                  <svg
                    className="w-12 h-12 text-emerald-400 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <p className="text-emerald-300 text-sm font-medium">
                    {file.name}
                  </p>
                  <p className="text-emerald-400/70 text-xs mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <p className="text-emerald-400/60 text-xs mt-2">
                    Click or drop another file to replace
                  </p>
                </>
              ) : (
                <>
                  <svg
                    className="w-12 h-12 text-slate-600 mx-auto mb-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-slate-400 text-sm">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-slate-600 text-xs mt-1">PDF or TXT</p>
                </>
              )}
            </div>

            <input
              title="Upload certificate file"
              id="cert-file-input"
              type="file"
              accept=".pdf,.txt"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>


          {/* Owner */}
          <div>
            <label
              htmlFor="ownerName"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Owner Name
            </label>
            <input
              type="text"
              id="ownerName"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              placeholder="John Doe"
              required
            />
          </div>

          {/* Course */}
          <div>
            <label
              htmlFor="study"
              className="block text-sm font-medium text-slate-300 mb-2"
            >
              Study/Course
            </label>
            <input
              type="text"
              id="study"
              value={study}
              onChange={(e) => setStudy(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              placeholder="Advanced Web Development"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

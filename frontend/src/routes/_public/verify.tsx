import { createFileRoute } from "@tanstack/react-router";
import { AppTopbar } from "@/components/app-topbar";
import { CertificateAPI } from "@/api/certificate.api";
import { useState, useEffect } from "react";
import CryptoJS from "crypto-js";
import { FileWatermark } from "@/lib/FileWatermark";
import { Crypto } from "@/lib/Crypto";

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decryptedData, setDecryptedData] = useState<{
    blob: Blob;
    fileType: string;
    fileName: string;
    url: string;
  } | null>(null);
  const [textContent, setTextContent] = useState<string>("");
  const [transactionStatus, setTransactionStatus] = useState<'valid' | 'invalid' | 'revoked' | null>(null);
  const [transactionData, setTransactionData] = useState<any>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [signatureValid, setSignatureValid] = useState<boolean | null>(null);
  const [signatureError, setSignatureError] = useState<string | null>(null);

  useEffect(() => {
    const validateTransaction = async () => {
      if (!tx_hash) {
        setTransactionError("No transaction hash provided");
        return;
      }

      try {
        const result = await CertificateAPI.getTransaction(tx_hash);
        setTransactionData(result);
        setTransactionStatus(result.status);

        if (result.status === 'invalid') {
          setTransactionError("Transaction validation failed - ledger integrity compromised");
        } else if (result.status === 'revoked') {
          setTransactionError(`This certificate has been revoked. Reason: ${result.revokeReason || 'Not specified'}`);
        }
      } catch (err: any) {
        console.error("Transaction validation failed:", err);
        if (err.response?.status === 404) {
          setTransactionError("Transaction not found in the ledger");
        } else {
          setTransactionError("Failed to validate transaction");
        }
        setTransactionStatus('invalid');
      }
    };

    validateTransaction();
  }, [tx_hash]);

  // Auto-load and decrypt on mount
  useEffect(() => {
    let objectUrl: string | null = null;

    const loadAndDecrypt = async () => {
      if (!cert_url || !aes_key) {
        if (!cert_url) setError("No certificate URL provided");
        else if (!aes_key) setError("No AES key provided");
        return;
      }

      if (transactionStatus === 'invalid' || transactionStatus === 'revoked') {
        return;
      }

      if (transactionStatus === null) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Download encrypted file
        const encryptedBlob = await CertificateAPI.download(cert_url);
        const encryptedText = await encryptedBlob.text();

        // Decrypt
        let decryptedBase64: string;
        try {
          const decrypted = CryptoJS.AES.decrypt(encryptedText, aes_key);
          decryptedBase64 = decrypted.toString(CryptoJS.enc.Utf8);

          if (!decryptedBase64) {
            setError("Decryption failed. The AES key provided is incorrect or the file is corrupted.");
            return;
          }
        } catch (decryptError) {
          setError("Decryption failed. The AES key provided is incorrect or the file is corrupted.");
          return;
        }

        // Convert base64 to binary
        try {
          const binaryString = atob(decryptedBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          // Determine file type from cert_url prefix
          let mimeType = "application/octet-stream";
          let fileExtension = "";
          let fileType = "unknown";

          if (cert_url.startsWith("pdf-")) {
            mimeType = "application/pdf";
            fileExtension = ".pdf";
            fileType = "pdf";
          } else if (cert_url.startsWith("txt-")) {
            mimeType = "text/plain";
            fileExtension = ".txt";
            fileType = "txt";
          } else if (cert_url.startsWith("img-")) {
            fileType = "img";
            mimeType = "image/png";
            fileExtension = ".png";

            if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
              mimeType = "image/jpeg";
              fileExtension = ".jpg";
            } else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
              mimeType = "image/png";
              fileExtension = ".png";
            } else if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
              mimeType = "image/gif";
              fileExtension = ".gif";
            } else if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
              mimeType = "image/bmp";
              fileExtension = ".bmp";
            } else if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
              mimeType = "image/webp";
              fileExtension = ".webp";
            }
          }

          const decryptedBlob = new Blob([bytes], { type: mimeType });
          
          // Verify signature
          if (transactionData?.transaction?.signature) {
            try {
              const fileHash = await crypto.subtle.digest("SHA-256", bytes.buffer);
              const fileHashBase64 = btoa(String.fromCharCode(...new Uint8Array(fileHash)));
              
              // Public key for verification
              const PUBLIC_KEY = "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEdbM2Zu9DeddJh6Ri+0svQViWXDNl41I6OHwIU5NdPWCwDuylEJfvWXZkGzXcfeNdhS8OGh0Ub4l1fURVnUlb6g==";
              
              // Verify the signature
              const isValid = await Crypto.verifySignature(
                fileHashBase64,
                transactionData.transaction.signature,
                PUBLIC_KEY
              );
              
              setSignatureValid(isValid);
              
              if (!isValid) {
                setSignatureError("File signature verification failed - file may have been tampered with");
              }
            } catch (err) {
              console.error("Signature verification error:", err);
              setSignatureError("Failed to verify file signature");
              setSignatureValid(false);
            }
          }
          
          // Remove .enc extension and add appropriate file extension
          const baseFileName = cert_url.replace('.enc', '').replace(/^(pdf|txt|img)-/, '');
          const fileName = baseFileName + fileExtension;

          // Build verification URL
          const verificationUrl = `${window.location.origin}/verify?cert_url=${encodeURIComponent(cert_url)}&aes_key=${encodeURIComponent(aes_key)}&tx_hash=${encodeURIComponent(tx_hash || '')}`;

          // Add watermark to the file
          const watermarkedBlob = await FileWatermark.addWatermark(decryptedBlob, fileType, verificationUrl);
          
          const url = window.URL.createObjectURL(watermarkedBlob);
          objectUrl = url;

          setDecryptedData({
            blob: watermarkedBlob,
            fileType,
            fileName,
            url,
          });

          if (fileType === "txt") {
            const text = await watermarkedBlob.text();
            setTextContent(text);
          }
        } catch (base64Error) {
          setError("Decryption failed. The AES key provided is incorrect or the file is corrupted.");
          return;
        }
      } catch (error: any) {
        console.error("Load failed:", error);

        if (error.response?.status === 404) {
          setError("Certificate file not found. The certificate may have been removed or the URL is incorrect.");
        } else {
          setError("An unexpected error occurred while loading the certificate. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadAndDecrypt();

    // Cleanup
    return () => {
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [cert_url, aes_key, transactionStatus]);

  const handleDownload = () => {
    if (!decryptedData) return;

    const link = document.createElement('a');
    link.href = decryptedData.url;
    link.download = decryptedData.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <AppTopbar title="Back" to="/search" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 sm:p-12 shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-8">Certificate Verification</h1>
          
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-red-400 font-semibold mb-1">Error</h3>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {isLoading && (
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-blue-300 text-sm">Loading and decrypting certificate...</p>
            </div>
          )}

          {transactionError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-red-400 font-semibold mb-1">Transaction Error</h3>
                <p className="text-red-300 text-sm">{transactionError}</p>
              </div>
            </div>
          )}

          {signatureError && (
            <div className="mb-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-start gap-3">
              <svg className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-orange-400 font-semibold mb-1">Signature Verification Warning</h3>
                <p className="text-orange-300 text-sm">{signatureError}</p>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">Certificate URL</label>
              <p className="text-sm font-mono text-slate-300 bg-slate-950 px-4 py-3 rounded-lg border border-slate-800 break-all">
                {cert_url || "N/A"}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">AES Key</label>
              <p className="text-sm font-mono text-slate-300 bg-slate-950 px-4 py-3 rounded-lg border border-slate-800 break-all">
                {aes_key || "N/A"}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-2">Transaction Hash</label>
              <p className="text-sm font-mono text-slate-300 bg-slate-950 px-4 py-3 rounded-lg border border-slate-800 break-all">
                {tx_hash || "N/A"}
              </p>
            </div>

            {transactionStatus && (
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">Transaction Status</label>
                <span className={`inline-block px-3 py-1 rounded-full font-medium ${
                  transactionStatus === "valid"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : transactionStatus === "revoked"
                    ? "bg-red-500/20 text-red-400"
                    : "bg-orange-500/20 text-orange-400"
                }`}>
                  {transactionStatus.charAt(0).toUpperCase() + transactionStatus.slice(1)}
                </span>
              </div>
            )}

            {signatureValid !== null && (
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-2">File Signature</label>
                <span className={`inline-block px-3 py-1 rounded-full font-medium ${
                  signatureValid
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"
                }`}>
                  {signatureValid ? "Valid" : "Invalid"}
                </span>
              </div>
            )}

            {transactionStatus === 'valid' && transactionData?.transaction && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-500 mb-3">Transaction Metadata</label>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Owner Name</label>
                      <p className="text-sm text-slate-300">{transactionData.transaction.metadata?.ownerName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Study Program</label>
                      <p className="text-sm text-slate-300">{transactionData.transaction.metadata?.studyProgram || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Issuer</label>
                      <p className="text-sm text-slate-300">{transactionData.transaction.metadata?.issuer || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">Issue Date</label>
                      <p className="text-sm text-slate-300">
                        {transactionData.transaction.metadata?.timestamp 
                          ? new Date(transactionData.transaction.metadata.timestamp).toLocaleString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Previous Hash</label>
                    <p className="text-xs font-mono text-slate-400 break-all">{transactionData.transaction.previous_hash}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">File Hash</label>
                    <p className="text-xs font-mono text-slate-400 break-all">{transactionData.transaction.metadata?.fileHash || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {decryptedData && transactionStatus === 'valid' && (
              <>
                {/* Certificate Preview */}
                <div className="mt-8">
                  <label className="block text-sm font-medium text-slate-500 mb-2">Certificate Preview</label>
                  <div className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                    {decryptedData.fileType === "pdf" && (
                      <iframe
                        src={decryptedData.url}
                        className="w-full h-[600px]"
                        title="Certificate PDF"
                      />
                    )}
                    
                    {decryptedData.fileType === "txt" && (
                      <div className="p-6">
                        <pre className="text-slate-300 text-sm whitespace-no-wrap overflow-x-auto font-mono">
                          {textContent}
                        </pre>
                      </div>
                    )}
                    
                    {decryptedData.fileType === "img" && (
                      <div className="flex items-center justify-center p-6">
                        <img
                          src={decryptedData.url}
                          alt="Certificate"
                          className="max-w-full h-auto rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Download Button */}
                <div className="pt-6">
                  <button
                    onClick={handleDownload}
                    className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Certificate
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

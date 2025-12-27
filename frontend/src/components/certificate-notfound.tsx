import { Link } from "@tanstack/react-router";

interface CertificateNotFoundProps {
  returnTo: string;
}
export const CertificateNotFound = ({ returnTo }: CertificateNotFoundProps) => {
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
          to={returnTo}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all duration-200 inline-block"
        >
          Go Back
        </Link>
      </div>
    </div>
  );
};

import { Link } from "@tanstack/react-router";

interface AppTopbarProps {
  title: string;
  to: string;
}

export const AppTopbar = ({ title, to }: AppTopbarProps) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link
          to={to}
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
          {title}
        </Link>
      </div>
    </header>
  );
};

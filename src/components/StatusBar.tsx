import React from "react";
import { RotateCcw } from "lucide-react";

interface StatusBarProps {
  error?: string | null;
  status: string | null;
  onRetry?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ error, status, onRetry }) => {
  if (!error && !status ) return null;
  return (
    <div className="w-full px-4 py-2 bg-gray-100 border-t border-gray-200 text-gray-700 text-center text-sm font-medium
      dark:bg-gray-900 dark:text-gray-200 dark:border-gray-800 flex items-center justify-center gap-2">
      {error ? (
        <span className="flex items-center gap-2">
          <span className="text-red-500 font-semibold dark:text-red-400">{error}</span>
          {onRetry && (
            <button
              onClick={onRetry}
              title="Reintentar"
              aria-label="Reintentar"
              className="ml-1 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 transition"
              type="button"
            >
              <RotateCcw size={18} />
            </button>
          )}
        </span>
      ) : (
        <span className="font-semibold">{status}</span>
      )}
    </div>
  );
};

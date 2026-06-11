import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export const SpaWorkspaceFallback = ({
  title = 'Workspace unavailable',
  message = 'Your spa workspace could not be loaded for this account. Please sign in again or create a spa profile before using owner features.',
}: {
  title?: string;
  message?: string;
}) => (
  <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-8 text-amber-900 shadow-sm">
    <div className="flex items-start gap-4">
      <div className="rounded-full bg-amber-100 p-3 text-amber-700">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-amber-800">{message}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/login"
            className="rounded-lg bg-amber-600 px-4 py-2 font-medium text-white transition-colors hover:bg-amber-700"
          >
            Back to login
          </Link>
          <Link
            to="/register"
            className="rounded-lg border border-amber-300 bg-white px-4 py-2 font-medium text-amber-900 transition-colors hover:bg-amber-100"
          >
            Create spa account
          </Link>
        </div>
      </div>
    </div>
  </div>
);

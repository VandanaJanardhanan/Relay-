import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import Button from '../components/common/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">404</h1>
        <p className="text-sm font-semibold text-slate-700 mt-2">Page Not Found</p>
        <p className="text-xs text-slate-500 mt-1">
          The requested dispatch route does not exist or has been relocated.
        </p>
        <div className="mt-6 flex justify-center">
          <Link to="/">
            <Button variant="primary" size="sm" icon={ArrowLeft}>
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}


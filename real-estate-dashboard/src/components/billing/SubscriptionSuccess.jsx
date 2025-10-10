import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const SubscriptionSuccess = () => {
  const q = useQuery();
  const subscriptionId = q.get('subscription_id');
  const invoiceId = q.get('invoice_id');
  const status = q.get('status') || 'open';

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow p-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">✓</span>
          <h1 className="text-2xl font-semibold">Abo erfolgreich gestartet</h1>
        </div>
        <p className="text-gray-600 mb-6">Vielen Dank! Ihr Abonnement wurde eingerichtet. Die erste Rechnung ist {status === 'open' ? 'offen' : status}.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {subscriptionId && (
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="text-xs text-gray-500">Subscription ID</div>
              <div className="text-sm font-mono break-all">{subscriptionId}</div>
            </div>
          )}
          {invoiceId && (
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="text-xs text-gray-500">Invoice ID</div>
              <div className="text-sm font-mono break-all">{invoiceId}</div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Link to="/" className="px-4 py-2 rounded-lg bg-indigo-600 text-white">Zum Dashboard</Link>
          <Link to="/subscription" className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800">Abo verwalten</Link>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;

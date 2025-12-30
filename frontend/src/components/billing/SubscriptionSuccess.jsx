import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
      <Card className="w-full max-w-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Badge className="h-10 w-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center">✓</Badge>
            <CardTitle>Abo erfolgreich gestartet</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">Vielen Dank! Ihr Abonnement wurde eingerichtet. Die erste Rechnung ist {status === 'open' ? 'offen' : status}.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {subscriptionId && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">Subscription ID</div>
                  <div className="text-sm font-mono break-all">{subscriptionId}</div>
                </CardContent>
              </Card>
            )}
            {invoiceId && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">Invoice ID</div>
                  <div className="text-sm font-mono break-all">{invoiceId}</div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex gap-3">
            <Button asChild>
              <Link to="/">Zum Dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/subscription">Abo verwalten</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;

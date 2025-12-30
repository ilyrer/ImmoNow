import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useResetPassword } from '../../api/hooks';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const ResetPassword = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const presetToken = query.get('token') || '';
  const [token, setToken] = useState(presetToken);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const resetMutation = useResetPassword();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error('Reset-Token fehlt.');
    if (!password || password.length < 8) return toast.error('Passwort muss mindestens 8 Zeichen lang sein.');
    if (password !== confirm) return toast.error('Passwörter stimmen nicht überein.');
    try {
      await resetMutation.mutateAsync({ token, new_password: password });
      toast.success('Passwort wurde zurückgesetzt. Bitte melden Sie sich an.');
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || 'Zurücksetzen fehlgeschlagen';
      toast.error(String(msg));
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Passwort zurücksetzen</CardTitle>
          <p className="text-sm text-muted-foreground">Geben Sie Ihr neues Passwort ein. Fügen Sie den Token ein, falls er nicht automatisch übernommen wurde.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>Token</Label>
              <Input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Token aus der E-Mail"
                required
              />
            </div>
            <div>
              <Label>Neues Passwort</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
            <div>
              <Label>Passwort bestätigen</Label>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>
            <Button
              type="submit"
              disabled={resetMutation.isPending}
              className="w-full"
            >
              {resetMutation.isPending ? 'Wird gespeichert…' : 'Passwort setzen'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;

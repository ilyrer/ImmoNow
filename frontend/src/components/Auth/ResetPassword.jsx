import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useResetPassword } from '../../api/hooks';
import { toast } from 'react-hot-toast';

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-semibold mb-1">Passwort zurücksetzen</h1>
        <p className="text-sm text-gray-500 mb-6">Geben Sie Ihr neues Passwort ein. Fügen Sie den Token ein, falls er nicht automatisch übernommen wurde.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Token</label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Token aus der E-Mail"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Neues Passwort</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Passwort bestätigen</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            disabled={resetMutation.isPending}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {resetMutation.isPending ? 'Wird gespeichert…' : 'Passwort setzen'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

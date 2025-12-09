/**
 * OAuth Callback Page
 * 
 * Handles OAuth redirects from social media platforms.
 * Extracts authorization code and state from URL, sends to backend for token exchange.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, ExternalLink } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/config';
import toast from 'react-hot-toast';
import PortalLogo from '../components/common/PortalLogo';

interface OAuthCallbackResponse {
    success: boolean;
    account_id: string;
    platform: string;
    account_name: string;
    message: string;
}

const OAuthCallbackPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [accountInfo, setAccountInfo] = useState<OAuthCallbackResponse | null>(null);

    // Mutation for processing OAuth callback
    const processCallbackMutation = useMutation({
        mutationFn: async (params: { code: string; state: string }) => {
            const response = await apiClient.post<OAuthCallbackResponse>('/api/v1/social/oauth/callback', {
                code: params.code,
                state: params.state,
            });
            return response;
        },
        onSuccess: (data) => {
            setStatus('success');
            setAccountInfo(data);
            toast.success(data.message || `${data.platform} Account erfolgreich verbunden!`);

            // Redirect to SocialHub after 2 seconds
            setTimeout(() => {
                navigate('/social-hub?tab=accounts', { replace: true });
            }, 2000);
        },
        onError: (error: any) => {
            setStatus('error');
            const message = error.response?.data?.detail || 'OAuth-Authentifizierung fehlgeschlagen';
            setErrorMessage(message);
            toast.error(message);
        },
    });

    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Handle OAuth error response
        if (error) {
            setStatus('error');
            setErrorMessage(errorDescription || error || 'OAuth-Authentifizierung abgelehnt');
            return;
        }

        // Validate required parameters
        if (!code || !state) {
            setStatus('error');
            setErrorMessage('Fehlende OAuth-Parameter. Bitte versuchen Sie es erneut.');
            return;
        }

        // Process the callback
        processCallbackMutation.mutate({ code, state });
    }, [searchParams]);

    const getPlatformIcon = (platform: string) => {
        const icons: Record<string, string> = {
            instagram: '📷',
            facebook: '📘',
            linkedin: '💼',
            youtube: '🎬',
            tiktok: '🎵',
            immoscout24: '🏠',
            immowelt: '🏡',
        };
        return icons[platform.toLowerCase()] || '🔗';
    };

    const getPlatformName = (platform: string) => {
        const names: Record<string, string> = {
            instagram: 'Instagram',
            facebook: 'Facebook',
            linkedin: 'LinkedIn',
            youtube: 'YouTube',
            tiktok: 'TikTok',
            immoscout24: 'ImmoScout24',
            immowelt: 'Immowelt',
        };
        return names[platform.toLowerCase()] || platform;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 dark:border-gray-700/50 p-8 max-w-md w-full text-center"
            >
                {/* Processing State */}
                {status === 'processing' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                    >
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Verbindung wird hergestellt...
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Bitte warten Sie, während wir Ihr Konto verbinden.
                        </p>
                    </motion.div>
                )}

                {/* Success State */}
                {status === 'success' && accountInfo && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4"
                    >
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Erfolgreich verbunden!
                        </h2>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                            <div className="flex items-center justify-center gap-3 mb-2">
                                <PortalLogo
                                    portal={accountInfo.platform.toLowerCase() as any}
                                    size="md"
                                />
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    {getPlatformName(accountInfo.platform)}
                                </span>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400">
                                {accountInfo.account_name}
                            </p>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Sie werden in Kürze weitergeleitet...
                        </p>
                    </motion.div>
                )}

                {/* Error State */}
                {status === 'error' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4"
                    >
                        <div className="w-16 h-16 mx-auto bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center">
                            <XCircle className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Verbindung fehlgeschlagen
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            {errorMessage}
                        </p>
                        <div className="flex gap-3 justify-center pt-4">
                            <button
                                onClick={() => navigate('/social-hub?tab=accounts')}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                Zurück zum SocialHub
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-colors"
                            >
                                Erneut versuchen
                            </button>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default OAuthCallbackPage;

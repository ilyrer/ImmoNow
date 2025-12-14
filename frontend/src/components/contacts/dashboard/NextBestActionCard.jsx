import React, { useState } from 'react';

/**
 * NextBestActionCard - AI-recommended next action with script/template
 * 
 * Features:
 * - Action type with icon (call/email/meeting/note)
 * - Urgency indicator (24h/48h/this_week)
 * - Reason explanation
 * - Suggested script/template
 * - Action buttons: Generate Email, Mark Done, Dismiss
 */
const NextBestActionCard = ({
    recommendation,
    onGenerateEmail,
    onMarkDone,
    onRefresh,
    loading = false
}) => {

    const [dismissed, setDismissed] = useState(false);

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-600/10 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-6 shadow-xl animate-pulse">
                <div className="h-6 bg-white/10 rounded w-1/2 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-4 bg-white/10 rounded w-full"></div>
                    <div className="h-4 bg-white/10 rounded w-5/6"></div>
                    <div className="h-10 bg-white/10 rounded w-1/3 mt-4"></div>
                </div>
            </div>
        );
    }

    if (!recommendation || dismissed) {
        return (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-xl text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center mb-4">
                    <i className="ri-checkbox-circle-line text-3xl text-white"></i>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Keine offenen Empfehlungen</h3>
                <p className="text-sm text-gray-400 mb-4">
                    Alle vorgeschlagenen Aktionen wurden bearbeitet.
                </p>
                <button
                    onClick={onRefresh}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white text-sm font-medium transition-all"
                >
                    <i className="ri-refresh-line mr-2"></i>
                    Neue Empfehlung
                </button>
            </div>
        );
    }

    const { action_type, urgency, reason, script } = recommendation;

    // Action type configuration
    const actionConfig = {
        call: {
            icon: 'ri-phone-line',
            label: 'Anruf',
            color: 'from-emerald-500 to-green-600',
            bgColor: 'bg-emerald-500/10',
            textColor: 'text-emerald-400',
            borderColor: 'border-emerald-500/30'
        },
        email: {
            icon: 'ri-mail-line',
            label: 'E-Mail',
            color: 'from-indigo-500 to-purple-600',
            bgColor: 'bg-indigo-500/10',
            textColor: 'text-indigo-400',
            borderColor: 'border-indigo-500/30'
        },
        meeting: {
            icon: 'ri-calendar-line',
            label: 'Termin',
            color: 'from-amber-500 to-orange-600',
            bgColor: 'bg-amber-500/10',
            textColor: 'text-amber-400',
            borderColor: 'border-amber-500/30'
        },
        note: {
            icon: 'ri-sticky-note-line',
            label: 'Notiz',
            color: 'from-blue-500 to-cyan-600',
            bgColor: 'bg-blue-500/10',
            textColor: 'text-blue-400',
            borderColor: 'border-blue-500/30'
        }
    };

    const config = actionConfig[action_type] || actionConfig.call;

    // Urgency configuration
    const urgencyConfig = {
        '24h': {
            label: 'Dringend (24h)',
            color: 'text-red-400',
            icon: 'ri-alarm-warning-line',
            bgColor: 'bg-red-500/10'
        },
        '48h': {
            label: 'Bald (48h)',
            color: 'text-orange-400',
            icon: 'ri-time-line',
            bgColor: 'bg-orange-500/10'
        },
        'this_week': {
            label: 'Diese Woche',
            color: 'text-amber-400',
            icon: 'ri-calendar-check-line',
            bgColor: 'bg-amber-500/10'
        }
    };

    const urgencyInfo = urgencyConfig[urgency] || urgencyConfig['48h'];

    const handleMarkDone = () => {
        setDismissed(true);
        if (onMarkDone) {
            onMarkDone();
        }
    };

    return (
        <div className={`bg-gradient-to-br ${config.bgColor} backdrop-blur-xl border ${config.borderColor} rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all`}>

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                    <div className={`p-3 bg-gradient-to-br ${config.color} rounded-xl shadow-lg`}>
                        <i className={`${config.icon} text-2xl text-white`}></i>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                            Empfohlene Aktion: {config.label}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${urgencyInfo.color} ${urgencyInfo.bgColor}`}>
                                <i className={urgencyInfo.icon}></i>
                                {urgencyInfo.label}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                <i className="ri-sparkling-line"></i>
                                KI-Empfehlung
                            </span>
                        </div>
                    </div>
                </div>

                {/* Dismiss button */}
                <button
                    onClick={() => setDismissed(true)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
                    title="Verwerfen"
                >
                    <i className="ri-close-line text-gray-400 group-hover:text-white"></i>
                </button>
            </div>

            {/* Reason */}
            <div className="mb-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-start gap-2">
                    <i className="ri-lightbulb-line text-amber-400 mt-0.5"></i>
                    <div className="flex-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Begründung</p>
                        <p className="text-sm text-gray-200 leading-relaxed">{reason}</p>
                    </div>
                </div>
            </div>

            {/* Script/Template */}
            <div className="mb-4 p-4 bg-white/10 border border-white/20 rounded-xl">
                <div className="flex items-start gap-2">
                    <i className="ri-file-text-line text-indigo-400 mt-0.5"></i>
                    <div className="flex-1">
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                            {action_type === 'email' ? 'Vorgeschlagener Text' : 'Gesprächseinstieg'}
                        </p>
                        <p className="text-sm text-white leading-relaxed whitespace-pre-line">{script}</p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">

                {/* Generate Email (only for email actions) */}
                {action_type === 'email' && onGenerateEmail && (
                    <button
                        onClick={onGenerateEmail}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r ${config.color} hover:opacity-90 rounded-xl text-white font-semibold transition-all hover:scale-105 shadow-lg`}
                    >
                        <i className="ri-mail-send-line text-lg"></i>
                        <span>E-Mail generieren</span>
                    </button>
                )}

                {/* Execute Action (for other types) */}
                {action_type !== 'email' && (
                    <button
                        onClick={handleMarkDone}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r ${config.color} hover:opacity-90 rounded-xl text-white font-semibold transition-all hover:scale-105 shadow-lg`}
                    >
                        <i className={`${config.icon} text-lg`}></i>
                        <span>Jetzt {config.label}</span>
                    </button>
                )}

                {/* Mark as Done */}
                <button
                    onClick={handleMarkDone}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white font-medium transition-all hover:scale-105"
                >
                    <i className="ri-checkbox-circle-line"></i>
                    <span>Erledigt</span>
                </button>

                {/* Refresh */}
                <button
                    onClick={onRefresh}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-400 hover:text-white font-medium transition-all"
                    title="Neue Empfehlung"
                >
                    <i className="ri-refresh-line"></i>
                </button>
            </div>

            {/* Footer info */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-gray-400">
                <i className="ri-information-line"></i>
                <span>
                    Diese Empfehlung basiert auf Lead Score, Aktivitätshistorie und aktueller Funnel-Phase.
                </span>
            </div>
        </div>
    );
};

export default NextBestActionCard;

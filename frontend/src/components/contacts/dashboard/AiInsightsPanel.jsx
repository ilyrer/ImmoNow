import React from 'react';

/**
 * AiInsightsPanel - AI-powered insights with summary, score breakdown, and segmentation
 * 
 * Features:
 * - AI-generated 3-5 sentence customer summary
 * - Lead score breakdown with weighted factors
 * - Segment classification (A-Kunde, Warmes Lead, etc.)
 * - Top contributing signals with impact visualization
 */
const AiInsightsPanel = ({
    aiInsights,
    leadScore,
    loading = false
}) => {

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-pulse">
                        <div className="h-4 bg-white/10 rounded w-3/4 mb-4"></div>
                        <div className="space-y-2">
                            <div className="h-3 bg-white/10 rounded w-full"></div>
                            <div className="h-3 bg-white/10 rounded w-5/6"></div>
                            <div className="h-3 bg-white/10 rounded w-4/6"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!aiInsights || !leadScore) {
        return null;
    }

    const { summary, score_explanation, segment, top_signals } = aiInsights;
    const { breakdown } = leadScore;

    // Icon mapping for signals
    const getSignalIcon = (iconName) => {
        const iconMap = {
            'building': 'ri-building-line',
            'building-2': 'ri-building-2-line',
            'tag': 'ri-price-tag-3-line',
            'vip-crown': 'ri-vip-crown-line',
            'flag': 'ri-flag-line',
            'money-euro-circle': 'ri-money-euro-circle-line',
            'wallet': 'ri-wallet-line',
            'calendar-check': 'ri-calendar-check-line',
            'calendar': 'ri-calendar-line',
            'calendar-close': 'ri-calendar-close-line',
            'history': 'ri-history-line',
            'speed': 'ri-speed-line',
            'message-2': 'ri-message-2-line',
            'calendar-event': 'ri-calendar-event-line',
            'apps': 'ri-apps-line'
        };
        return iconMap[iconName] || 'ri-information-line';
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

            {/* Card 1: AI Summary */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-600/10 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="flex items-start gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                        <i className="ri-sparkling-line text-2xl text-white"></i>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">KI-Zusammenfassung</h3>
                        <p className="text-xs text-gray-400">Automatisch generiert</p>
                    </div>
                </div>

                <p className="text-sm text-gray-300 leading-relaxed">
                    {summary}
                </p>

                <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-indigo-400">
                    <i className="ri-lightbulb-flash-line"></i>
                    <span>Powered by AI</span>
                </div>
            </div>

            {/* Card 2: Lead Score Breakdown */}
            <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="flex items-start gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                        <i className="ri-bar-chart-box-line text-2xl text-white"></i>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">Score-Aufschlüsselung</h3>
                        <p className="text-xs text-gray-400">Gewichtete Faktoren</p>
                    </div>
                </div>

                {/* Score explanation */}
                <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                    {score_explanation}
                </p>

                {/* Breakdown bars */}
                <div className="space-y-3">
                    {breakdown && breakdown.map((item, idx) => {
                        const percentage = (item.value / item.weight) * 100;

                        // Color based on factor
                        const colorMap = {
                            'Firmografische Daten': 'from-blue-500 to-cyan-500',
                            'Potenzialwert': 'from-emerald-500 to-green-500',
                            'Aktualität': 'from-amber-500 to-orange-500',
                            'Engagement': 'from-purple-500 to-pink-500'
                        };
                        const gradient = colorMap[item.factor] || 'from-gray-500 to-gray-600';

                        return (
                            <div key={idx} className="group">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
                                        {item.factor}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {Math.round(item.value)}/{item.weight}
                                    </span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full bg-gradient-to-r ${gradient} transition-all duration-500 ease-out`}
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                                {/* Tooltip on hover */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                    <p className="text-xs text-gray-400 italic">{item.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Top signals */}
                {top_signals && top_signals.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Top-Signale</p>
                        <div className="space-y-2">
                            {top_signals.map((signal, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                    <i className={`${getSignalIcon(signal.icon)} text-amber-400`}></i>
                                    <span className="text-gray-300">{signal.name}:</span>
                                    <span className="text-white font-medium">{signal.value}</span>
                                    <span className="ml-auto text-emerald-400">+{signal.impact}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Card 3: Segment Classification */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-green-600/10 backdrop-blur-xl border border-emerald-500/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow">
                <div className="flex items-start gap-3 mb-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl">
                        <i className="ri-price-tag-3-line text-2xl text-white"></i>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">Kundensegment</h3>
                        <p className="text-xs text-gray-400">Klassifizierung</p>
                    </div>
                </div>

                {/* Segment badge */}
                <div className="mb-6">
                    <div className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl text-white font-semibold text-lg shadow-lg">
                        <i className="ri-shield-star-line text-2xl"></i>
                        <span>{segment}</span>
                    </div>
                </div>

                {/* Segment breakdown */}
                <div className="space-y-3">
                    {segment.split(' • ').map((part, idx) => {
                        // Icon mapping for segment parts
                        const getSegmentIcon = (part) => {
                            if (part.includes('A-Kunde')) return 'ri-vip-crown-line';
                            if (part.includes('B-Kunde')) return 'ri-user-star-line';
                            if (part.includes('C-Kunde')) return 'ri-user-line';
                            if (part.includes('Heiß')) return 'ri-fire-line';
                            if (part.includes('Warm')) return 'ri-temp-hot-line';
                            if (part.includes('Kalt')) return 'ri-temp-cold-line';
                            if (part.includes('Kaufkraft')) return 'ri-money-euro-circle-line';
                            return 'ri-checkbox-circle-line';
                        };

                        return (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                                <i className={`${getSegmentIcon(part)} text-xl text-emerald-400 mt-0.5`}></i>
                                <div className="flex-1">
                                    <p className="text-sm text-white font-medium">{part}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Insight */}
                <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-start gap-2 text-xs text-gray-300">
                        <i className="ri-information-line text-emerald-400 mt-0.5"></i>
                        <p className="leading-relaxed">
                            Diese Klassifizierung hilft dabei, die Kommunikationsstrategie und Priorität für diesen Kontakt zu optimieren.
                        </p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default AiInsightsPanel;

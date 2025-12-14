import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * CustomerHero - Hero section with contact identity, lead score, and quick actions
 * 
 * Features:
 * - Contact name, company, role/category display
 * - Status badge (Lead/Interessent/Kunde) with color coding
 * - Priority badge with icon
 * - Circular lead score gauge with category coloring (Kalt/Warm/Heiß)
 * - Potential value display
 * - Quick action buttons: Call, Email, Appointment, Note
 */
const CustomerHero = ({
    contact,
    leadScore,
    onCall,
    onEmail,
    onAppointment,
    onNote,
    loading = false
}) => {

    if (loading || !contact) {
        return (
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-6">
                <div className="animate-pulse flex space-x-6">
                    <div className="rounded-full bg-white/10 h-24 w-24"></div>
                    <div className="flex-1 space-y-4">
                        <div className="h-8 bg-white/10 rounded w-3/4"></div>
                        <div className="h-4 bg-white/10 rounded w-1/2"></div>
                        <div className="flex space-x-2">
                            <div className="h-8 bg-white/10 rounded w-20"></div>
                            <div className="h-8 bg-white/10 rounded w-20"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Lead score gauge calculation
    const score = leadScore?.score || 0;
    const category = leadScore?.category || 'warm';
    const categoryLabel = leadScore?.category_label || 'Warm';

    // Category color scheme
    const categoryColors = {
        kalt: {
            gradient: 'from-blue-500 to-cyan-500',
            text: 'text-blue-400',
            glow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/30'
        },
        warm: {
            gradient: 'from-amber-500 to-orange-500',
            text: 'text-amber-400',
            glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/30'
        },
        heiß: {
            gradient: 'from-emerald-500 to-green-500',
            text: 'text-emerald-400',
            glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/30'
        }
    };

    const colors = categoryColors[category] || categoryColors.warm;

    // Circular progress for lead score
    const circumference = 2 * Math.PI * 45; // radius = 45
    const strokeDashoffset = circumference - (score / 100) * circumference;

    // Format currency
    const formatCurrency = (value) => {
        if (!value) return 'Nicht angegeben';
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const budget = contact.budget || contact.budget_max;

    // Status color mapping
    const getStatusColor = (status) => {
        const statusMap = {
            'Lead': 'from-blue-500 to-blue-600',
            'Interessent': 'from-amber-500 to-orange-600',
            'Kunde': 'from-emerald-500 to-green-600',
            'Inaktiv': 'from-gray-500 to-gray-600'
        };
        return statusMap[status] || statusMap['Lead'];
    };

    // Priority icons and colors
    const getPriorityDisplay = (priority) => {
        const priorityMap = {
            urgent: { icon: 'ri-fire-line', label: 'Dringend', color: 'text-red-400', bg: 'bg-red-500/10' },
            high: { icon: 'ri-arrow-up-circle-line', label: 'Hoch', color: 'text-orange-400', bg: 'bg-orange-500/10' },
            medium: { icon: 'ri-arrow-right-circle-line', label: 'Mittel', color: 'text-amber-400', bg: 'bg-amber-500/10' },
            low: { icon: 'ri-arrow-down-circle-line', label: 'Niedrig', color: 'text-gray-400', bg: 'bg-gray-500/10' }
        };
        return priorityMap[priority] || priorityMap.medium;
    };

    const priority = getPriorityDisplay(contact.priority);

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-6 shadow-xl">
            <div className="flex flex-col lg:flex-row gap-8">

                {/* Left: Contact Identity */}
                <div className="flex-1 flex items-start gap-6">
                    {/* Avatar */}
                    <div className="relative">
                        {contact.avatar ? (
                            <img
                                src={contact.avatar}
                                alt={contact.name}
                                className="w-24 h-24 rounded-full object-cover border-2 border-white/20"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-2 border-white/20">
                                {getInitials(contact.name)}
                            </div>
                        )}
                        {/* Status indicator dot */}
                        <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-gray-900"></div>
                    </div>

                    {/* Contact Info */}
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            {contact.name}
                        </h1>

                        <div className="flex items-center gap-3 mb-4 text-gray-400">
                            {contact.company && (
                                <>
                                    <span className="flex items-center gap-1">
                                        <i className="ri-building-line"></i>
                                        {contact.company}
                                    </span>
                                    <span className="text-gray-600">•</span>
                                </>
                            )}
                            {contact.category && (
                                <span className="flex items-center gap-1">
                                    <i className="ri-user-line"></i>
                                    {contact.category}
                                </span>
                            )}
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {/* Status Badge */}
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getStatusColor(contact.status)}`}>
                                <i className="ri-user-star-line"></i>
                                {contact.status}
                            </span>

                            {/* Priority Badge */}
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${priority.color} ${priority.bg}`}>
                                <i className={priority.icon}></i>
                                {priority.label}
                            </span>

                            {/* Source Badge if available */}
                            {contact.preferences?.source && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold text-gray-400 bg-gray-500/10">
                                    <i className="ri-link"></i>
                                    {contact.preferences.source}
                                </span>
                            )}
                        </div>

                        {/* Potential Value */}
                        {budget && (
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg">
                                <i className="ri-money-euro-circle-line text-xl text-emerald-400"></i>
                                <div>
                                    <div className="text-xs text-gray-400">Potenzialwert</div>
                                    <div className="text-lg font-semibold text-white">{formatCurrency(budget)}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Center: Lead Score Gauge */}
                <div className="flex flex-col items-center justify-center px-8 border-l border-r border-white/10 lg:border-l lg:border-r-0">
                    <div className="relative inline-block">
                        {/* SVG Circle Progress */}
                        <svg className="w-32 h-32 transform -rotate-90">
                            {/* Background circle */}
                            <circle
                                cx="64"
                                cy="64"
                                r="45"
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="none"
                                className="text-white/10"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="64"
                                cy="64"
                                r="45"
                                stroke="url(#leadScoreGradient)"
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                className={`transition-all duration-1000 ${colors.glow}`}
                            />
                            {/* Gradient definition */}
                            <defs>
                                <linearGradient id="leadScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" className={`text-${category === 'kalt' ? 'blue' : category === 'warm' ? 'amber' : 'emerald'}-500`} style={{ stopColor: 'currentColor' }} />
                                    <stop offset="100%" className={`text-${category === 'kalt' ? 'cyan' : category === 'warm' ? 'orange' : 'green'}-500`} style={{ stopColor: 'currentColor' }} />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Score in center */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className={`text-4xl font-bold ${colors.text}`}>{score}</div>
                            <div className="text-xs text-gray-400">von 100</div>
                        </div>
                    </div>

                    {/* Category Label */}
                    <div className={`mt-4 px-4 py-2 rounded-full text-sm font-semibold ${colors.text} ${colors.bg} border ${colors.border}`}>
                        {categoryLabel} Lead
                    </div>

                    <div className="text-xs text-gray-400 mt-2 text-center">
                        Abschlusswahrscheinlichkeit: {score}%
                    </div>
                </div>

                {/* Right: Quick Actions */}
                <div className="flex flex-col gap-3 min-w-[200px]">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        Schnellaktionen
                    </h3>

                    {/* Call Button */}
                    <button
                        onClick={onCall}
                        className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-xl text-white font-medium transition-all hover:scale-105 hover:shadow-xl group"
                    >
                        <i className="ri-phone-line text-xl group-hover:rotate-12 transition-transform"></i>
                        <span>Anrufen</span>
                    </button>

                    {/* Email Button */}
                    <button
                        onClick={onEmail}
                        className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-white font-medium transition-all hover:scale-105 hover:shadow-xl group"
                    >
                        <i className="ri-mail-line text-xl group-hover:scale-110 transition-transform"></i>
                        <span>E-Mail</span>
                    </button>

                    {/* Appointment Button */}
                    <button
                        onClick={onAppointment}
                        className="flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white font-medium transition-all hover:scale-105 group"
                    >
                        <i className="ri-calendar-line text-xl group-hover:scale-110 transition-transform"></i>
                        <span>Termin planen</span>
                    </button>

                    {/* Note Button */}
                    <button
                        onClick={onNote}
                        className="flex items-center gap-3 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white font-medium transition-all hover:scale-105 group"
                    >
                        <i className="ri-sticky-note-line text-xl group-hover:scale-110 transition-transform"></i>
                        <span>Notiz</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerHero;

import React from 'react';

/**
 * ActivityStream - Scrollable activity timeline with filters
 * 
 * Features:
 * - Chronological timeline of interactions
 * - Type-based filtering (All/Call/Email/Meeting/Note/Viewing)
 * - Date range filtering
 * - Type-specific icons and colors
 * - User avatars with directory lookup
 * - Smart empty states with CTA
 * - Expandable descriptions
 */
const ActivityStream = ({
    activities,
    userDirectory = {},
    onAddActivity,
    loading = false
}) => {

    const [filter, setFilter] = React.useState('all');
    const [expandedIds, setExpandedIds] = React.useState(new Set());

    // Activity type configuration
    const activityTypes = {
        call: { icon: 'ri-phone-line', color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Anruf' },
        email: { icon: 'ri-mail-line', color: 'text-indigo-400', bg: 'bg-indigo-500/10', label: 'E-Mail' },
        meeting: { icon: 'ri-calendar-event-line', color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Meeting' },
        note: { icon: 'ri-sticky-note-line', color: 'text-purple-400', bg: 'bg-purple-500/10', label: 'Notiz' },
        property_viewing: { icon: 'ri-home-4-line', color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Besichtigung' },
        follow_up: { icon: 'ri-chat-follow-up-line', color: 'text-pink-400', bg: 'bg-pink-500/10', label: 'Follow-up' }
    };

    const filterOptions = [
        { value: 'all', label: 'Alle', icon: 'ri-list-check' },
        { value: 'call', label: 'Anrufe', icon: 'ri-phone-line' },
        { value: 'email', label: 'E-Mails', icon: 'ri-mail-line' },
        { value: 'meeting', label: 'Meetings', icon: 'ri-calendar-event-line' },
        { value: 'note', label: 'Notizen', icon: 'ri-sticky-note-line' },
        { value: 'property_viewing', label: 'Besichtigungen', icon: 'ri-home-4-line' }
    ];

    const toggleExpand = (id) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedIds(newExpanded);
    };

    // Filter activities
    const filteredActivities = activities.filter(a =>
        filter === 'all' || a.type === filter
    );

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Heute';
        if (diffDays === 1) return 'Gestern';
        if (diffDays < 7) return `vor ${diffDays} Tagen`;

        return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-xl animate-pulse">
                        <div className="w-10 h-10 bg-white/10 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-white/10 rounded w-3/4"></div>
                            <div className="h-3 bg-white/10 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Header with filters */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <h3 className="text-lg font-semibold text-white">
                    Aktivitäten
                    <span className="ml-2 text-sm text-gray-400">({filteredActivities.length})</span>
                </h3>

                {/* Filter chips */}
                <div className="flex items-center gap-2 flex-wrap">
                    {filterOptions.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setFilter(opt.value)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === opt.value
                                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <i className={opt.icon}></i>
                            <span>{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Empty state */}
            {filteredActivities.length === 0 && (
                <div className="text-center py-16 px-4">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                        <i className="ri-history-line text-4xl text-white"></i>
                    </div>
                    <h4 className="text-xl font-semibold text-white mb-2">
                        {filter === 'all' ? 'Keine Aktivitäten' : `Keine ${filterOptions.find(o => o.value === filter)?.label}`}
                    </h4>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        {filter === 'all'
                            ? 'Starte die Beziehung – füge die erste Aktivität hinzu, um den Kontakt zu dokumentieren.'
                            : 'Für diesen Filter wurden noch keine Aktivitäten gefunden. Versuche einen anderen Filter.'}
                    </p>
                    {filter === 'all' && (
                        <button
                            onClick={onAddActivity}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-white font-semibold transition-all hover:scale-105 shadow-lg"
                        >
                            <i className="ri-add-line text-xl"></i>
                            <span>Erste Aktivität hinzufügen</span>
                        </button>
                    )}
                </div>
            )}

            {/* Activity timeline */}
            {filteredActivities.length > 0 && (
                <div className="space-y-4">
                    {filteredActivities.map((activity, idx) => {
                        const typeConfig = activityTypes[activity.type] || activityTypes.note;
                        const isExpanded = expandedIds.has(activity.id);
                        const hasLongDescription = activity.description && activity.description.length > 150;
                        const userName = userDirectory[activity.actorId] || activity.user || 'Unbekannt';
                        const userAvatar = activity.avatar;

                        return (
                            <div
                                key={activity.id || idx}
                                className="group relative bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-4 transition-all hover:shadow-lg"
                            >
                                {/* Timeline connector */}
                                {idx < filteredActivities.length - 1 && (
                                    <div className="absolute left-9 top-16 w-0.5 h-full bg-white/10 -z-10"></div>
                                )}

                                <div className="flex gap-4">
                                    {/* Avatar/Icon */}
                                    <div className="relative flex-shrink-0">
                                        {userAvatar ? (
                                            <img
                                                src={userAvatar}
                                                alt={userName}
                                                className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold border-2 border-white/20">
                                                {getInitials(userName)}
                                            </div>
                                        )}
                                        {/* Type badge */}
                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${typeConfig.bg} border-2 border-gray-900 rounded-full flex items-center justify-center`}>
                                            <i className={`${typeConfig.icon} text-xs ${typeConfig.color}`}></i>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        {/* Header */}
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${typeConfig.color} ${typeConfig.bg}`}>
                                                    <i className={typeConfig.icon}></i>
                                                    {typeConfig.label}
                                                </span>
                                                <span className="text-sm text-gray-300 font-medium">
                                                    {activity.title}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-400 whitespace-nowrap">
                                                {formatDate(activity.date)} • {formatTime(activity.date)}
                                            </div>
                                        </div>

                                        {/* User */}
                                        <div className="text-xs text-gray-400 mb-2">
                                            von {userName}
                                        </div>

                                        {/* Description */}
                                        {activity.description && (
                                            <div className="mt-2">
                                                <p className={`text-sm text-gray-300 leading-relaxed ${!isExpanded && hasLongDescription ? 'line-clamp-2' : ''}`}>
                                                    {activity.description}
                                                </p>
                                                {hasLongDescription && (
                                                    <button
                                                        onClick={() => toggleExpand(activity.id)}
                                                        className="mt-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                                                    >
                                                        {isExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Category badge */}
                                        {activity.category && (
                                            <div className="mt-2">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/5 border border-white/10 rounded text-xs text-gray-400">
                                                    <i className="ri-price-tag-3-line"></i>
                                                    {activity.category}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Load more button (for pagination) */}
            {filteredActivities.length > 0 && filteredActivities.length % 20 === 0 && (
                <div className="text-center pt-4">
                    <button className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white text-sm font-medium transition-all">
                        <i className="ri-arrow-down-line mr-2"></i>
                        Weitere laden
                    </button>
                </div>
            )}
        </div>
    );
};

export default ActivityStream;

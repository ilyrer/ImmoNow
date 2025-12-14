import React from 'react';

/**
 * TasksUpcomingSection - Tasks and next appointments overview
 * 
 * Features:
 * - Next 3 open tasks with priority and due date
 * - Next scheduled appointment highlight
 * - Empty states with CTAs
 * - Priority indicators
 * - Quick task creation
 */
const TasksUpcomingSection = ({
    tasks = [],
    nextAppointment = null,
    onCreateTask,
    onCreateAppointment,
    loading = false
}) => {

    const getPriorityIcon = (priority) => {
        const icons = {
            urgent: 'ri-fire-line',
            high: 'ri-arrow-up-circle-line',
            medium: 'ri-arrow-right-circle-line',
            low: 'ri-arrow-down-circle-line'
        };
        return icons[priority] || icons.medium;
    };

    const getPriorityColor = (priority) => {
        const colors = {
            urgent: 'text-red-400',
            high: 'text-orange-400',
            medium: 'text-amber-400',
            low: 'text-gray-400'
        };
        return colors[priority] || colors.medium;
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((date - now) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Heute';
        if (diffDays === 1) return 'Morgen';
        if (diffDays < 0) return 'Überfällig';
        if (diffDays < 7) return `in ${diffDays} Tagen`;

        return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
    };

    const formatAppointmentDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('de-DE', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {[1, 2].map(i => (
                    <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-pulse">
                        <div className="h-6 bg-white/10 rounded w-1/2 mb-4"></div>
                        <div className="space-y-3">
                            <div className="h-4 bg-white/10 rounded w-full"></div>
                            <div className="h-4 bg-white/10 rounded w-3/4"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const openTasks = tasks.filter(t => t.status !== 'completed').slice(0, 3);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* Open Tasks Card */}
            <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                            <i className="ri-task-line text-xl text-white"></i>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Offene Aufgaben</h3>
                            <p className="text-xs text-gray-400">{openTasks.length} ausstehend</p>
                        </div>
                    </div>
                    <button
                        onClick={onCreateTask}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        title="Neue Aufgabe"
                    >
                        <i className="ri-add-line text-xl text-white"></i>
                    </button>
                </div>

                {openTasks.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-xl flex items-center justify-center mb-3">
                            <i className="ri-checkbox-circle-line text-3xl text-purple-400"></i>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">
                            Keine offenen Aufgaben – erstelle eine neue Erinnerung
                        </p>
                        <button
                            onClick={onCreateTask}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-400 hover:to-pink-500 rounded-lg text-white text-sm font-medium transition-all hover:scale-105"
                        >
                            <i className="ri-add-line"></i>
                            <span>Aufgabe erstellen</span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {openTasks.map((task, idx) => {
                            const isOverdue = task.due_date && new Date(task.due_date) < new Date();

                            return (
                                <div
                                    key={task.id || idx}
                                    className="flex items-start gap-3 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all group cursor-pointer"
                                >
                                    <div className="mt-0.5">
                                        <i className={`${getPriorityIcon(task.priority)} text-lg ${getPriorityColor(task.priority)}`}></i>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate group-hover:text-indigo-400 transition-colors">
                                            {task.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-xs ${isOverdue ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
                                                <i className={`ri-calendar-line mr-1 ${isOverdue ? 'ri-alarm-warning-line' : ''}`}></i>
                                                {formatDate(task.due_date)}
                                            </span>
                                            {task.assignee && (
                                                <>
                                                    <span className="text-gray-600">•</span>
                                                    <span className="text-xs text-gray-400">
                                                        <i className="ri-user-line mr-1"></i>
                                                        {task.assignee}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <i className="ri-arrow-right-s-line text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                                </div>
                            );
                        })}

                        {tasks.length > 3 && (
                            <button className="w-full py-2 text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                                Alle Aufgaben anzeigen ({tasks.length})
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Next Appointment Card */}
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                            <i className="ri-calendar-event-line text-xl text-white"></i>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white">Nächster Termin</h3>
                            <p className="text-xs text-gray-400">Anstehend</p>
                        </div>
                    </div>
                    <button
                        onClick={onCreateAppointment}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        title="Neuer Termin"
                    >
                        <i className="ri-add-line text-xl text-white"></i>
                    </button>
                </div>

                {!nextAppointment ? (
                    <div className="text-center py-8">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-xl flex items-center justify-center mb-3">
                            <i className="ri-calendar-line text-3xl text-amber-400"></i>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">
                            Kein Termin geplant
                        </p>
                        <button
                            onClick={onCreateAppointment}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 rounded-lg text-white text-sm font-medium transition-all hover:scale-105"
                        >
                            <i className="ri-add-line"></i>
                            <span>Termin vereinbaren</span>
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 rounded-xl">
                            <div className="flex items-start gap-3 mb-3">
                                <div className="p-2 bg-amber-500/20 rounded-lg">
                                    <i className="ri-calendar-check-line text-2xl text-amber-400"></i>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-white font-semibold mb-1">
                                        {nextAppointment.title || nextAppointment.type || 'Termin'}
                                    </h4>
                                    <p className="text-sm text-amber-300">
                                        <i className="ri-time-line mr-1"></i>
                                        {formatAppointmentDate(nextAppointment.date || nextAppointment.start_time)}
                                    </p>
                                </div>
                            </div>

                            {nextAppointment.location && (
                                <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                                    <i className="ri-map-pin-line text-amber-400"></i>
                                    <span>{nextAppointment.location}</span>
                                </div>
                            )}

                            {nextAppointment.attendees && nextAppointment.attendees.length > 0 && (
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <i className="ri-team-line text-amber-400"></i>
                                    <span>{nextAppointment.attendees.length} Teilnehmer</span>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white text-sm font-medium transition-all">
                                <i className="ri-eye-line"></i>
                                <span>Details</span>
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white text-sm font-medium transition-all">
                                <i className="ri-edit-line"></i>
                                <span>Bearbeiten</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default TasksUpcomingSection;

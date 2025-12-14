import React, { useState } from 'react';

/**
 * AiEmailComposerModal - AI-powered email draft generator
 * 
 * Features:
 * - Goal selector (Follow-up, Appointment, Proposal, Check-in)
 * - AI-generated subject and body
 * - Editable textarea for customization
 * - Preview mode
 * - Regenerate functionality
 * - mailto: link or copy to clipboard
 */
const AiEmailComposerModal = ({
    contact,
    isOpen,
    onClose,
    onSendEmail
}) => {

    const [goal, setGoal] = useState('follow_up');
    const [loading, setLoading] = useState(false);
    const [emailDraft, setEmailDraft] = useState(null);
    const [editedSubject, setEditedSubject] = useState('');
    const [editedBody, setEditedBody] = useState('');
    const [copied, setCopied] = useState(false);

    const goals = [
        { value: 'follow_up', label: 'Nachfassen', icon: 'ri-chat-follow-up-line', description: 'Nach vorherigem Kontakt nachfassen' },
        { value: 'appointment', label: 'Terminanfrage', icon: 'ri-calendar-line', description: 'Termin vereinbaren' },
        { value: 'proposal', label: 'Angebot', icon: 'ri-file-text-line', description: 'Konkretes Angebot unterbreiten' },
        { value: 'check_in', label: 'Check-in', icon: 'ri-question-line', description: 'Status abfragen und Unterstützung anbieten' }
    ];

    const selectedGoal = goals.find(g => g.value === goal) || goals[0];

    // Generate email draft
    const handleGenerate = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/v1/contacts/${contact.id}/compose-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ goal })
            });

            if (response.ok) {
                const data = await response.json();
                setEmailDraft(data);
                setEditedSubject(data.subject);
                setEditedBody(data.body);
            } else {
                // Fallback draft
                const fallback = {
                    subject: `Ihre Immobilienanfrage - ${contact.company || 'Nachfrage'}`,
                    body: `Hallo ${contact.name.split(' ')[0]},\n\nich hoffe, es geht Ihnen gut! Ich wollte mich kurz bei Ihnen melden und nachfragen, wie ich Sie am besten unterstützen kann.\n\nGibt es aktuell etwas, das Sie interessiert oder Fragen, die Sie haben?\n\nIch freue mich auf Ihre Rückmeldung!\n\nMit freundlichen Grüßen`
                };
                setEmailDraft(fallback);
                setEditedSubject(fallback.subject);
                setEditedBody(fallback.body);
            }
        } catch (error) {
            console.error('Email generation error:', error);
            // Fallback
            const fallback = {
                subject: `Ihre Immobilienanfrage - ${contact.company || 'Nachfrage'}`,
                body: `Hallo ${contact.name.split(' ')[0]},\n\nich hoffe, es geht Ihnen gut! Ich wollte mich kurz bei Ihnen melden und nachfragen, wie ich Sie am besten unterstützen kann.\n\nGibt es aktuell etwas, das Sie interessiert oder Fragen, die Sie haben?\n\nIch freue mich auf Ihre Rückmeldung!\n\nMit freundlichen Grüßen`
            };
            setEmailDraft(fallback);
            setEditedSubject(fallback.subject);
            setEditedBody(fallback.body);
        } finally {
            setLoading(false);
        }
    };

    // Reset and regenerate
    const handleRegenerate = () => {
        setEmailDraft(null);
        handleGenerate();
    };

    // Copy to clipboard
    const handleCopy = () => {
        const fullEmail = `Betreff: ${editedSubject}\n\n${editedBody}`;
        navigator.clipboard.writeText(fullEmail);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Open in mail client
    const handleOpenMailClient = () => {
        const mailtoLink = `mailto:${contact.email}?subject=${encodeURIComponent(editedSubject)}&body=${encodeURIComponent(editedBody)}`;
        window.location.href = mailtoLink;

        // Log as activity
        if (onSendEmail) {
            onSendEmail({
                type: 'email',
                subject: editedSubject,
                preview: editedBody.substring(0, 100)
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-white/10 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                            <i className="ri-mail-send-line text-2xl text-white"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">KI-E-Mail-Assistent</h2>
                            <p className="text-sm text-gray-400">
                                E-Mail für {contact.name} generieren
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <i className="ri-close-line text-2xl text-gray-400 hover:text-white"></i>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Goal Selector */}
                    {!emailDraft && (
                        <>
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-3">
                                    Ziel der E-Mail wählen
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {goals.map(g => (
                                        <button
                                            key={g.value}
                                            onClick={() => setGoal(g.value)}
                                            className={`p-4 rounded-xl border transition-all text-left ${goal === g.value
                                                    ? 'bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border-indigo-500/50 shadow-lg'
                                                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <i className={`${g.icon} text-2xl ${goal === g.value ? 'text-indigo-400' : 'text-gray-400'}`}></i>
                                                <div className="flex-1">
                                                    <div className={`font-semibold mb-1 ${goal === g.value ? 'text-white' : 'text-gray-300'}`}>
                                                        {g.label}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {g.description}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Context Info */}
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                                <div className="flex items-start gap-2 text-sm text-gray-300">
                                    <i className="ri-information-line text-indigo-400 mt-0.5"></i>
                                    <div>
                                        <p className="font-medium mb-1">Kontext für KI-Generierung:</p>
                                        <ul className="text-xs text-gray-400 space-y-1">
                                            <li>• Name und Firma des Kontakts</li>
                                            <li>• Aktuelle Beziehungsstufe und Lead Score</li>
                                            <li>• Letzte Interaktionen und Aktivitäten</li>
                                            <li>• Gewähltes Ziel: <span className="text-indigo-400">{selectedGoal.label}</span></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                <i className="ri-sparkling-line absolute inset-0 m-auto text-2xl text-indigo-400"></i>
                            </div>
                            <p className="mt-4 text-gray-300 font-medium">KI generiert E-Mail...</p>
                            <p className="text-sm text-gray-400">Einen Moment bitte</p>
                        </div>
                    )}

                    {/* Email Draft */}
                    {emailDraft && !loading && (
                        <>
                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Betreff
                                </label>
                                <input
                                    type="text"
                                    value={editedSubject}
                                    onChange={(e) => setEditedSubject(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                                    placeholder="E-Mail Betreff"
                                />
                            </div>

                            {/* Body */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-300 mb-2">
                                    Nachricht
                                </label>
                                <textarea
                                    value={editedBody}
                                    onChange={(e) => setEditedBody(e.target.value)}
                                    rows={12}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all font-mono text-sm leading-relaxed"
                                    placeholder="E-Mail Text..."
                                />
                            </div>

                            {/* AI Badge */}
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <i className="ri-sparkling-line text-indigo-400"></i>
                                <span>Mit KI generiert • {selectedGoal.label}</span>
                            </div>
                        </>
                    )}

                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-white/10 bg-gray-900/50">

                    {!emailDraft ? (
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white font-medium transition-all"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-white font-semibold transition-all hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <i className="ri-sparkling-line text-lg"></i>
                                <span>E-Mail generieren</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <button
                                    onClick={handleRegenerate}
                                    className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white font-medium transition-all flex items-center gap-2"
                                >
                                    <i className="ri-refresh-line"></i>
                                    <span>Neu generieren</span>
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white font-medium transition-all flex items-center gap-2"
                                >
                                    <i className={copied ? "ri-check-line text-emerald-400" : "ri-file-copy-line"}></i>
                                    <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
                                </button>
                                <button
                                    onClick={handleOpenMailClient}
                                    className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-xl text-white font-semibold transition-all hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                                >
                                    <i className="ri-mail-send-line text-lg"></i>
                                    <span>In Mail-Client öffnen</span>
                                </button>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full px-4 py-2 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                            >
                                Schließen
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AiEmailComposerModal;

import React from 'react';

/**
 * MobileStickyActionBar - Fixed bottom action bar for mobile devices
 * 
 * Features:
 * - Fixed position at bottom of screen
 * - 4 primary actions: Call, Email, Calendar, Note
 * - Glassmorphism styling with safe area support
 * - Large touch targets (56x56px)
 * - Only visible on mobile viewports (<768px)
 */
const MobileStickyActionBar = ({
    contact,
    onCall,
    onEmail,
    onAppointment,
    onNote
}) => {

    if (!contact) return null;

    const handleCall = () => {
        if (contact.phone) {
            window.location.href = `tel:${contact.phone}`;
        }
        if (onCall) onCall();
    };

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe">
            {/* Glassmorphism bar */}
            <div className="backdrop-blur-xl bg-gray-900/90 border-t border-white/10 shadow-2xl">
                <div className="flex items-center justify-around px-4 py-3">

                    {/* Call Button */}
                    <button
                        onClick={handleCall}
                        className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 active:scale-95 transition-all group"
                        aria-label="Anrufen"
                    >
                        <i className="ri-phone-line text-2xl text-emerald-400 group-active:scale-110 transition-transform"></i>
                        <span className="text-xs text-emerald-400 font-medium mt-1">Anruf</span>
                    </button>

                    {/* Email Button */}
                    <button
                        onClick={onEmail}
                        className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 active:scale-95 transition-all group"
                        aria-label="E-Mail senden"
                    >
                        <i className="ri-mail-line text-2xl text-indigo-400 group-active:scale-110 transition-transform"></i>
                        <span className="text-xs text-indigo-400 font-medium mt-1">E-Mail</span>
                    </button>

                    {/* Appointment Button */}
                    <button
                        onClick={onAppointment}
                        className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 transition-all group"
                        aria-label="Termin planen"
                    >
                        <i className="ri-calendar-line text-2xl text-amber-400 group-active:scale-110 transition-transform"></i>
                        <span className="text-xs text-amber-400 font-medium mt-1">Termin</span>
                    </button>

                    {/* Note Button */}
                    <button
                        onClick={onNote}
                        className="flex flex-col items-center justify-center w-14 h-14 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 active:scale-95 transition-all group"
                        aria-label="Notiz erstellen"
                    >
                        <i className="ri-sticky-note-line text-2xl text-purple-400 group-active:scale-110 transition-transform"></i>
                        <span className="text-xs text-purple-400 font-medium mt-1">Notiz</span>
                    </button>

                </div>
            </div>
        </div>
    );
};

export default MobileStickyActionBar;

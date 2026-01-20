import React, { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';

interface AnalogTimePickerProps {
    value: string; // "HH:mm" 24h format
    onChange: (value: string) => void;
    onClose: () => void;
}

export function AnalogTimePicker({ value, onChange, onClose }: AnalogTimePickerProps) {
    const [hours, setHours] = useState(() => parseInt(value.split(':')[0]) % 12 || 12);
    const [minutes, setMinutes] = useState(() => parseInt(value.split(':')[1]));
    const [isPM, setIsPM] = useState(() => parseInt(value.split(':')[0]) >= 12);
    const [view, setView] = useState<'hours' | 'minutes'>('hours');

    const clockRef = useRef<HTMLDivElement>(null);

    const handleClockClick = (event: React.MouseEvent | React.TouchEvent) => {
        if (!clockRef.current) return;

        const rect = clockRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
        const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

        const x = clientX - centerX;
        const y = clientY - centerY;

        // Calculate angle in degrees (0 is top/12 o'clock)
        let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
        if (angle < 0) angle += 360;

        if (view === 'hours') {
            const h = Math.round(angle / 30) || 12;
            setHours(h === 13 ? 1 : h);
            // Auto switch to minutes after selection
            setTimeout(() => setView('minutes'), 300);
        } else {
            const m = (Math.round(angle / 30) * 5) % 60;
            setMinutes(m);
        }
    };

    const confirmSelection = () => {
        let h = hours % 12;
        if (isPM) h += 12;
        const timeString = `${h.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        onChange(timeString);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-xl" onClick={onClose} />

            <div className="relative w-full max-w-[320px] bg-surface border border-border/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header/Display - Typing enabled */}
                <div className="bg-banana-400 dark:bg-banana-400 p-8 flex flex-col items-center shadow-lg">
                    <div className="flex items-center text-slate-900">
                        <div className="relative">
                            <input
                                type="text"
                                value={hours}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val === '') {
                                        setHours(12);
                                        return;
                                    }
                                    const num = parseInt(val);
                                    if (num >= 1 && num <= 12) {
                                        setHours(num);
                                        if (val.length >= 2 || num > 1) {
                                            setView('minutes');
                                            (document.getElementById('tp-minutes') as HTMLInputElement)?.focus();
                                        }
                                    }
                                }}
                                onFocus={() => setView('hours')}
                                className={`w-[70px] bg-transparent text-5xl font-black tracking-tighter text-right outline-none transition-all duration-200 ${view === 'hours' ? 'opacity-100 scale-105' : 'opacity-40'}`}
                                maxLength={2}
                                id="tp-hours"
                            />
                        </div>

                        <span className="text-4xl font-bold opacity-30 mx-2">:</span>

                        <div className="relative">
                            <input
                                type="text"
                                id="tp-minutes"
                                value={minutes.toString().padStart(2, '0')}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    if (val === '') {
                                        setMinutes(0);
                                        return;
                                    }
                                    const num = parseInt(val);
                                    if (num >= 0 && num <= 59) {
                                        setMinutes(num);
                                    }
                                }}
                                onFocus={() => setView('minutes')}
                                className={`w-[70px] bg-transparent text-5xl font-black tracking-tighter text-left outline-none transition-all duration-200 ${view === 'minutes' ? 'opacity-100 scale-105' : 'opacity-40'}`}
                                maxLength={2}
                            />
                        </div>

                        <div className="ml-4 flex flex-col items-start gap-1">
                            <button
                                onClick={() => setIsPM(false)}
                                className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md transition-all ${!isPM ? 'bg-slate-900 text-white opacity-100' : 'opacity-30 hover:opacity-50'}`}
                            >
                                AM
                            </button>
                            <button
                                onClick={() => setIsPM(true)}
                                className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md transition-all ${isPM ? 'bg-slate-900 text-white opacity-100' : 'opacity-30 hover:opacity-50'}`}
                            >
                                PM
                            </button>
                        </div>
                    </div>
                </div>

                {/* Clock Face Area */}
                <div className="p-8 pb-6 flex flex-col items-center bg-surface">
                    <div
                        ref={clockRef}
                        onClick={handleClockClick}
                        className="relative w-56 h-56 bg-foreground/5 rounded-full border border-border/5 cursor-pointer touch-none shadow-inner"
                    >
                        {/* Center Dot */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-banana-500 rounded-full z-20 shadow-sm" />

                        {/* Selected Hand - Stays behind numbers */}
                        <div
                            className="absolute top-1/2 left-1/2 w-1 bg-banana-500 origin-top z-10 transition-transform duration-300 ease-out"
                            style={{
                                height: '40%',
                                transform: `translateX(-50%) rotate(${180 + (view === 'hours' ? hours * 30 : minutes * 6)}deg)`
                            }}
                        >
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 bg-banana-500 rounded-full shadow-lg shadow-banana-400/30 ring-4 ring-surface" />
                        </div>

                        {/* Numbers - Stagnant and always static */}
                        {(view === 'hours' ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]).map((n, i) => {
                            const angle = (i * 30) * (Math.PI / 180);
                            const radiusPercent = 40;
                            const isSelected = view === 'hours' ? hours === n : minutes === n;
                            return (
                                <span
                                    key={n}
                                    className={`absolute text-sm font-bold -translate-x-1/2 -translate-y-1/2 transition-colors pointer-events-none z-20 ${isSelected
                                        ? 'text-slate-900 drop-shadow-sm'
                                        : 'text-muted/60'
                                        }`}
                                    style={{
                                        left: `${50 + radiusPercent * Math.sin(angle)}%`,
                                        top: `${50 - radiusPercent * Math.cos(angle)}%`
                                    }}
                                >
                                    {n === 0 && view === 'minutes' ? '00' : n}
                                </span>
                            );
                        })}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-8 flex w-full gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 text-sm font-bold text-muted hover:text-foreground transition-colors rounded-2xl hover:bg-foreground/5"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmSelection}
                            className="flex-1 py-3 bg-banana-400 hover:bg-banana-500 text-slate-900 rounded-2xl text-sm font-black shadow-xl shadow-banana-400/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Set Time
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

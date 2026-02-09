"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { X, Bell } from 'lucide-react';

interface RoundSummaryProps {
    result: string[];
    phase: string;
    dayCount: number;
}

export default function RoundSummary({ result, phase, dayCount }: RoundSummaryProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (result && result.length > 0) {
            setIsVisible(true);
            const timer = setTimeout(() => setIsVisible(false), 8000); // Hide after 8s
            return () => clearTimeout(timer);
        }
    }, [result, phase, dayCount]); // Re-trigger on new results

    // Don't show if empty
    if (!result || result.length === 0) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 pointer-events-none"
                >
                    <div className="bg-slate-900/90 border border-slate-700 p-6 rounded-xl shadow-2xl backdrop-blur-md pointer-events-auto relative">
                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-2 right-2 text-white/50 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-3 border-b border-white/10 pb-2">
                            <Bell className="w-6 h-6 text-yellow-400 animate-bounce" />
                            <h3 className="text-xl font-bold text-white text-shadow">Round Summary</h3>
                        </div>

                        <div className="space-y-2">
                            {result.map((line, idx) => (
                                <motion.p
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.2 }}
                                    className={`text-lg ${idx === 0 ? 'font-semibold text-gray-300' : 'text-white'}`}
                                >
                                    {line}
                                </motion.p>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

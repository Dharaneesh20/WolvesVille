"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Ghost, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';

// Types
type AnimationType = 'WEREWOLF_KILL' | 'LYNCH' | 'SEER_REVEAL' | null;

interface AnimationProps {
    type: AnimationType;
    targetAvatar?: string;
    targetName?: string;
    revealedRole?: string;
    onComplete: () => void;
}

export default function GameAnimations({ type, targetAvatar, targetName, revealedRole, onComplete }: AnimationProps) {

    useEffect(() => {
        if (type) {
            const timer = setTimeout(() => {
                onComplete();
            }, 5000); // 5s to be safe (animation is ~4s)
            return () => clearTimeout(timer);
        }
    }, [type, onComplete]);

    if (!type) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onComplete} // Allow manual dismiss
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-pointer"
            >

                {/* WEREWOLF KILL */}
                {type === 'WEREWOLF_KILL' && (
                    <div className="relative flex flex-col items-center">
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="relative"
                        >
                            <img src={targetAvatar} className="w-32 h-32 rounded-full border-4 border-red-900 grayscale brightness-50" />

                            {/* Claw Marks */}
                            <motion.div
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.2 }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <svg viewBox="0 0 100 100" className="w-40 h-40 text-red-600 drop-shadow-lg">
                                    <motion.path d="M10,10 L90,90" stroke="currentColor" strokeWidth="5" strokeLinecap="round"
                                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.5 }} />
                                    <motion.path d="M90,10 L10,90" stroke="currentColor" strokeWidth="5" strokeLinecap="round"
                                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.7 }} />
                                    <motion.path d="M50,0 L50,100" stroke="currentColor" strokeWidth="5" strokeLinecap="round"
                                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.9 }} />
                                </svg>
                            </motion.div>
                        </motion.div>

                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 1 }}
                            className="text-4xl font-bold text-red-600 mt-6 uppercase tracking-widest drop-shadow-red"
                        >
                            MAULED
                        </motion.h2>
                        <p className="text-red-400 mt-2">{targetName} was eaten.</p>
                    </div>
                )}

                {/* LYNCH */}
                {type === 'LYNCH' && (
                    <div className="flex flex-col items-center">
                        <motion.div
                            animate={{ y: [0, 20, 0], rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="relative"
                        >
                            <div className="w-1 h-32 bg-yellow-800 absolute -top-32 left-1/2 -translate-x-1/2" /> {/* Rope */}
                            <img src={targetAvatar} className="w-32 h-32 rounded-full border-4 border-gray-600 grayscale" />
                        </motion.div>
                        <motion.h2
                            initial={{ scale: 2, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-4xl font-bold text-gray-400 mt-8 font-serif"
                        >
                            EXECUTED
                        </motion.h2>
                    </div>
                )}

                {/* SEER REVEAL */}
                {type === 'SEER_REVEAL' && (
                    <div className="flex flex-col items-center">
                        <motion.div
                            initial={{ scale: 0, rotate: 180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", duration: 1.5 }}
                            className="relative w-40 h-60 bg-gradient-to-br from-purple-900 to-blue-900 rounded-xl border-2 border-purple-400 flex items-center justify-center shadow-[0_0_50px_rgba(168,85,247,0.5)]"
                        >
                            <div className="text-center">
                                <img src={targetAvatar} className="w-16 h-16 rounded-full mx-auto mb-4 border border-white/20" />
                                <h3 className="text-white font-bold text-xl mb-1">{targetName}</h3>
                                <p className={`text-2xl font-black uppercase tracking-wider ${revealedRole === 'WEREWOLF' ? 'text-red-500' : 'text-blue-400'}`}>
                                    {revealedRole}
                                </p>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex items-center gap-2 text-purple-200 mt-8"
                        >
                            <Eye className="w-6 h-6" />
                            <span>The spirits reveal the truth...</span>
                        </motion.div>
                    </div>
                )}

            </motion.div>
        </AnimatePresence>
    );
}

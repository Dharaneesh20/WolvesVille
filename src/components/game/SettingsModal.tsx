"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings as SettingsIcon, Check } from 'lucide-react';
import { useState } from 'react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentSettings: {
        nightDuration: number;
        dayDiscussDuration: number;
        dayVoteDuration: number;
    };
    onSave: (newSettings: any) => void;
}

export default function SettingsModal({ isOpen, onClose, currentSettings, onSave }: SettingsModalProps) {
    const [settings, setSettings] = useState(currentSettings);

    const handleChange = (key: string, value: number) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        onSave(settings);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
                <div className="bg-[#1a1a2e] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <SettingsIcon className="w-6 h-6 text-purple-400" />
                        Host Settings
                    </h2>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-purple-200">Night Duration (seconds)</label>
                            <input
                                type="number"
                                value={settings.nightDuration}
                                onChange={(e) => handleChange('nightDuration', parseInt(e.target.value) || 0)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-yellow-200">Discussion Duration (seconds)</label>
                            <input
                                type="number"
                                value={settings.dayDiscussDuration}
                                onChange={(e) => handleChange('dayDiscussDuration', parseInt(e.target.value) || 0)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-yellow-500 outline-none"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-red-200">Voting Duration (seconds)</label>
                            <input
                                type="number"
                                value={settings.dayVoteDuration}
                                onChange={(e) => handleChange('dayVoteDuration', parseInt(e.target.value) || 0)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 outline-none"
                            />
                        </div>

                        <button
                            onClick={handleSave}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
                        >
                            <Check className="w-5 h-5" />
                            Save Changes
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Loader2, User } from 'lucide-react';

interface ProfileFormProps {
    onSubmit: (data: { name: string; avatarUrl: string }) => void;
    initialName?: string;
    initialAvatar?: string;
}

export default function ProfileForm({ onSubmit, initialName = '', initialAvatar = '' }: ProfileFormProps) {
    const [name, setName] = useState(initialName);
    const [avatarUrl, setAvatarUrl] = useState(initialAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=wolvesville'); // Default static seed for server render
    const [uploading, setUploading] = useState(false);

    // Generate random avatar on client mount only to prevent hydration mismatch
    useEffect(() => {
        if (!initialAvatar) {
            setAvatarUrl('https://api.dicebear.com/7.x/avataaars/svg?seed=' + Math.random());
        }
    }, [initialAvatar]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || 'wolvesville_preset');

        try {
            // Check if env vars are set, otherwise mock for dev
            if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
                console.warn("Cloudinary Cloud Name not set. Using local file URL for preview only.");
                const objectUrl = URL.createObjectURL(file);
                setAvatarUrl(objectUrl);
            } else {
                const res = await fetch(
                    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
                    {
                        method: 'POST',
                        body: formData,
                    }
                );
                const data = await res.json();
                setAvatarUrl(data.secure_url);
            }
        } catch (err) {
            console.error('Upload failed', err);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name, avatarUrl });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl"
        >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Profile</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative group cursor-pointer">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500 bg-gray-800">
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer">
                            <Camera className="w-8 h-8 text-white" />
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </label>
                        {uploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-full">
                                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                            </div>
                        )}
                    </div>
                    <p className="text-white/60 text-sm">Tap to change photo</p>
                </div>

                {/* Name Input */}
                <div className="space-y-2">
                    <label className="text-white/80 text-sm font-medium">Username</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 transition-all"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={uploading || !name.trim()}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/25 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Continue
                </button>
            </form>
        </motion.div>
    );
}

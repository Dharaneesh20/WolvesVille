"use client";

import { useState, useEffect } from "react";
import ProfileForm from "@/components/ProfileForm";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Play, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

// Initialize socket outside component to prevent multiple connections
let socket: any;

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState<{ name: string; avatarUrl: string } | null>(null);
  const [view, setView] = useState<'PROFILE' | 'MENU' | 'JOIN'>('PROFILE');
  const [joinCode, setJoinCode] = useState('');

  // Load profile from local storage if exists
  useEffect(() => {
    const saved = localStorage.getItem('wolvesville_profile');
    if (saved) {
      setProfile(JSON.parse(saved));
      setView('MENU');
    }
  }, []);

  const handleProfileSubmit = (data: { name: string; avatarUrl: string }) => {
    setProfile(data);
    localStorage.setItem('wolvesville_profile', JSON.stringify(data));
    setView('MENU');
  };

  const handleCreateGame = () => {
    if (!profile) return;

    // In a real app, we'd probably use a Context to hold the socket
    // For MVP, we'll initialize here and pass connection string
    // ideally, we should have a GameContext

    // For now, let's just redirect to lobby and handle socket there
    // wait, we need to EMIT create_game first.
    // So wrapping in context is better.
    // Let's assume we implement GameContext next.
    // For now, I'll redirect to a client-side route that inits the game
    router.push(`/lobby/create?name=${encodeURIComponent(profile.name)}&avatar=${encodeURIComponent(profile.avatarUrl)}`);
  };

  const handleJoinGame = () => {
    if (!joinCode.trim() || !profile) return;
    router.push(`/lobby/${joinCode}?name=${encodeURIComponent(profile.name)}&avatar=${encodeURIComponent(profile.avatarUrl)}`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0" />

      <div className="z-10 w-full max-w-md flex flex-col items-center gap-8">

        {/* Title / Logo */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center"
        >
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-gray-100 to-gray-400 drop-shadow-lg tracking-tighter">
            WOLVESVILLE
          </h1>
          <p className="text-blue-200/80 font-medium tracking-widest mt-2 uppercase text-xs">
            Hunt or be hunted
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {view === 'PROFILE' && (
            <ProfileForm key="profile" onSubmit={handleProfileSubmit} />
          )}

          {view === 'MENU' && profile && (
            <motion.div
              key="menu"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full space-y-4"
            >
              {/* User Card */}
              <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 mb-6">
                <img src={profile.avatarUrl} className="w-12 h-12 rounded-full border border-purple-400" />
                <div>
                  <p className="text-white font-bold">{profile.name}</p>
                  <button onClick={() => setView('PROFILE')} className="text-xs text-blue-300 hover:text-white transition-colors">Edit Profile</button>
                </div>
              </div>

              <button
                onClick={handleCreateGame}
                className="group w-full p-6 bg-gradient-to-r from-purple-900/50 to-blue-900/50 hover:from-purple-800/60 hover:to-blue-800/60 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-between transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                    <Plus className="w-6 h-6 text-purple-200" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white">Create Game</h3>
                    <p className="text-white/40 text-sm">Host a new lobby</p>
                  </div>
                </div>
                <Play className="w-5 h-5 text-white/20 group-hover:text-white/60" />
              </button>

              <button
                onClick={() => setView('JOIN')}
                className="group w-full p-6 bg-gradient-to-r from-gray-900/50 to-gray-800/50 hover:from-gray-800/60 hover:to-gray-700/60 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-between transition-all hover:scale-[1.02] hover:shadow-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                    <Users className="w-6 h-6 text-blue-200" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-white">Join Game</h3>
                    <p className="text-white/40 text-sm">Enter a room code</p>
                  </div>
                </div>
                <Play className="w-5 h-5 text-white/20 group-hover:text-white/60" />
              </button>
            </motion.div>
          )}

          {view === 'JOIN' && (
            <motion.div
              key="join"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="w-full bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20"
            >
              <h3 className="text-xl font-bold text-white mb-4">Enter Room Code</h3>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="ABC1234"
                className="w-full text-center text-3xl font-mono tracking-widest py-4 bg-black/20 border border-white/10 rounded-xl text-white mb-6 focus:border-purple-500 outline-none"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setView('MENU')}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={handleJoinGame}
                  disabled={joinCode.length < 3}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Join
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>


      {/* Footer / Credits */}
      <div className="fixed bottom-4 text-center z-10 space-y-2 w-full pointer-events-none">
        <p className="text-white/40 text-xs pointer-events-auto">
          Developed by <a href="https://github.com/Dharaneesh20" target="_blank" className="hover:text-purple-400 transition-colors font-bold underline decoration-purple-500/30">Dharaneesh20</a>
        </p>
        <div className="flex items-center justify-center gap-4 text-[10px] text-white/20 pointer-events-auto">
          <a href="https://rsdportfolio.vercel.app/" target="_blank" className="hover:text-white transition-colors">Portfolio</a>
          <span>•</span>
          <a href="https://github.com/Dharaneesh20/wolvesville" target="_blank" className="hover:text-white transition-colors">Star on GitHub</a>
          <span>•</span>
          <a href="mailto:dharaneeshrs@proton.me" className="hover:text-white transition-colors">Contact</a>
        </div>
      </div>
    </main>
  );
}

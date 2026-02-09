"use client";

import { useEffect, useState } from 'react';
import { useSocket } from '@/components/providers/SocketProvider';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Moon, Sun, Timer, Settings as SettingsIcon } from 'lucide-react';
import PlayerGrid from '@/components/game/PlayerGrid';
import Chat from '@/components/game/Chat';
import GameAnimations from '@/components/game/GameAnimations';
import SettingsModal from '@/components/game/SettingsModal';

interface GameState {
    code: string;
    hostId: string;
    players: any[];
    phase: string;
    timer: number;
    winner?: string;
    role?: string; // My role
    nightInfo?: any; // Witch info
    settings?: any; // Host settings
}

export default function GamePage() {
    const socket = useSocket();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const code = params.code as string;
    const name = searchParams.get('name');
    const avatar = searchParams.get('avatar');

    const [game, setGame] = useState<GameState | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [showSettings, setShowSettings] = useState(false);

    // Animation State
    const [anim, setAnim] = useState<{ type: 'WEREWOLF_KILL' | 'LYNCH' | 'SEER_REVEAL' | null, target?: any, role?: string }>({ type: null });

    useEffect(() => {
        if (!socket || !code || !name) return;

        const handleUpdate = (data: { game: GameState }) => {
            setGame(prevGame => {
                // Check for phase transitions to trigger animations
                if (prevGame && prevGame.phase !== data.game.phase) {
                    const prevAlive = prevGame.players.filter((p: any) => p.isAlive).map((p: any) => p.id);
                    const currAlive = data.game.players.filter((p: any) => p.isAlive).map((p: any) => p.id);

                    const died = prevAlive.find((id: string) => !currAlive.includes(id));

                    if (died) {
                        const victim = prevGame.players.find((p: any) => p.id === died);
                        if (prevGame.phase === 'DAY_VOTE') {
                            setAnim({ type: 'LYNCH', target: victim });
                        } else if (prevGame.phase === 'NIGHT') {
                            setAnim({ type: 'WEREWOLF_KILL', target: victim });
                        }
                    }
                }
                return data.game;
            });

            setTimeLeft(data.game.timer); // Sync timer
        };

        socket.on('game_update', handleUpdate);
        socket.on('game_started', handleUpdate);
        socket.on('joined_successfully', handleUpdate);

        // Initial Join - Critical for refresh
        socket.emit('join_game', { code, playerName: name, playerAvatar: avatar });

        return () => {
            socket.off('game_update', handleUpdate);
            socket.off('game_started', handleUpdate);
            socket.off('joined_successfully', handleUpdate);
        };
    }, [socket, code, name, avatar]);

    // Client-side timer countdown (syncs with server updates)
    useEffect(() => {
        if (timeLeft <= 0) return;
        const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [timeLeft]);

    const handleAction = (targetId: string) => {
        if (!game) return;
        socket?.emit('cast_vote', { code: game.code, targetId });
    };

    const handleSkip = () => {
        if (!game) return;
        socket?.emit('cast_vote', { code: game.code, targetId: 'SKIP' });
    }

    const getPhaseDisplay = () => {
        if (!game) return { text: 'Loading...', icon: null, color: 'text-white' };
        switch (game.phase) {
            case 'NIGHT': return { text: 'Night Phase', icon: <Moon className="w-6 h-6" />, color: 'text-purple-400' };
            case 'DAY_DISCUSS': return { text: 'Discussion Time', icon: <Sun className="w-6 h-6" />, color: 'text-yellow-400' };
            case 'DAY_VOTE': return { text: 'Vote to Eliminate', icon: <Sun className="w-6 h-6" />, color: 'text-red-400' };
            case 'GAME_OVER': return { text: 'Game Over', icon: <Sun className="w-6 h-6" />, color: 'text-white' };
            default: return { text: 'Waiting...', icon: null, color: 'text-white' };
        }
    };

    if (!game) return <div className="text-white text-center mt-20">Loading Game...</div>;

    const phaseInfo = getPhaseDisplay();
    const myPlayer = game.players.find((p: any) => p.id === socket?.id);
    const myRole = myPlayer?.role || 'VILLAGER';

    return (
        <div className="min-h-screen p-4 flex flex-col gap-6 max-w-6xl mx-auto">
            <GameAnimations
                type={anim.type}
                targetAvatar={anim.target?.avatarUrl}
                targetName={anim.target?.name}
                revealedRole={anim.role}
                onComplete={() => setAnim({ type: null })}
            />

            {/* Top Bar: Phase & Timer */}
            <motion.div
                layout
                className="flex items-center justify-between bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10"
            >
                <div className={`flex items-center gap-3 font-bold text-xl ${phaseInfo.color}`}>
                    {phaseInfo.icon}
                    <span>{phaseInfo.text}</span>
                </div>

                <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl text-white font-mono">
                    <Timer className="w-5 h-5 opacity-70" />
                    <span>{timeLeft}s</span>
                </div>
            </motion.div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Main Game Area */}
                <div className="flex-1 space-y-6">
                    {/* My Role Card */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex items-center gap-4"
                    >
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-3xl">
                            {myRole === 'WEREWOLF' ? '🐺' :
                                myRole === 'SEER' ? '🔮' :
                                    myRole === 'DOCTOR' ? '💊' :
                                        myRole === 'WITCH' ? '🧹' :
                                            myRole === 'AVENGER' ? '🏹' : '🧑‍🌾'}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{myRole}</h2>
                            <p className="text-white/60 text-sm">
                                {myRole === 'WEREWOLF' ? 'Eat a villager each night.' :
                                    myRole === 'SEER' ? 'Reveal one role each night.' :
                                        myRole === 'DOCTOR' ? 'Protect one player each night.' :
                                            myRole === 'WITCH' ? 'Heal or Poison one player per game.' :
                                                myRole === 'AVENGER' ? 'If you die, take your target with you!' :
                                                    'Find the wolves and vote them out!'}
                            </p>
                        </div>
                    </motion.div>

                    {/* Skip Vote Button - Only during Vote Phase */}
                    {game.phase === 'DAY_VOTE' && myPlayer?.isAlive && (
                        <div className="flex justify-center">
                            <button
                                onClick={handleSkip}
                                className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-full font-bold transition-all shadow-lg"
                            >
                                Skip Vote
                            </button>
                        </div>
                    )}

                    {/* Seer Result Display */}
                    {game.phase === 'NIGHT' && myRole === 'SEER' && game.nightInfo?.seerResult && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-blue-900/40 border border-blue-500/50 p-4 rounded-xl flex items-center justify-center gap-4"
                        >
                            <div className="text-center">
                                <p className="text-blue-200 text-sm uppercase tracking-widest mb-1">Crystal Ball Reveals</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-bold text-white">{game.players.find((p: any) => p.id === game.nightInfo.seerResult.id)?.name}</span>
                                    <span className="text-gray-400">is a</span>
                                    <span className="text-2xl font-extrabold text-blue-400">{game.nightInfo.seerResult.role}</span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Players Grid */}
                    <PlayerGrid
                        players={game.players}
                        currentPlayerId={socket?.id || ''}
                        phase={game.phase}
                        onAction={handleAction}
                        myRole={myRole}
                        nightInfo={game.nightInfo} // Pass night info (e.g. for Witch)
                    />

                    {/* Win Overlay */}
                    {game.phase === 'GAME_OVER' && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                        >
                            <div className="bg-gradient-to-b from-purple-900 to-black p-10 rounded-3xl border-2 border-purple-500 text-center shadow-2xl max-w-lg w-full">
                                <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 mb-4">
                                    {game.winner} WIN!
                                </h1>
                                <p className="text-white/60 mb-8">The village has spoken.</p>
                                <button onClick={() => router.push('/')} className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition-transform">
                                    Back to Home
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Sidebar: Chat */}
                <div className="w-full md:w-80 shrink-0 space-y-4">
                    {/* Host Settings Button */}
                    {/* Debug: {game.hostId} vs {socket?.id} */}
                    {(game.hostId === socket?.id) && (
                        <button
                            onClick={() => setShowSettings(true)}
                            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                            <SettingsIcon className="w-5 h-5" />
                            Game Settings
                        </button>
                    )}

                    <Chat
                        code={code}
                        canChat={game.phase.startsWith('DAY') || game.phase === 'GAME_OVER' || game.phase === 'LOBBY'}
                        playerName={name || 'Unknown'}
                    />
                </div>
            </div>

            {/* Settings Modal */}
            {game && (
                <SettingsModal
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    currentSettings={game.settings || { nightDuration: 45, dayDiscussDuration: 60, dayVoteDuration: 30 }}
                    onSave={(newSettings) => {
                        socket?.emit('update_settings', { code, settings: newSettings });
                    }}
                />
            )}
        </div>
    );
}

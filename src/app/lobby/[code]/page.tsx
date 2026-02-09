"use client";

import { useEffect, useState } from 'react';
import { useSocket } from '@/components/providers/SocketProvider';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Copy, Play, Crown, CheckCircle2 } from 'lucide-react';

interface Player {
    id: string; // Socket ID
    name: string;
    avatarUrl: string;
    isReady: boolean;
}

interface GameState {
    code: string;
    hostId: string;
    players: Player[];
    phase: string;
}

export default function LobbyPage() {
    const socket = useSocket();
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();

    const code = params.code as string;
    const name = searchParams.get('name');
    const avatar = searchParams.get('avatar');

    const [game, setGame] = useState<GameState | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!socket || !name || !avatar || !code) return;

        // Handlers
        const handleUpdate = (data: { game: GameState }) => setGame(data.game);
        const handleError = (data: { message: string }) => setError(data.message);
        const handleGameStarted = (data: { game: GameState }) => {
            router.push(`/game/${code}?name=${encodeURIComponent(name)}&avatar=${encodeURIComponent(avatar)}`);
        };

        socket.on('player_joined', handleUpdate);
        socket.on('game_update', handleUpdate);
        socket.on('joined_successfully', handleUpdate);
        socket.on('game_started', handleGameStarted);
        socket.on('error', handleError);

        // Initial Join (only if not already in game - simplified check)
        // Actually, create_game redirects here, but we still need to join if we are just arriving via URL
        // BUT 'create_game' handler on server ALREADY joined the socket to the room.
        // However, if we refresh, we lose socket state.
        // So we should ALWAYS emit join_game. 
        // Server should handle re-join or duplicate join gracefully?
        // My server implementation: "Check if name taken". If I refresh, socket ID changes.
        // So I will be a "new player" with same name -> "Name taken" error.
        // MVP Issue: persistence.
        // Fix: Client stores socket ID? No, socket ID is ephemeral.
        // For MVP: Just emit join. If error "Name taken", maybe append ID? 
        // Or just let it fail for now.

        socket.emit('join_game', { code, playerName: name, playerAvatar: avatar });

        return () => {
            socket.off('player_joined', handleUpdate);
            socket.off('game_update', handleUpdate);
            socket.off('joined_successfully', handleUpdate);
            socket.off('game_started', handleGameStarted);
            socket.off('error', handleError);
        };
    }, [socket, code, name, avatar, router]);


    const copyCode = () => {
        navigator.clipboard.writeText(window.location.href); // Or just code
    };

    const startGame = () => {
        socket?.emit('start_game', code);
    };

    const toggleReady = () => {
        socket?.emit('player_ready', code);
    };

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="bg-red-500/20 p-8 rounded-xl border border-red-500 text-red-200">
                    <h1 className="text-2xl font-bold mb-2">Error</h1>
                    <p>{error}</p>
                    <button onClick={() => router.push('/')} className="mt-4 px-4 py-2 bg-red-600 rounded-lg text-white">Go Home</button>
                </div>
            </div>
        );
    }

    if (!game) {
        return <div className="min-h-screen flex items-center justify-center text-white">Loading Lobby...</div>;
    }

    const isHost = socket?.id === game.hostId;

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto flex flex-col gap-8">
            {/* Header */}
            <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10"
            >
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Lobby <span className="text-purple-400">#{game.code}</span></h1>
                    <p className="text-white/40">Waiting for players...</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="bg-black/40 px-6 py-3 rounded-xl border border-white/10 text-2xl font-mono tracking-widest text-white">
                        {game.code}
                    </div>
                    <button onClick={copyCode} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
                        <Copy className="w-6 h-6 text-white" />
                    </button>
                </div>
            </motion.div>

            {/* Players Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {game.players.map((player, i) => (
                    <motion.div
                        key={player.id}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 flex flex-col items-center gap-3"
                    >
                        {/* Host Crown */}
                        {game.hostId === player.id && (
                            <div className="absolute top-2 right-2">
                                <Crown className="w-5 h-5 text-yellow-400" />
                            </div>
                        )}

                        <img src={player.avatarUrl} className="w-20 h-20 rounded-full border-2 border-white/20" />
                        <div className="text-center">
                            <p className="font-bold text-white truncate max-w-[120px]">{player.name}</p>
                            <div className={`mt-2 text-xs px-2 py-1 rounded-full ${player.isReady ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/40'}`}>
                                {player.isReady ? 'Ready' : 'Not Ready'}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* Empty slots placeholders */}
                {Array.from({ length: Math.max(0, 16 - game.players.length) }).map((_, i) => (
                    <div key={i} className="bg-black/20 backdrop-blur-sm p-4 rounded-xl border border-white/5 flex flex-col items-center gap-3 opacity-50 justify-center min-h-[160px]">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                            <Users className="w-6 h-6 text-white/20" />
                        </div>
                        <p className="text-white/20 text-sm">Waiting...</p>
                    </div>
                ))}
            </div>

            {/* Action Bar */}
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent z-20"
            >
                <div className="max-w-4xl mx-auto flex gap-4">
                    <button
                        onClick={toggleReady}
                        className={`flex-1 py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${game.players.find(p => p.id === socket?.id)?.isReady
                            ? 'bg-yellow-600/80 text-white'
                            : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                            }`}
                    >
                        <CheckCircle2 className="w-6 h-6" />
                        {game.players.find(p => p.id === socket?.id)?.isReady ? 'Not Ready' : 'Ready Up'}
                    </button>

                    {isHost && (
                        <button
                            onClick={startGame}
                            disabled={game.players.length < 1}
                            className="flex-[2] py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-purple-500/25 text-white rounded-xl font-bold text-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Play className="w-6 h-6 fill-current" />
                            Start Game ({game.players.length}/16)
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

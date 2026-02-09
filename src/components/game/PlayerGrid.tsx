"use client";

import { motion } from 'framer-motion';
import { Shield, Skull, Eye, Footprints } from 'lucide-react';

interface Player {
    id: string;
    name: string;
    avatarUrl: string;
    isAlive: boolean;
    role?: string; // Only if revealed/self
}

interface PlayerGridProps {
    players: Player[];
    currentPlayerId: string;
    phase: string;
    onAction: (targetId: string) => void;
    myRole: string | null;
}

export default function PlayerGrid({ players, currentPlayerId, phase, onAction, myRole, nightInfo }: PlayerGridProps & { nightInfo?: any }) {

    const getActionIcon = (playerId: string) => {
        // Logic to show hover icon based on phase/role
        if (phase === 'NIGHT') {
            if (myRole === 'WEREWOLF') return <Skull className="w-6 h-6 text-red-500" />;
            if (myRole === 'SEER') return <Eye className="w-6 h-6 text-blue-400" />;
            if (myRole === 'DOCTOR') return <Shield className="w-6 h-6 text-green-400" />;
            if (myRole === 'WITCH') return <Shield className="w-6 h-6 text-purple-400" />;
        }
        if (phase === 'DAY_VOTE') return <Footprints className="w-6 h-6 text-yellow-500" />; // Vote icon
        if (myRole === 'AVENGER') return <Skull className="w-6 h-6 text-orange-500" />;
        return null; // No icon for others
    };

    const canInteract = (player: Player) => {
        if (!player.isAlive) return false;

        // Phase logic
        if (phase === 'DAY_VOTE') return player.id !== currentPlayerId;

        if (phase === 'NIGHT') {
            if (myRole === 'WEREWOLF') return player.id !== currentPlayerId;
            if (myRole === 'SEER') return player.id !== currentPlayerId;
            if (myRole === 'DOCTOR') return true; // Doctor can heal self
            if (myRole === 'WITCH') return true; // Witch can heal/poison anyone including self
        }

        if (myRole === 'AVENGER') return true; // Avenger can always change target

        return false;
    };

    const handleWitchAction = (targetId: string, action: 'HEAL' | 'POISON') => {
        if (action === 'POISON') {
            onAction(`POISON:${targetId}`);
        } else {
            console.log("Heal logic handled by top button");
        }
    };

    return (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">

            {/* Witch Heal UI Special Case */}
            {phase === 'NIGHT' && myRole === 'WITCH' && nightInfo?.victimId && (
                <div className="col-span-full bg-purple-900/50 p-4 rounded-xl border border-purple-500/50 flex flex-col items-center gap-2 mb-4">
                    <p className="text-white font-bold">The Werewolves attacked someone!</p>
                    <p className="text-sm text-white/70">Ref: {nightInfo.victimId}</p>
                    <button
                        onClick={() => onAction('HEAL')}
                        className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg text-white font-bold transition"
                    >
                        Heal Victim
                    </button>
                </div>
            )}

            {players.map((player) => {
                const interactable = canInteract(player);

                return (
                    <motion.div
                        key={player.id}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: player.isAlive ? 1 : 0.5 }}
                        whileHover={interactable ? { scale: 1.05 } : {}}
                        onClick={() => {
                            if (interactable) {
                                if (phase === 'NIGHT' && myRole === 'WITCH') {
                                    // Default click is Poison for Witch grid
                                    if (confirm(`Do you want to POISON ${player.name}?`)) {
                                        onAction(`POISON:${player.id}`);
                                    }
                                } else {
                                    onAction(player.id);
                                }
                            }
                        }}
                        className={`
                    relative p-4 rounded-xl border flex flex-col items-center gap-2 transition-all cursor-default
                    ${player.isAlive ? 'bg-white/10 border-white/10' : 'bg-red-900/20 border-red-500/30 grayscale'}
                    ${interactable ? 'cursor-pointer hover:border-purple-500/50 hover:bg-white/15 hover:shadow-lg hover:shadow-purple-500/10' : ''}
                    ${player.id === currentPlayerId ? 'ring-2 ring-blue-500/50' : ''}
                `}
                    >
                        {/* Role Badge (if visible) */}
                        {player.role && player.role !== 'UNKNOWN' && (
                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded-full text-[10px] uppercase font-bold tracking-wider text-white border border-white/10">
                                {player.role}
                            </div>
                        )}

                        {/* Night Action Indicator (Target) */}
                        {phase === 'NIGHT' && (
                            (myRole === 'WEREWOLF' && nightInfo?.werewolfTarget === player.id) ||
                            (myRole === 'DOCTOR' && nightInfo?.doctorTarget === player.id) ||
                            (myRole === 'WITCH' && nightInfo?.victimId === player.id) // Witch sees victim
                        ) && (
                                <div className="absolute top-2 left-2 p-1 bg-red-500/80 rounded-full animate-pulse z-10">
                                    <Skull className="w-4 h-4 text-white" />
                                </div>
                            )}

                        {/* Avatar */}
                        <div className="relative">
                            <img
                                src={player.avatarUrl}
                                className={`w-16 h-16 rounded-full border-2 ${player.isAlive ? 'border-white/20' : 'border-red-500/50'}`}
                            />
                            {/* Action Overlay on Hover */}
                            {interactable && (
                                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                    {getActionIcon(player.id)}
                                </div>
                            )}
                        </div>

                        {/* Name */}
                        <p className="text-white text-sm font-medium truncate max-w-full">{player.name}</p>

                        {/* Dead Status */}
                        {!player.isAlive && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <Skull className="w-12 h-12 text-red-500/40 rotate-12" />
                            </div>
                        )}

                        {/* Vote Count Badge */}
                        {phase === 'DAY_VOTE' && (player as any).votes > 0 && (
                            <div className="absolute -top-2 -right-2 bg-yellow-500 text-black font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-lg z-20">
                                {(player as any).votes}
                            </div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}

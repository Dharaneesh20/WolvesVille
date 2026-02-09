"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSocket } from '@/components/providers/SocketProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function CreateLobbyContent() {
    const socket = useSocket();
    const router = useRouter();
    const searchParams = useSearchParams();
    const name = searchParams.get('name');
    const avatar = searchParams.get('avatar');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [error, setError] = useState('');

    useEffect(() => {
        if (!socket || !name || !avatar) return;

        // Listen for success
        const handleGameCreated = (data: { code: string }) => {
            router.push(`/lobby/${data.code}?name=${encodeURIComponent(name)}&avatar=${encodeURIComponent(avatar)}`);
        };

        socket.on('game_created', handleGameCreated);
        socket.emit('create_game', { hostName: name, hostAvatar: avatar });

        return () => {
            socket.off('game_created', handleGameCreated);
        };
    }, [socket, name, avatar, router]);

    if (!name || !avatar) {
        return <div className="text-white text-center mt-20">Missing profile data. Please go back.</div>;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black/50">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                <h2 className="text-2xl text-white font-bold">Creating Lobby...</h2>
                {error && <p className="text-red-400">{error}</p>}
            </div>
        </div>
    );
}

export default function CreateLobby() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-black/50">
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
            </div>
        }>
            <CreateLobbyContent />
        </Suspense>
    );
}

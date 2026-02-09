import { Server, Socket } from 'socket.io';
import { games } from './lobbyHandler';

export const gameHandler = (io: Server, socket: Socket) => {

    socket.on('cast_vote', (payload: { code: string, targetId: string }) => {
        const game = games.get(payload.code);
        if (!game) return;

        game.castVote(socket.id, payload.targetId);

        // Emit update immediately or wait for timer?
        // Usually wait for timer or if everyone voted.
        // For MVP, just ack.
    });

    socket.on('send_chat', (payload: { code: string, message: string }) => {
        const game = games.get(payload.code);
        if (!game) return;

        // Security: Block chat during night (unless we implement separate wolf chat later)
        if (!game.phase.startsWith('DAY') && game.phase !== 'GAME_OVER' && game.phase !== 'LOBBY') {
            socket.emit('error', { message: 'Chat disabled during night' });
            return;
        }

        const player = game.getPlayer(socket.id);
        if (!player || !player.isAlive) return; // Dead players can't chat? OR dead chat separate.

        io.to(payload.code).emit('chat_message', {
            senderId: player.id,
            senderName: player.name,
            text: payload.message,
            timestamp: Date.now()
        });
    });
    socket.on('update_settings', (payload: { code: string, settings: any }) => {
        const game = games.get(payload.code);
        if (!game) return;

        // Verify host
        if (game.hostId !== socket.id) return;

        // Update settings
        game.settings = { ...game.settings, ...payload.settings };

        // Broadcast update so clients see new settings immediately (optional, or just next tick)
        // But better to broadcast so UI updates if we show settings there
        // For now, next tick/phase change picks it up. 
        // Force a broadcast:
        // game.broadcastUpdate(); // Access private method? No, need public wrapper or just wait.
        // Actually Game.ts has public broadcastUpdate? No it's private.
        // But onUpdate callback handles it.
        // Let's just let the loop handle it or trigger a phase update if needed.
        // Actually, just waiting for next tick is fine for settings.
    });
};

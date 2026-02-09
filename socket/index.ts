import { Server, Socket } from 'socket.io';
import { lobbyHandler, handleDisconnect } from './lobbyHandler';
import { gameHandler } from './gameHandler';

export const setupSocket = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Register handlers
        lobbyHandler(io, socket);
        gameHandler(io, socket);

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
            handleDisconnect(io, socket);
        });
    });
};

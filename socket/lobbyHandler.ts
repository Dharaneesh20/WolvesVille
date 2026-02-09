import { Server, Socket } from 'socket.io';
import { Game } from '../game/Game';
import { Player } from '../game/Player';

// In-memory store for active games
// In a real app, this might be Redis or a database, but Map is fine for active state in MVP
export const games = new Map<string, Game>();

export const lobbyHandler = (io: Server, socket: Socket) => {

    socket.on('create_game', (payload: { hostName: string, hostAvatar: string }) => {
        // Generate code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();

        // Create Game
        const game = new Game(code, socket.id, (g) => {
            // Need to broadcast separate state to each player for privacy
            g.players.forEach(p => {
                io.to(p.socketId).emit('game_update', { game: g.getDTO(p.socketId) });
            });
        });

        // Create Host Player
        const hostProfile = {
            id: socket.id, // For now, use socket ID as user ID
            name: payload.hostName,
            avatarUrl: payload.hostAvatar
        };
        const hostPlayer = new Player(hostProfile, socket.id);
        hostPlayer.isReady = true; // Host is always ready? Or maybe not.

        game.addPlayer(hostPlayer);
        games.set(code, game);

        // Join room
        socket.join(code);

        // Send success
        socket.emit('game_created', { code, game: game.getDTO(socket.id) });
        console.log(`Game created: ${code} by ${payload.hostName}`);
    });

    socket.on('join_game', (payload: { code: string, playerName: string, playerAvatar: string }) => {
        const code = payload.code.toUpperCase();
        const game = games.get(code);

        if (!game) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }

        if (game.phase !== 'LOBBY') {
            socket.emit('error', { message: 'Game already started' });
            return;
        }

        // Check if name taken (by someone else)
        const nameTaken = Array.from(game.players.values()).some(p => p.name === payload.playerName && p.id !== socket.id);
        if (nameTaken) {
            socket.emit('error', { message: 'Name already taken' });
            return;
        }

        // Add or Update Player
        const playerProfile = {
            id: socket.id,
            name: payload.playerName,
            avatarUrl: payload.playerAvatar
        };
        const newPlayer = new Player(playerProfile, socket.id);
        game.addPlayer(newPlayer);

        socket.join(code);

        // Notify everyone (Privacy aware)
        game.players.forEach(p => {
            io.to(p.socketId).emit('player_joined', { player: newPlayer, game: game.getDTO(p.socketId) });
        });

        socket.emit('joined_successfully', { game: game.getDTO(socket.id) });
    });

    socket.on('player_ready', (code: string) => {
        console.log(`Player ready request: ${socket.id} for game ${code}`);
        const game = games.get(code);

        if (!game) {
            console.error(`Game ${code} not found for player_ready`);
            return;
        }

        const player = game.getPlayer(socket.id);
        if (player) {
            player.isReady = !player.isReady;
            console.log(`Player ${player.name} (${socket.id}) ready status: ${player.isReady}`);
            // Broadcast update
            game.players.forEach(p => {
                io.to(p.socketId).emit('game_update', { game: game.getDTO(p.socketId) });
            });
        }
    });

    socket.on('start_game', (code: string) => {
        console.log(`Start game request: ${code} from ${socket.id}`);
        const game = games.get(code);
        if (!game) {
            console.error(`Game ${code} not found for start_game`);
            return;
        }

        // Only host can start
        if (game.hostId !== socket.id) {
            console.warn(`Non-host ${socket.id} tried to start game ${code}`);
            return;
        }

        // Check min players
        if (game.players.size < 1) { // Min 1 for testing
            socket.emit('error', { message: 'Need at least 1 player' });
            return;
        }

        // Start
        try {
            game.start();
            console.log(`Game ${code} started!`);
            // Privacy aware broadcast
            game.players.forEach(p => {
                io.to(p.socketId).emit('game_started', { game: game.getDTO(p.socketId) });
            });
        } catch (e: any) {
            console.error(`Error starting game ${code}:`, e);
            socket.emit('error', { message: e.message });
        }
    });

};

export const handleDisconnect = (io: Server, socket: Socket) => {
    // Inefficient search for MVP, but works
    games.forEach((game, code) => {
        if (game.phase === 'LOBBY') {
            if (game.players.has(socket.id)) {
                game.removePlayer(socket.id);
                // If game empty, maybe delete game?
                if (game.players.size === 0) {
                    games.delete(code);
                } else {
                    game.players.forEach(p => {
                        io.to(p.socketId).emit('game_update', { game: game.getDTO(p.socketId) });
                    });
                }
            }
        }
        // If game started, we might mark as disconnected but keep in object (for reconnects)
    });
};

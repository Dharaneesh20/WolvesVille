import { Player, Role } from './Player';

export type GamePhase =
    | 'LOBBY'
    | 'NIGHT'
    | 'DAY_DISCUSS'
    | 'DAY_VOTE'
    | 'GAME_OVER';

export class Game {
    public code: string;
    public hostId: string;
    public players: Map<string, Player> = new Map(); // socketId -> Player
    public phase: GamePhase = 'LOBBY';
    public phaseTimer: number = 0;

    // Host Settings
    public settings = {
        nightDuration: 45,
        dayDiscussDuration: 60,
        dayVoteDuration: 30
    };

    // Game Logic State
    public votes: Map<string, string> = new Map(); // voterId -> targetId
    public skipVotes: Set<string> = new Set(); // voters who chose to skip

    public nightActions: {
        werewolfTarget: string | null;
        doctorTarget: string | null;
        seerCheck: string | null;
        witchHeal: boolean;
        witchPoison: string | null;
    } = { werewolfTarget: null, doctorTarget: null, seerCheck: null, witchHeal: false, witchPoison: null };

    public winner: 'VILLAGERS' | 'WEREWOLVES' | null = null;

    public onUpdate?: (game: Game) => void;
    private intervalId: NodeJS.Timeout | null = null;

    constructor(code: string, hostId: string, onUpdate?: (game: Game) => void) {
        this.code = code;
        this.hostId = hostId;
        this.onUpdate = onUpdate;
    }

    addPlayer(player: Player) {
        this.players.set(player.socketId, player);
        this.broadcastUpdate();
    }

    removePlayer(socketId: string) {
        this.players.delete(socketId);
        this.broadcastUpdate();
    }

    getPlayer(socketId: string) {
        return this.players.get(socketId);
    }

    getAllPlayers() {
        return Array.from(this.players.values());
    }

    start() {
        // Min 4 players for real game logic, but 1 for dev testing
        if (this.players.size < 1) {
            throw new Error('Not enough players (min 1)');
        }
        this.assignRoles();
        this.setPhase('NIGHT');

        // Start Ticker
        if (this.intervalId) clearInterval(this.intervalId);
        this.intervalId = setInterval(() => this.tick(), 1000);
        this.broadcastUpdate();
    }

    stop() {
        if (this.intervalId) clearInterval(this.intervalId);
    }

    private broadcastUpdate() {
        if (this.onUpdate) this.onUpdate(this);
    }

    private tick() {
        if (this.phase === 'GAME_OVER' || this.phase === 'LOBBY') return;

        this.phaseTimer--;
        if (this.phaseTimer <= 0) {
            this.nextPhase();
        }
        this.broadcastUpdate();
    }

    private nextPhase() {
        switch (this.phase) {
            case 'NIGHT':
                this.resolveNightActions();
                if (this.checkWinCondition()) return;
                this.setPhase('DAY_DISCUSS');
                break;
            case 'DAY_DISCUSS':
                this.setPhase('DAY_VOTE');
                break;
            case 'DAY_VOTE':
                this.resolveDayVote();
                if (this.checkWinCondition()) return;
                this.setPhase('NIGHT');
                break;
        }
    }

    private resolveNightActions() {
        const targetId = this.nightActions.werewolfTarget; // Who wolves wanted to kill
        const protectedId = this.nightActions.doctorTarget;
        const witchHeal = this.nightActions.witchHeal;
        const witchPoisonId = this.nightActions.witchPoison;

        // 1. Resolve Werewolf Attack
        if (targetId) {
            let isSaved = false;
            if (targetId === protectedId) isSaved = true;
            if (witchHeal) isSaved = true;

            if (!isSaved) {
                this.killPlayer(targetId);
            }
        }

        // 2. Resolve Witch Poison
        if (witchPoisonId) {
            // Cannot be saved by doctor (usually rules say doctor only heals wolf attacks)
            this.killPlayer(witchPoisonId);
        }

        // Reset Actions
        this.nightActions = { werewolfTarget: null, doctorTarget: null, seerCheck: null, witchHeal: false, witchPoison: null };
    }

    private killPlayer(targetId: string) {
        const victim = this.players.get(targetId);
        if (victim && victim.isAlive) {
            victim.die();
            // Avenger Logic
            if (victim.role === 'AVENGER' && victim.avengeTarget) {
                // If Avenger dies, their target dies too (or they get a last shot logic - simplifying to pre-selected target for MVP)
                const avengee = this.players.get(victim.avengeTarget);
                if (avengee && avengee.isAlive) {
                    avengee.die();
                }
            }
        }
    }

    private assignRoles() {
        const playerArray = this.getAllPlayers();
        // Fisher-Yates Shuffle
        for (let i = playerArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [playerArray[i], playerArray[j]] = [playerArray[j], playerArray[i]];
        }

        const count = playerArray.length;

        // Distribution:
        // Always 1 Seer, 1 Doctor, 1 Witch (if enough players), 1 Avenger (if enough)
        // Wolves: approx 1/4

        let roles: Role[] = [];

        if (count == 1) { roles = ['WEREWOLF']; } // Testing
        else {
            roles.push('SEER', 'DOCTOR');
            if (count >= 4) roles.push('WEREWOLF');
            if (count >= 5) roles.push('WITCH');
            if (count >= 6) roles.push('WEREWOLF');
            if (count >= 7) roles.push('AVENGER');
            if (count >= 8) roles.push('VILLAGER');
            // Fill rest with Villagers
            while (roles.length < count) {
                roles.push('VILLAGER');
            }
            // Ensure at least 1 wolf if > 2 players
            if (count > 2 && !roles.includes('WEREWOLF')) {
                roles[roles.length - 1] = 'WEREWOLF';
            }
        }

        // Shuffle roles again to be safe
        for (let i = roles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [roles[i], roles[j]] = [roles[j], roles[i]];
        }

        playerArray.forEach((p, i) => {
            p.setRole(roles[i]);
            // Init empty state
            p.avengeTarget = null;
            p.protected = false;
        });
    }

    setPhase(newPhase: GamePhase) {
        this.phase = newPhase;
        this.votes.clear();
        this.skipVotes.clear(); // Reset skips

        // Reset state
        if (newPhase === 'NIGHT') {
            this.getAllPlayers().forEach(p => p.protected = false);
        }

        // Set timer using Settings
        switch (newPhase) {
            case 'NIGHT': this.phaseTimer = this.settings.nightDuration; break;
            case 'DAY_DISCUSS': this.phaseTimer = this.settings.dayDiscussDuration; break;
            case 'DAY_VOTE': this.phaseTimer = this.settings.dayVoteDuration; break;
        }
    }

    castVote(voterId: string, targetId: string) {
        if (!this.players.has(voterId)) return;
        const voter = this.players.get(voterId);
        if (!voter?.isAlive) return;

        // Skip Vote Logic (targetId = 'SKIP')
        if (targetId === 'SKIP' && this.phase === 'DAY_VOTE') {
            this.skipVotes.add(voterId);
            this.votes.delete(voterId); // Remove kill vote if any
            this.broadcastUpdate();
            return;
        }

        if (!this.players.has(targetId)) return; // Normal vote target check

        // Actions per phase
        if (this.phase === 'DAY_VOTE') {
            this.votes.set(voterId, targetId);
            this.skipVotes.delete(voterId);
        }
        else if (this.phase === 'NIGHT') {
            if (voter.role === 'WEREWOLF') {
                this.nightActions.werewolfTarget = targetId;
            }
            if (voter.role === 'SEER') {
                if (this.nightActions.seerCheck) return; // Prevent re-checking
                this.nightActions.seerCheck = targetId;
            }
            if (voter.role === 'DOCTOR') {
                this.nightActions.doctorTarget = targetId;
            }
            if (voter.role === 'WITCH') {
                if (targetId.startsWith('POISON:') && voter.potions.poison) {
                    const realTarget = targetId.split(':')[1];
                    this.nightActions.witchPoison = realTarget;
                    voter.potions.poison = false;
                } else if (targetId === 'HEAL' && voter.potions.heal) {
                    this.nightActions.witchHeal = true;
                    voter.potions.heal = false;
                }
            }
        }

        // Avenger can always set target
        if (voter.role === 'AVENGER') {
            voter.avengeTarget = targetId;
        }

        this.broadcastUpdate();
    }

    resolveDayVote() {
        const voteCounts = new Map<string, number>();
        this.votes.forEach((targetId) => {
            voteCounts.set(targetId, (voteCounts.get(targetId) || 0) + 1);
        });

        const skipCount = this.skipVotes.size;
        let maxVotes = 0;
        let targetToDie: string | null = null;

        voteCounts.forEach((count, targetId) => {
            if (count > maxVotes) {
                maxVotes = count;
                targetToDie = targetId;
            } else if (count === maxVotes) {
                targetToDie = null; // Tie
            }
        });

        // Skip Replaces Death if Skip >= Max Votes
        if (skipCount >= maxVotes && skipCount > 0) {
            // Skipped
            return;
        }

        if (targetToDie) {
            this.killPlayer(targetToDie);
        }
    }

    checkWinCondition() {
        const alivePlayers = this.getAllPlayers().filter(p => p.isAlive);
        const aliveWolves = alivePlayers.filter(p => p.role === 'WEREWOLF').length;
        const aliveVillagers = alivePlayers.length - aliveWolves;

        if (aliveWolves === 0) {
            this.winner = 'VILLAGERS';
            this.phase = 'GAME_OVER';
            return true;
        }

        if (aliveWolves >= aliveVillagers) {
            // Optimization: If Witch has poison, village MIGHT still win, but standard rules usually end here
            this.winner = 'WEREWOLVES';
            this.phase = 'GAME_OVER';
            return true;
        }

        return false;
    }

    // Role Hiding / DTO Logic
    getDTO(viewerSocketId: string) {
        const viewer = this.players.get(viewerSocketId);

        return {
            code: this.code,
            hostId: this.hostId,
            phase: this.phase,
            timer: this.phaseTimer,
            settings: this.settings,
            winner: this.winner,
            // Night Action Info (Role specific)
            nightInfo: (this.phase === 'NIGHT') ? {
                // Witch sees victim
                victimId: (viewer?.role === 'WITCH') ? this.nightActions.werewolfTarget : null,
                // Werewolves see their agreed target
                werewolfTarget: (viewer?.role === 'WEREWOLF') ? this.nightActions.werewolfTarget : null,
                // Doctor sees who they are protecting
                doctorTarget: (viewer?.role === 'DOCTOR') ? this.nightActions.doctorTarget : null,
                // Seer sees result if they checked
                seerResult: (viewer?.role === 'SEER' && this.nightActions.seerCheck) ?
                    { id: this.nightActions.seerCheck, role: this.players.get(this.nightActions.seerCheck!)?.role } : null
            } : null,
            players: Array.from(this.players.values()).map(p => {
                // VISIBILITY LOGIC
                let showRole = false;

                // 1. Always show my own role
                if (p.socketId === viewerSocketId) showRole = true;

                // 2. Game Over show all
                if (this.phase === 'GAME_OVER') showRole = true;

                // 3. Dead players revealed (User request)
                if (!p.isAlive) showRole = true;

                // 4. Werewolves see each other
                if (viewer?.role === 'WEREWOLF' && p.role === 'WEREWOLF') showRole = true;

                return {
                    id: p.id, // socketId
                    name: p.name,
                    avatarUrl: p.avatarUrl,
                    isReady: p.isReady,
                    isAlive: p.isAlive,
                    role: showRole ? p.role : 'UNKNOWN', // Hide!
                    votes: (this.phase === 'DAY_VOTE' || this.phase === 'GAME_OVER')
                        ? this.getVoteFor(p.id)
                        : undefined // Only show votes during voting (or end)
                };
            })
        };
    }

    private getVoteFor(playerId: string) {
        // Find who voted for this player
        // Invert map: Map<Voter, Target> -> Count votes for Target
        // We want to show WHO voted for WHOM?
        // Usually: separate list.
        // For Player Grid: show "votes received".
        let count = 0;
        this.votes.forEach(target => { if (target === playerId) count++; });
        return count;
        // Skip votes?
    }
}

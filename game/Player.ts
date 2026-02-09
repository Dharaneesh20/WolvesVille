export type Role = 'VILLAGER' | 'WEREWOLF' | 'SEER' | 'DOCTOR' | 'WITCH' | 'AVENGER';

export interface PlayerProfile {
    id: string; // Database ID or unique session ID
    name: string;
    avatarUrl: string;
}

export class Player {
    public id: string;
    public name: string;
    public avatarUrl: string;
    public socketId: string;
    public role: Role | null = null;
    public isAlive: boolean = true;
    public isReady: boolean = false;

    // Game state flags
    public protected: boolean = false; // By Doctor
    public potions: { heal: boolean, poison: boolean } = { heal: true, poison: true }; // Witch
    public avengeTarget: string | null = null; // Avenger's target

    constructor(profile: PlayerProfile, socketId: string) {
        this.id = profile.id;
        this.name = profile.name;
        this.avatarUrl = profile.avatarUrl;
        this.socketId = socketId;
    }

    setRole(role: Role) {
        this.role = role;
        // Reset role specific state
        if (role === 'WITCH') {
            this.potions = { heal: true, poison: true };
        }
    }

    die() {
        this.isAlive = false;
    }

    revive() {
        this.isAlive = true;
    }
}

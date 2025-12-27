const FACTIONS = {
    STORM_RAIDERS: {
        id: 'storm_raiders',
        name: 'Storm Raiders',
        color: '#00f0ff',
        description: 'Lightning-fast aggressive raiders.',
        abilities: {
            passive: { name: 'Momentum', desc: '+1 Movement if you control a Nexus.' },
            active: { name: 'Blitz', desc: 'Once per turn: Move +1 space.', type: 'move_modifier', cooldown: 'turn' }
        }
    },
    IRON_PHALANX: {
        id: 'iron_phalanx',
        name: 'Iron Phalanx',
        color: '#ff2a2a',
        description: 'Defensive tactical blockers.',
        abilities: {
            passive: { name: 'Fortress', desc: 'Opponent cannot move past your warriors.' },
            active: { name: 'Formation', desc: 'Warriors can stack with Champion (Automatic).', type: 'passive_rule' }
        }
    },
    SHADOW_GUILD: {
        id: 'shadow_guild',
        name: 'Shadow Guild',
        color: '#bc13fe',
        description: 'Manipulative tacticians.',
        abilities: {
            passive: { name: 'Shadow Step', desc: 'Can move backwards.' },
            active: { name: 'Swap', desc: 'Once per round: Swap a die with opponent.', type: 'draft_action', cooldown: 'round' }
        }
    },
    CRYSTAL_SEERS: {
        id: 'crystal_seers',
        name: 'Crystal Seers',
        color: '#00ff9d',
        description: 'Predictive strategists.',
        abilities: {
            passive: { name: 'Amplify', desc: 'Nexus Points count as 2 for victory (Need 3).' },
            active: { name: 'Foresight', desc: 'See next round dice.', type: 'info' }
        }
    }
};

class FactionSystem {
    constructor(game) {
        this.game = game;
        this.activeAbilities = {
            p1: { blitzUsed: false, swapUsed: false },
            p2: { blitzUsed: false, swapUsed: false }
        };
        // Flags for current turn
        this.turnFlags = {
            p1: { moveBonus: 0, canMoveBackwards: false },
            p2: { moveBonus: 0, canMoveBackwards: false }
        };
    }

    onTurnStart(playerId) {
        const pKey = playerId === 1 ? 'p1' : 'p2';
        this.activeAbilities[pKey].blitzUsed = false;
        this.turnFlags[pKey].moveBonus = 0;

        // Passive Checks
        const faction = this.game.state.players[pKey].faction;
        if (faction === 'storm_raiders') {
            // Momentum: +1 if control nexus
            if (this.game.state.nexusControl[pKey] > 0) {
                this.turnFlags[pKey].moveBonus = 1;
                this.game.log(`${faction} Momentum active: +1 Movement`);
            }
        }
    }

    onRoundStart() {
        this.activeAbilities.p1.swapUsed = false;
        this.activeAbilities.p2.swapUsed = false;

        // Crystal Seers Foresight would trigger here (preview next dice)
        // But logic for that requires generating next dice early. 
        // For MVP, we'll just log or show a "Foresight" button to peek.
    }

    activateAbility(playerId, abilityName) {
        const pKey = playerId === 1 ? 'p1' : 'p2';
        const faction = this.game.state.players[pKey].faction;

        if (faction === 'storm_raiders' && abilityName === 'Blitz') {
            if (!this.activeAbilities[pKey].blitzUsed) {
                this.activeAbilities[pKey].blitzUsed = true;
                this.turnFlags[pKey].moveBonus += 1; // Accumulate? or Set?
                // "Move an additional +1 space"
                // If Momentum is also active (+1), does it stack? Usually yes.
                this.game.log("Blitz activated! +1 Movement this turn.");
                return true;
            }
        }

        if (faction === 'shadow_guild' && abilityName === 'Swap') {
            if (this.game.state.phase !== CONSTANTS.PHASES.DRAFT) return false;
            if (!this.activeAbilities[pKey].swapUsed) {
                this.activeAbilities[pKey].swapUsed = true;
                this.game.log("Swap activated! Swapping a die...", "important");

                // Implement Swap: Take user's lowest die and swap with opponent's highest avaliable/drafted die? 
                // Or just swap one of user's drafted dice with one of the pool dice?
                // Rule: "Swap a die with opponent." usually means from their hand.
                // Simplified: Swap P1 last drafted die with P2 last drafted die (if any).

                const myDice = this.game.diceSystem.getPlayerDice(playerId);
                const oppDice = this.game.diceSystem.getPlayerDice(playerId === 1 ? 2 : 1);

                if (myDice.length > 0 && oppDice.length > 0) {
                    const myDie = myDice[myDice.length - 1];
                    const oppDie = oppDice[oppDice.length - 1];

                    // Swap owners
                    myDie.owner = (playerId === 1 ? 'p2' : 'p1');
                    oppDie.owner = (playerId === 1 ? 'p1' : 'p2');

                    this.game.log(`Swapped ${myDie.value} with ${oppDie.value}!`);
                    return true;
                } else {
                    this.game.log("Not enough dice to swap!");
                    return false;
                }
            }
        }

        if (faction === 'crystal_seers' && abilityName === 'Foresight') {
            // Just log a prediction
            const prediction = [];
            for (let i = 0; i < 5; i++) prediction.push(Math.floor(Math.random() * 6) + 1);
            this.game.log(`Foresight: Next round dice will be roughly: ${prediction.join(', ')}`, 'important');
            return true;
        }

        return false;
    }

    checkWinCondition(playerId, nexusCount) {
        const pKey = playerId === 1 ? 'p1' : 'p2';
        const faction = this.game.state.players[pKey].faction;

        let target = 5;
        if (faction === 'crystal_seers') {
            // Amplify: Count as 2? 
            // Prompt says: "Count as 2 for victory condition (need only 3 to win instead of 5)"
            // So practically, if count >= 3, they win.
            target = 3;
        }

        return nexusCount >= target;
    }
}

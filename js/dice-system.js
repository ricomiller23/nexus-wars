class DiceSystem {
    constructor(gameEngine) {
        this.game = gameEngine;
        this.pool = []; // Array of { id, value, owner: null|'p1'|'p2' }
        this.selectedDieId = null;
    }

    rollDice() {
        this.pool = [];
        // 5 dice as per rules
        for (let i = 0; i < 5; i++) {
            this.pool.push({
                id: `die-${Date.now()}-${i}`,
                value: Math.floor(Math.random() * 6) + 1,
                owner: null
            });
        }
        this.game.log("Dice rolled: " + this.pool.map(d => d.value).join(', '));
    }

    getAvailableDice() {
        return this.pool.filter(d => d.owner === null);
    }

    getPlayerDice(playerId) {
        return this.pool.filter(d => d.owner === (playerId === 1 ? 'p1' : 'p2'));
    }

    draftDie(dieId, playerId) {
        const die = this.pool.find(d => d.id === dieId);
        if (die && die.owner === null) {
            die.owner = playerId === 1 ? 'p1' : 'p2';
            this.game.log(`${playerId === 1 ? 'Player' : 'AI'} drafted a ${die.value}`);
            return true;
        }
        return false;
    }

    useDie(dieId) {
        // Remove die from pool after use in movement
        this.pool = this.pool.filter(d => d.id !== dieId);
        this.selectedDieId = null;
    }
}

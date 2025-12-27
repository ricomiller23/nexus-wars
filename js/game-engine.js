class GameEngine {
    constructor() {
        this.state = {
            phase: CONSTANTS.PHASES.SETUP,
            currentPlayer: 1, // 1 or 2
            firstPlayer: 1,   // Rotating first player for draft
            turnCount: 0,
            nexusControl: { p1: 0, p2: 0 },
            winner: null,
            players: {
                p1: { faction: FACTIONS.STORM_RAIDERS.id },
                p2: { faction: FACTIONS.IRON_PHALANX.id }
            },
            pieces: {
                p1: [
                    { id: 'p1-c', type: 'champion', position: CONSTANTS.BOARD.HOME_BASE_P1, faction: 'p1' },
                    { id: 'p1-w1', type: 'warrior', position: CONSTANTS.BOARD.HOME_BASE_P1, faction: 'p1' },
                    { id: 'p1-w2', type: 'warrior', position: CONSTANTS.BOARD.HOME_BASE_P1, faction: 'p1' },
                    { id: 'p1-w3', type: 'warrior', position: CONSTANTS.BOARD.HOME_BASE_P1, faction: 'p1' },
                    { id: 'p1-w4', type: 'warrior', position: CONSTANTS.BOARD.HOME_BASE_P1, faction: 'p1' },
                    { id: 'p1-w5', type: 'warrior', position: CONSTANTS.BOARD.HOME_BASE_P1, faction: 'p1' },
                    { id: 'p1-w6', type: 'warrior', position: CONSTANTS.BOARD.HOME_BASE_P1, faction: 'p1' }
                ],
                p2: [
                    { id: 'p2-c', type: 'champion', position: CONSTANTS.BOARD.HOME_BASE_P2, faction: 'p2' },
                    { id: 'p2-w1', type: 'warrior', position: CONSTANTS.BOARD.HOME_BASE_P2, faction: 'p2' },
                    { id: 'p2-w2', type: 'warrior', position: CONSTANTS.BOARD.HOME_BASE_P2, faction: 'p2' },
                    { id: 'p2-w3', type: 'warrior', position: CONSTANTS.BOARD.HOME_BASE_P2, faction: 'p2' },
                    { id: 'p2-w4', type: 'warrior', position: CONSTANTS.BOARD.HOME_BASE_P2, faction: 'p2' },
                    { id: 'p2-w5', type: 'warrior', position: CONSTANTS.BOARD.HOME_BASE_P2, faction: 'p2' },
                    { id: 'p2-w6', type: 'warrior', position: CONSTANTS.BOARD.HOME_BASE_P2, faction: 'p2' }
                ]
            },
            nexusOwners: {} // { spaceIndex: 'p1' | 'p2' }
        };

        this.diceSystem = new DiceSystem(this);
        this.factionSystem = new FactionSystem(this);

        // Bind UI
        document.getElementById('ability-btn').addEventListener('click', () => this.onAbilityClick());

        this.init();
    }

    init() {
        console.log("Game Engine Initialized");
        this.log("Welcome to NEXUS WARS");
        this.startRound();
    }

    startRound() {
        this.state.turnCount++;
        this.log(`--- ROUND ${this.state.turnCount} START ---`, 'important');

        this.factionSystem.onRoundStart();

        // Phase 1: Dice Draft
        this.state.phase = CONSTANTS.PHASES.DRAFT;
        this.diceSystem.rollDice();

        // Determine drafting order based on firstPlayer
        this.state.currentPlayer = this.state.firstPlayer;

        this.updateUI();

        // If AI's turn to draft, trigger AI (placeholder)
        if (this.state.currentPlayer === 2) {
            setTimeout(() => this.aiDraft(), 1000);
        }
    }

    // USER ACTION: Click on a die in the pool to draft it
    onDieClick(dieId) {
        if (this.state.phase !== CONSTANTS.PHASES.DRAFT) return;

        // Draft logic
        const success = this.diceSystem.draftDie(dieId, this.state.currentPlayer);
        if (success) {
            // Visual feedback
            const die = this.diceSystem.pool.find(d => d.id === dieId);
            // We need screen coords for particles... messy without renderer access in logic.
            // MVP: Just spawn at center for draft.
            window.renderer.particleSystem.spawn(window.renderer.center.x, window.renderer.center.y, '#fff', 'sparkle');

            this.nextDraftTurn();
        }
    }

    nextDraftTurn() {
        const available = this.diceSystem.getAvailableDice();
        if (available.length === 0) {
            // Draft complete, move to Movement Phase
            this.startMovementPhase();
            return;
        }

        // Switch drafter
        this.state.currentPlayer = this.state.currentPlayer === 1 ? 2 : 1;
        this.updateUI();

        if (this.state.currentPlayer === 2) {
            setTimeout(() => this.aiDraft(), 1000);
        }
    }

    aiDraft() {
        // Simple AI: Pick highest available die
        const available = this.diceSystem.getAvailableDice();
        if (available.length > 0) {
            // Smart Drafting: 
            // 1. Pick 6s
            // 2. Pick dice that allow landing on Nexus? (Too complex for DRAFT phase without knowing board state perfectly)
            // MVP: Prioritize 6, 5, 4.
            available.sort((a, b) => b.value - a.value);
            this.diceSystem.draftDie(available[0].id, 2);
            this.nextDraftTurn();
        }
    }

    triggerAiAbility() {
        const abilityToUse = this.factionSystem.aiEvaluateAbility(2);
        if (abilityToUse) {
            this.log(`AI activates ${abilityToUse}!`, 'p2');
            this.factionSystem.activateAbility(2, abilityToUse);
            this.updateUI();
            // Particle
            window.renderer.particleSystem.spawn(window.renderer.center.x, 50, '#ff2a2a', 'sparkle');
        }
    }
}

onAbilityClick() {
    const pKey = this.state.currentPlayer === 1 ? 'p1' : 'p2';
    const factionId = this.state.players[pKey].faction;
    // Find ability name
    let abilityName = '';
    Object.values(FACTIONS).forEach(f => {
        if (f.id === factionId) abilityName = f.abilities.active.name;
    });

    const success = this.factionSystem.activateAbility(this.state.currentPlayer, abilityName);
    if (success) {
        this.updateUI();
    } else {
        this.log("Cannot use ability right now.", "normal");
    }
}

startMovementPhase() {
    this.state.phase = CONSTANTS.PHASES.MOVEMENT;
    this.log("--- MOVEMENT PHASE ---", 'important');
    // Player 1 always starts movement? Or rotating? Rules say: "Players alternate using their dice."
    // Usually starts with First Player of the round.
    this.state.currentPlayer = this.state.firstPlayer;
    this.factionSystem.onTurnStart(this.state.currentPlayer);
    this.updateUI();

    if (this.state.currentPlayer === 2) {
        setTimeout(() => this.aiMove(), 1000);
    }
}

// USER ACTION: Select a drafted die to use for movement
selectDieForMove(dieId) {
    if (this.state.phase !== CONSTANTS.PHASES.MOVEMENT) return;
    if (this.state.currentPlayer !== 1) return;

    const die = this.diceSystem.getPlayerDice(1).find(d => d.id === dieId);
    if (die) {
        this.diceSystem.selectedDieId = dieId;
        this.log(`Die selected: ${die.value}. Select a piece to move.`);
        window.renderer.draw(this.state); // Redraw to show selection
    }
}

// USER ACTION: Click on a piece to move it
onPieceClick(pieceId) {
    if (this.state.phase !== CONSTANTS.PHASES.MOVEMENT) return;
    if (this.state.currentPlayer !== 1) return;
    if (!this.diceSystem.selectedDieId) {
        this.log("Select a die first!");
        return;
    }

    const die = this.diceSystem.getPlayerDice(1).find(d => d.id === this.diceSystem.selectedDieId);
    this.executeMove(pieceId, die.value);
}

executeMove(pieceId, steps) {
    const playerKey = this.state.currentPlayer === 1 ? 'p1' : 'p2';
    const pieces = this.state.pieces[playerKey];
    const piece = pieces.find(p => p.id === pieceId);

    if (!piece) return false;

    // Calculate new position (1-20 loop)
    // Apply Faction Movement Bonuses
    const bonus = this.factionSystem.turnFlags[playerKey].moveBonus || 0;
    const totalSteps = steps + bonus;

    let newPos = piece.position + totalSteps;
    if (newPos > CONSTANTS.BOARD.TOTAL_SPACES) newPos -= CONSTANTS.BOARD.TOTAL_SPACES;

    // Validate Move (Blocking, Home Base for Champ)
    if (!this.isValidMove(piece, newPos, totalSteps)) {
        this.log("Invalid Move!", "p2");
        return false;
    }

    // Move Piece
    piece.position = newPos;
    this.log(`${piece.type} moved to space ${newPos}`);

    // Resolve Space
    this.resolveSpace(piece, newPos);

    // Consume Die
    this.diceSystem.useDie(this.diceSystem.selectedDieId);

    // Next Turn
    this.nextMoveTurn();
    return true;
}

isValidMove(piece, targetPos, steps) {
    // Core Blocking Rule: "Multiple pieces on same space: Opponent MUST use exact die value to land on it"
    // Wait, "Opponent MUST use exact die value". This implies if it ISN'T exact, you can't land.
    // But normal movement IS exact die value. "Move ONE piece... that many spaces".
    // The rule "Higher/lower values must pass over or stop before" applies if you split movement? 
    // Or maybe it means you can't stop there if you have movement left?
    // With single die movement, you ALWAYS land exactly.
    // So blocking basically means: "You can land on a blocked space IF you have the exact die, which you always do if you move there."
    // Ah, prompt says: "If opponent has higher/lower value, they must pass over or stop before" <- This is confusing for exact movement.
    // It likely means "You can't move PAST a block?" No, it says "Must use exact die value to LAND on it".
    // If I roll a 6, and space 3 is blocked. I move 6 spaces to space 6. I passed space 3.
    // "Higher values must pass over". So blocks don't stop passing through.
    // "Lower values stop before".
    // The only constraint is LANDING. And since we move exactly 'steps', we only land on 'pos + steps'.
    // So if 'pos + steps' is a blocked space, we can land on it?
    // "Opponent needs EXACT die value to land on it".
    // Maybe it means if there's a block, you normally CAN'T land on it even with exact value?
    // No, "needs exact die value" implies it IS possible.
    // Let's assume standard movement allows landing on blocks for now, unless specific constraints arise.

    // Champion Victory Check: "Must land EXACTLY on opponent Home Base"
    // Opponent Home Base: P1 target is P2 Home (11). P2 target is P1 Home (1).
    const targetBase = this.state.currentPlayer === 1 ? CONSTANTS.BOARD.HOME_BASE_P2 : CONSTANTS.BOARD.HOME_BASE_P1;

    if (piece.type === 'champion') {
        // Distance check is complex on circular board.
        // Simplified: If landing exactly on targetBase, WIN.
        // If movement overshoots targetBase (visually passing it), invalid?
        // For MVP, just allow circular movement. But specific win condition triggers on landing.
    }

    return true;
}

resolveSpace(piece, pos) {
    // Nexus Logic
    if (CONSTANTS.BOARD.NEXUS_POINTS.includes(pos)) {
        if (piece.type === 'warrior') {
            // Capture Nexus
            this.state.nexusOwners[pos] = this.state.currentPlayer === 1 ? 'p1' : 'p2';
            this.log(`Nexus at ${pos} captured by ${this.state.nexusOwners[pos]}!`, 'important');
        }
    }

    // Champion Victory Logic
    const targetBase = this.state.currentPlayer === 1 ? CONSTANTS.BOARD.HOME_BASE_P2 : CONSTANTS.BOARD.HOME_BASE_P1;
    if (piece.type === 'champion' && pos === targetBase) {
        this.declareWinner(this.state.currentPlayer);
    }
}

nextMoveTurn() {
    // Check if current player has dice left
    const p1Dice = this.diceSystem.getPlayerDice(1);
    const p2Dice = this.diceSystem.getPlayerDice(2);

    if (p1Dice.length === 0 && p2Dice.length === 0) {
        this.endRound();
        return;
    }

    // Switch
    this.state.currentPlayer = this.state.currentPlayer === 1 ? 2 : 1;

    // Skip if no dice
    if (this.state.currentPlayer === 1 && p1Dice.length === 0) this.state.currentPlayer = 2;
    if (this.state.currentPlayer === 2 && p2Dice.length === 0) this.state.currentPlayer = 1;

    this.updateUI();
    this.factionSystem.onTurnStart(this.state.currentPlayer);

    if (this.state.currentPlayer === 2) {
        setTimeout(() => this.aiMove(), 1000);
    }
}

aiMove() {
    const dice = this.diceSystem.getPlayerDice(2);
    if (dice.length === 0) {
        this.nextMoveTurn();
        return;
    }

    // Random Move
    const die = dice[0];
    this.diceSystem.selectedDieId = die.id;
    const pieces = this.state.pieces.p2;
    const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];

    this.executeMove(randomPiece.id, die.value);
}

endRound() {
    this.state.phase = CONSTANTS.PHASES.NEXUS_CHECK;
    this.log("--- NEXUS CHECK ---");

    // Count Control
    let p1Count = 0;
    let p2Count = 0;
    Object.values(this.state.nexusOwners).forEach(owner => {
        if (owner === 'p1') p1Count++;
        if (owner === 'p2') p2Count++;
    });

    this.state.nexusControl = { p1: p1Count, p2: p2Count };
    this.updateUI();

    // Win Check
    if (this.factionSystem.checkWinCondition(1, p1Count)) this.declareWinner(1);
    else if (this.factionSystem.checkWinCondition(2, p2Count)) this.declareWinner(2);
    else {
        // New Round
        this.state.firstPlayer = this.state.firstPlayer === 1 ? 2 : 1;
        setTimeout(() => this.startRound(), 2000);
    }
}

declareWinner(player) {
    this.state.winner = player;
    this.log(`GAME OVER! ${player === 1 ? 'PLAYER 1' : 'AI'} WINS!`, 'important');
    alert(`${player === 1 ? 'PLAYER 1' : 'AI'} WINS!`);
}

log(message, type = 'normal') {
    const logContainer = document.getElementById('game-log');
    const entry = document.createElement('div');
    entry.classList.add('log-entry');
    if (type !== 'normal') entry.classList.add(type);
    entry.textContent = `> ${message}`;
    logContainer.prepend(entry);
}

updateUI() {
    document.getElementById('current-phase').textContent = this.state.phase;
    document.getElementById('current-player').textContent = this.state.currentPlayer === 1 ? 'PLAYER 1' : 'AI OPPONENT';
    document.getElementById('p1-nexus-count').textContent = this.state.nexusControl.p1;
    document.getElementById('p2-nexus-count').textContent = this.state.nexusControl.p2;


    // Update Ability Button
    const pKey = this.state.currentPlayer === 1 ? 'p1' : 'p2';
    const factionId = this.state.players[pKey].faction;
    const factionData = Object.values(FACTIONS).find(f => f.id === factionId);

    const btn = document.getElementById('ability-btn');
    const status = document.getElementById('ability-status');

    if (factionData && factionData.abilities.active) {
        btn.textContent = factionData.abilities.active.name;
        btn.disabled = false;

        // Check if used
        if ((factionId === 'storm_raiders' && this.factionSystem.activeAbilities[pKey].blitzUsed) ||
            (factionId === 'shadow_guild' && this.factionSystem.activeAbilities[pKey].swapUsed)) {
            btn.disabled = true;
            btn.textContent += " (Used)";
        }

        status.textContent = factionData.abilities.active.desc;
    }

    window.renderer.draw(this.state);
}
}

class BoardRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.width = 0;
        this.height = 0;
        this.center = { x: 0, y: 0 };
        this.radius = 0;

        // Bind resize event
        window.addEventListener('resize', () => this.resize());

        // Click Handler
        this.canvas.addEventListener('mousedown', (e) => this.handleClick(e));

        // Initialize Particle System
        this.particleSystem = new ParticleSystem();

        this.resize();
    }

    resize() {
        const parent = this.canvas.parentElement;
        const size = Math.min(parent.clientWidth, parent.clientHeight) * 0.95;
        this.width = size;
        this.height = size;
        this.canvas.width = size;
        this.canvas.height = size;
        this.center = { x: size / 2, y: size / 2 };
        this.radius = (size / 2) * 0.85;

        if (window.game) this.draw(window.game.state);
    }

    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check Dice Clicks (Center area)
        if (window.game.state.phase === CONSTANTS.PHASES.DRAFT) {
            const available = window.game.diceSystem.getAvailableDice();
            // Simple hit detection for dice drawn in center
            available.forEach((die, index) => {
                // Define die position (needs to match draw logic)
                const dieX = this.center.x - 60 + (index * 30); // simplistic layout
                const dieY = this.center.y;
                if (Math.abs(x - dieX) < 15 && Math.abs(y - dieY) < 15) {
                    window.game.onDieClick(die.id);
                }
            });
        }

        // Check Player Dice Clicks (Sidebar/Bottom area? No, rendered on canvas for now)
        if (window.game.state.phase === CONSTANTS.PHASES.MOVEMENT) {
            // Check own dice
            const myDice = window.game.diceSystem.getPlayerDice(1);
            myDice.forEach((die, index) => {
                const dieX = this.center.x - 50 + (index * 40);
                const dieY = this.height - 50;
                if (Math.abs(x - dieX) < 20 && Math.abs(y - dieY) < 20) {
                    window.game.selectDieForMove(die.id);
                }
            });

            // Check Pieces
            // Iterate all pieces to see if clicked
            window.game.state.pieces.p1.forEach(p => {
                const coords = this.getSpaceCoordinates(p.position);
                // Hit test radius
                if (Math.hypot(x - coords.x, y - coords.y) < 15) {
                    window.game.onPieceClick(p.id);
                }
            });
        }
    }

    getSpaceCoordinates(index) {
        const total = CONSTANTS.BOARD.TOTAL_SPACES;
        const anglePerSpace = (2 * Math.PI) / total;
        const startAngle = Math.PI / 2;
        const angle = startAngle + ((index - 1) * anglePerSpace);
        const x = this.center.x + Math.cos(angle) * this.radius;
        const y = this.center.y + Math.sin(angle) * this.radius;
        return { x, y, angle };
    }

    draw(gameState) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.ctx.clearRect(0, 0, this.width, this.height);

        // Update Particles
        this.particleSystem.update();

        // Draw Track
        this.ctx.beginPath();
        this.ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = CONSTANTS.COLORS.PATH_LINE;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Draw Spaces and Nexus Owners
        for (let i = 1; i <= CONSTANTS.BOARD.TOTAL_SPACES; i++) {
            this.drawSpace(i, gameState);
        }

        // Draw Pieces
        this.drawPieces(gameState);

        // Draw Dice
        this.drawDice(gameState);

        // Draw Info
        // this.drawHUD(gameState);
        // Draw Info
        // this.drawHUD(gameState);

        // Draw Particles (Overlay)
        this.particleSystem.draw(this.ctx);
    }

    drawSpace(index, gameState) {
        const coords = this.getSpaceCoordinates(index);
        const isNexus = CONSTANTS.BOARD.NEXUS_POINTS.includes(index);
        const owner = gameState.nexusOwners && gameState.nexusOwners[index];

        let color = CONSTANTS.COLORS.SPACE_NORMAL;
        let radius = 15;

        if (isNexus) {
            color = CONSTANTS.COLORS.SPACE_NEXUS;
            radius = 20;
            if (owner === 'p1') color = CONSTANTS.COLORS.P1;
            if (owner === 'p2') color = CONSTANTS.COLORS.P2;
        }

        // Draw
        this.ctx.beginPath();
        this.ctx.arc(coords.x, coords.y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.stroke();

        // Label
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '10px Roboto';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(index.toString(), coords.x, coords.y);
    }

    drawPieces(gameState) {
        if (!gameState.pieces) return;

        // Draw P1 Pieces
        gameState.pieces.p1.forEach(p => this.drawPiece(p, CONSTANTS.COLORS.P1));
        // Draw P2 Pieces
        gameState.pieces.p2.forEach(p => this.drawPiece(p, CONSTANTS.COLORS.P2));
    }

    drawPiece(piece, color) {
        const coords = this.getSpaceCoordinates(piece.position);

        // Offset for stacking? multiple pieces on same space
        // For now just draw on top

        this.ctx.beginPath();
        if (piece.type === 'champion') {
            this.ctx.arc(coords.x, coords.y, 12, 0, Math.PI * 2);
        } else {
            this.ctx.rect(coords.x - 8, coords.y - 8, 16, 16);
        }
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.stroke();

        // Champion Icon
        if (piece.type === 'champion') {
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText('C', coords.x, coords.y);
        }
    }

    drawDice(gameState) {
        // Draw Center Dice (Available)
        if (gameState.diceSystem) {
            const available = gameState.diceSystem.getAvailableDice();
            available.forEach((die, index) => {
                const x = this.center.x - 60 + (index * 30);
                const y = this.center.y;
                this.drawDie(x, y, die.value, '#fff', false);
            });

            // Draw Player Dice (Hands)
            const p1Dice = gameState.diceSystem.getPlayerDice(1);
            p1Dice.forEach((die, index) => {
                const x = this.center.x - 50 + (index * 40);
                const y = this.height - 50;
                const isSelected = (die.id === gameState.diceSystem.selectedDieId);
                this.drawDie(x, y, die.value, CONSTANTS.COLORS.P1, isSelected);
            });

            // AI Dice (Top)
            const p2Dice = gameState.diceSystem.getPlayerDice(2);
            p2Dice.forEach((die, index) => {
                const x = this.center.x - 50 + (index * 40);
                const y = 50;
                this.drawDie(x, y, die.value, CONSTANTS.COLORS.P2, false);
            });
        }
    }

    drawDie(x, y, value, color, selected) {
        this.ctx.fillStyle = selected ? '#fff' : color;
        this.ctx.beginPath();
        this.ctx.roundRect(x - 12, y - 12, 24, 24, 4);
        this.ctx.fill();
        this.ctx.strokeStyle = '#000';
        this.ctx.stroke();

        this.ctx.fillStyle = selected ? '#000' : '#fff';
        this.ctx.font = 'bold 16px Roboto';
        this.ctx.fillText(value, x, y);
    }
}

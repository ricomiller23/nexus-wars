document.addEventListener('DOMContentLoaded', () => {
    // Initialize Board Renderer
    window.renderer = new BoardRenderer('game-canvas');

    // Initialize Game Engine
    window.game = new GameEngine();

    // Loop for animation
    function animate() {
        window.renderer.draw(window.game.state);
        requestAnimationFrame(animate);
    }
    animate();
});

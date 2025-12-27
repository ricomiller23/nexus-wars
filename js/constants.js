const CONSTANTS = {
    BOARD: {
        TOTAL_SPACES: 20,
        RADIUS_PERCENT: 0.8, // % of canvas min dimension
        SPACE_RADIUS: 25,
        NEXUS_POINTS: [3, 6, 9, 12, 15, 18, 20], // 1-based indices as per prompt
        HOME_BASE_P1: 1,  // Player 1 Home Base
        HOME_BASE_P2: 11, // Player 2 AI Home Base
    },
    COLORS: {
        BG: '#0b0c15',
        SPACE_NORMAL: '#2a2c3d',
        SPACE_NEXUS: '#ffd700',
        SPACE_HOME_P1: '#003366', // Darker blue base
        SPACE_HOME_P2: '#660000', // Darker red base
        P1: '#00f0ff', // Storm Raiders Blue
        P2: '#ff2a2a', // Iron Phalanx Red
        HIGHLIGHT: '#ffffff',
        TEXT: '#ffffff',
        NEXUS_GLOW: 'rgba(255, 215, 0, 0.4)',
        PATH_LINE: 'rgba(255, 255, 255, 0.1)'
    },
    PHASES: {
        SETUP: 'SETUP',
        DRAFT: 'DICE DRAFT',
        MOVEMENT: 'MOVEMENT',
        NEXUS_CHECK: 'NEXUS CHECK'
    }
};

/**
 * StarBlaster Game - Main JavaScript File
 * 
 * This file contains the core game logic for the StarBlaster game including:
 * - Game initialization
 * - Game loop
 * - Player controls
 * - Enemy spawning and movement
 * - Collision detection
 * - Scoring system
 * - Game state management
 * - Power-up system
 * - High score system with local storage
 * - Sound effects
 */

// Game constants
const GAME_WIDTH = 600;  // Canvas width as specified in HTML
const GAME_HEIGHT = 800; // Canvas height as specified in HTML
const PLAYER_SPEED = 5;
const BULLET_SPEED = 7;
const ENEMY_SPEED = 2;
const POWERUP_SPEED = 3;
const POWERUP_SPAWN_INTERVAL = 30000; // 30 seconds
const POWERUP_DURATION = 5000; // 5 seconds

// Game states enum
const GameState = {
    START: 'start',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver'
};

// Game state
let gameState = {
    currentState: GameState.START,  // Current game state (start, playing, gameOver)
    isRunning: false,
    isPaused: false,
    score: 0,
    lives: 3,
    player: {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        isMovingLeft: false,
        isMovingRight: false,
        isShooting: false,
        hasPowerUp: false,
        powerUpEndTime: 0
    },
    bullets: [],
    enemies: [],
    explosions: [],  // Array to store explosion animations
    powerUps: [],    // Array to store power-ups
    lastEnemySpawnTime: 0,
    lastPowerUpSpawnTime: 0,
    enemySpawnInterval: 2000, // milliseconds
    gameTime: 0,
    soundEnabled: true
};

// High scores array
let highScores = [];

// Audio objects
const sounds = {
    laser: null,
    explosion: null,
    powerup: null,
    gameover: null
};

// DOM Elements
let canvas;
let ctx;
let scoreElement;
let livesElement;
let playButton;
let pauseButton;
let startScreen;
let gameScreen;
let gameOverScreen;
let soundToggleButton;
let highScoresList;

/**
 * Initialize the game
 * Sets up the canvas, context, and event listeners
 */
function initGame() {
    console.log('Initializing StarBlaster game...');
    
    // Get DOM elements
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    scoreElement = document.getElementById('score');
    livesElement = document.getElementById('lives');
    playButton = document.getElementById('play-button');
    pauseButton = document.getElementById('pauseButton');
    startScreen = document.getElementById('start-screen');
    gameScreen = document.getElementById('game-screen');
    gameOverScreen = document.getElementById('game-over-screen');
    soundToggleButton = document.getElementById('sound-toggle');
    highScoresList = document.getElementById('high-scores-list');
    
    // Set canvas dimensions
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    
    // Initialize player position
    resetPlayerPosition();
    
    // Add event listeners
    setupEventListeners();
    
    // Create initial enemies
    createInitialEnemies();
    
    // Load high scores from local storage
    loadHighScores();
    
    // Display high scores on start screen
    displayHighScores();
    
    // Load audio files
    loadSounds();
    
    // Initial render
    render();
    
    // Show start screen
    showScreen(GameState.START);
    
    console.log('Game initialized successfully');
}

/**
 * Load sound effects
 */
function loadSounds() {
    try {
        sounds.laser = new Audio('assets/sounds/laser.wav');
        sounds.explosion = new Audio('assets/sounds/explosion.wav');
        sounds.powerup = new Audio('assets/sounds/powerup.wav');
        sounds.gameover = new Audio('assets/sounds/gameover.wav');
        
        // Set volume for all sounds
        Object.values(sounds).forEach(sound => {
            sound.volume = 0.5;
        });
        
        console.log('Sound files loaded successfully');
    } catch (error) {
        console.error('Error loading sound files:', error);
        // Disable sound if loading fails
        gameState.soundEnabled = false;
        if (soundToggleButton) {
            soundToggleButton.textContent = 'Sound: OFF';
            soundToggleButton.disabled = true;
        }
    }
});
}

/**
 * Play a sound effect if sound is enabled
 * @param {string} soundName - Name of the sound to play
 */
function playSound(soundName) {
    if (gameState.soundEnabled && sounds[soundName]) {
        // Clone the audio to allow overlapping sounds
        const soundClone = sounds[soundName].cloneNode();
        soundClone.play();
    }
}

/**
 * Toggle sound on/off
 */
function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    soundToggleButton.textContent = gameState.soundEnabled ? 'Sound: ON' : 'Sound: OFF';
}

/**
 * Load high scores from local storage
 */
function loadHighScores() {
    try {
        const storedScores = localStorage.getItem('starBlasterHighScores');
        highScores = storedScores ? JSON.parse(storedScores) : [];
        console.log('High scores loaded successfully');
    } catch (error) {
        console.error('Error loading high scores:', error);
        highScores = [];
    }
}

/**
 * Save high scores to local storage
 */
function saveHighScores() {
    try {
        localStorage.setItem('starBlasterHighScores', JSON.stringify(highScores));
        console.log('High scores saved successfully');
    } catch (error) {
        console.error('Error saving high scores:', error);
        // Show a notification to the user if needed
    }
}

/**
 * Add a new high score
 * @param {string} playerName - Name of the player
 * @param {number} score - Score achieved
 */
function addHighScore(playerName, score) {
    // Add the new score
    highScores.push({ name: playerName, score: score });
    
    // Sort scores in descending order
    highScores.sort((a, b) => b.score - a.score);
    
    // Keep only the top 5 scores
    if (highScores.length > 5) {
        highScores = highScores.slice(0, 5);
    }
    
    // Save to local storage
    saveHighScores();
    
    // Update the display
    displayHighScores();
}

/**
 * Display high scores on the start screen
 */
function displayHighScores() {
    if (!highScoresList) return;
    
    // Clear the current list
    highScoresList.innerHTML = '';
    
    // Add header
    const header = document.createElement('h3');
    header.textContent = 'High Scores';
    highScoresList.appendChild(header);
    
    // Add scores
    if (highScores.length === 0) {
        const noScores = document.createElement('p');
        noScores.textContent = 'No high scores yet!';
        highScoresList.appendChild(noScores);
    } else {
        const scoreList = document.createElement('ol');
        highScores.forEach(score => {
            const scoreItem = document.createElement('li');
            scoreItem.textContent = `${score.name}: ${score.score}`;
            scoreList.appendChild(scoreItem);
        });
        highScoresList.appendChild(scoreList);
    }
}

/**
 * Check if the current score qualifies as a high score
 * @returns {boolean} - True if the score is a high score
 */
function isHighScore(score) {
    return highScores.length < 5 || score > highScores[highScores.length - 1].score;
}

/**
 * Submit high score form
 */
function submitHighScore() {
    const playerNameInput = document.getElementById('player-name');
    const playerName = playerNameInput.value.trim() || 'Anonymous';
    
    addHighScore(playerName, gameState.score);
    
    // Hide the high score form
    document.getElementById('high-score-form').style.display = 'none';
    document.getElementById('high-score-submitted').style.display = 'block';
}

/**
 * Reset player to starting position
 * Places the player ship at the bottom center of the canvas
 */
function resetPlayerPosition() {
    gameState.player.x = GAME_WIDTH / 2 - gameState.player.width / 2;
    gameState.player.y = GAME_HEIGHT - gameState.player.height - 20;
    gameState.player.hasPowerUp = false;
    gameState.player.powerUpEndTime = 0;
}

/**
 * Create initial set of enemies
 * Creates 10-15 enemies with random positions at the top of the screen
 */
function createInitialEnemies() {
    gameState.enemies = [];
    const enemyCount = 10 + Math.floor(Math.random() * 6); // 10-15 enemies
    
    for (let i = 0; i < enemyCount; i++) {
        const enemyWidth = 40;
        const enemyHeight = 40;
        const x = Math.random() * (GAME_WIDTH - enemyWidth);
        const y = -Math.random() * 300; // Stagger enemies above the screen
        
        gameState.enemies.push({
            x: x,
            y: y,
            width: enemyWidth,
            height: enemyHeight,
            speed: 1 + Math.random() * 2 // Varying speeds between 1-3
        });
    }
}

/**
 * Create a power-up at a random position at the top of the screen
 */
function spawnPowerUp() {
    const powerUpWidth = 30;
    const powerUpHeight = 30;
    const x = Math.random() * (GAME_WIDTH - powerUpWidth);
    
    gameState.powerUps.push({
        x: x,
        y: -powerUpHeight,
        width: powerUpWidth,
        height: powerUpHeight,
        type: 'doubleShot'
    });
    
    gameState.lastPowerUpSpawnTime = gameState.gameTime;
}

/**
 * Set up event listeners for game controls
 * Handles keyboard input and button clicks
 */
function setupEventListeners() {
    // Button controls
    playButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', togglePause);
    document.getElementById('restart-button').addEventListener('click', startGame);
    document.getElementById('main-menu-button').addEventListener('click', function() {
        showScreen(GameState.START);
    });
    
    // Sound toggle button
    if (soundToggleButton) {
        soundToggleButton.addEventListener('click', toggleSound);
    }
    
    // High score submission
    const submitButton = document.getElementById('submit-score');
    if (submitButton) {
        submitButton.addEventListener('click', submitHighScore);
    }
    
    // Keyboard controls
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}

/**
 * Handle keydown events
 * Processes keyboard input for player movement and shooting
 */
function handleKeyDown(e) {
    if (gameState.currentState !== GameState.PLAYING || gameState.isPaused) return;
    
    switch (e.key) {
        case 'ArrowLeft':
            gameState.player.isMovingLeft = true;
            break;
        case 'ArrowRight':
            gameState.player.isMovingRight = true;
            break;
        case ' ': // Spacebar
            if (!gameState.player.isShooting) {
                gameState.player.isShooting = true;
                fireBullet();
            }
            break;
    }
}

/**
 * Handle keyup events
 * Processes keyboard input release
 */
function handleKeyUp(e) {
    switch (e.key) {
        case 'ArrowLeft':
            gameState.player.isMovingLeft = false;
            break;
        case 'ArrowRight':
            gameState.player.isMovingRight = false;
            break;
        case ' ': // Spacebar
            gameState.player.isShooting = false;
            break;
    }
}

/**
 * Show a specific game screen
 * Manages visibility of start, game, and game over screens
 */
function showScreen(screenName) {
    // Update the current game state
    gameState.currentState = screenName;
    
    // Hide all screens first
    startScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    // Show the requested screen
    switch (screenName) {
        case GameState.START:
            startScreen.classList.remove('hidden');
            displayHighScores();
            break;
        case GameState.PLAYING:
            gameScreen.classList.remove('hidden');
            break;
        case GameState.GAME_OVER:
            gameOverScreen.classList.remove('hidden');
            document.getElementById('final-score').textContent = gameState.score;
            
            // Play game over sound
            playSound('gameover');
            
            // Check if this is a high score
            if (isHighScore(gameState.score)) {
                document.getElementById('high-score-form').style.display = 'block';
                document.getElementById('high-score-submitted').style.display = 'none';
            } else {
                document.getElementById('high-score-form').style.display = 'none';
                document.getElementById('high-score-submitted').style.display = 'none';
            }
            break;
    }
    // Remove event listeners when game is over to prevent memory leaks
    if (screenName === GameState.GAME_OVER) {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        console.log("Event listeners removed to prevent memory leaks");
    }
}

/**
 * Start the game
 * Initializes game state and starts the game loop
 */
function startGame() {
    console.log('Starting game...');
    gameState.isRunning = true;
    gameState.isPaused = false;
    gameState.score = 0;
    gameState.lives = 3;
    gameState.bullets = [];
    gameState.explosions = [];
    gameState.powerUps = [];
    gameState.gameTime = 0;
    gameState.lastTimestamp = null;
    gameState.lastPowerUpSpawnTime = 0;
    
    resetPlayerPosition();
    createInitialEnemies();
    
    updateScoreDisplay();
    updateLivesDisplay();
    
    showScreen(GameState.PLAYING);
    
    // Start the game loop
    requestAnimationFrame(gameLoop);
}

/**
 * Toggle pause state
 * Pauses or resumes the game
 */
function togglePause() {
    if (!gameState.isRunning) return;
    
    gameState.isPaused = !gameState.isPaused;
    pauseButton.textContent = gameState.isPaused ? 'Resume' : 'Pause';
    
    if (!gameState.isPaused) {
        requestAnimationFrame(gameLoop);
    }
}

/**
 * Main game loop
 * Handles timing, updates, and rendering
 */
function gameLoop(timestamp) {
    if (!gameState.isRunning || gameState.isPaused) return;
    
    try {
        // Track game time for animations and spawning
        if (!gameState.lastTimestamp) {
            gameState.lastTimestamp = timestamp;
        }
        const deltaTime = timestamp - gameState.lastTimestamp;
        gameState.lastTimestamp = timestamp;
        gameState.gameTime += deltaTime;
        
        update(deltaTime);
        render();
        
        // Only continue the game loop if we're still playing
        if (gameState.currentState === GameState.PLAYING) {
            requestAnimationFrame(gameLoop);
        }
    } catch (error) {
        console.error('Error in game loop:', error);
        // Handle the error gracefully - show a message to the user
        alert('An error occurred in the game. Please refresh the page to restart.');
        gameState.isRunning = false;
    }
}
    const deltaTime = timestamp - gameState.lastTimestamp;
    gameState.lastTimestamp = timestamp;
    gameState.gameTime += deltaTime;
    
    update(deltaTime);
    render();
    
    // Only continue the game loop if we're still playing
    if (gameState.currentState === GameState.PLAYING) {
        requestAnimationFrame(gameLoop);
    }
}

/**
 * Update game state
 * Updates all game objects based on time passed
 */
function update(deltaTime) {
    updatePlayer(deltaTime);
    updateBullets();
    updateEnemies(deltaTime);
    updatePowerUps(deltaTime);
    updateExplosions(deltaTime);
    checkCollisions();
}

/**
 * Update player position and power-up status based on input
 * Handles player ship movement within canvas boundaries
 */
function updatePlayer(deltaTime) {
    if (gameState.player.isMovingLeft) {
        gameState.player.x = Math.max(0, gameState.player.x - PLAYER_SPEED);
    }
    
    if (gameState.player.isMovingRight) {
        gameState.player.x = Math.min(GAME_WIDTH - gameState.player.width, gameState.player.x + PLAYER_SPEED);
    }
    
    // Check if power-up has expired
    if (gameState.player.hasPowerUp && gameState.gameTime > gameState.player.powerUpEndTime) {
        gameState.player.hasPowerUp = false;
    }
}

/**
 * Create a new bullet
 * Fires a laser from the player's ship
 */
function fireBullet() {
    // Play laser sound
    playSound('laser');
    
    if (gameState.player.hasPowerUp) {
        // Double shot when power-up is active
        gameState.bullets.push({
            x: gameState.player.x + gameState.player.width / 2 - 10,
            y: gameState.player.y,
            width: 4,
            height: 15
        });
        
        gameState.bullets.push({
            x: gameState.player.x + gameState.player.width / 2 + 6,
            y: gameState.player.y,
            width: 4,
            height: 15
        });
    } else {
        // Normal single shot
        gameState.bullets.push({
            x: gameState.player.x + gameState.player.width / 2 - 2,
            y: gameState.player.y,
            width: 4,
            height: 15
        });
    }
}

/**
 * Update bullet positions
 * Moves bullets and removes those that go off-screen
 */
function updateBullets() {
    // Move bullets
    for (let i = 0; i < gameState.bullets.length; i++) {
        gameState.bullets[i].y -= BULLET_SPEED;
    }
    
    // Remove bullets that are off-screen
    gameState.bullets = gameState.bullets.filter(bullet => bullet.y > -bullet.height);
}

/**
 * Update enemy positions and spawn new enemies
 * Moves enemies downward at varying speeds
 */
function updateEnemies(deltaTime) {
    // Move enemies
    for (let i = 0; i < gameState.enemies.length; i++) {
        const enemy = gameState.enemies[i];
        enemy.y += enemy.speed;
        
        // Reset enemy to top when it reaches the bottom
        if (enemy.y > GAME_HEIGHT) {
            enemy.y = -enemy.height;
            enemy.x = Math.random() * (GAME_WIDTH - enemy.width);
        }
    }
}

/**
 * Update power-up positions and spawn new power-ups
 * Moves power-ups downward and spawns new ones at intervals
 */
function updatePowerUps(deltaTime) {
    // Check if it's time to spawn a new power-up
    if (gameState.gameTime - gameState.lastPowerUpSpawnTime > POWERUP_SPAWN_INTERVAL) {
        spawnPowerUp();
    }
    
    // Move power-ups
    for (let i = 0; i < gameState.powerUps.length; i++) {
        gameState.powerUps[i].y += POWERUP_SPEED;
    }
    
    // Remove power-ups that are off-screen
    gameState.powerUps = gameState.powerUps.filter(powerUp => powerUp.y < GAME_HEIGHT);
}

/**
 * Update explosion animations
 * Manages the lifecycle of explosion effects
 * @param {number} deltaTime - Time passed since last frame in milliseconds
 */
function updateExplosions(deltaTime) {
    for (let i = gameState.explosions.length - 1; i >= 0; i--) {
        const explosion = gameState.explosions[i];
        explosion.lifetime -= deltaTime;
        
        if (explosion.lifetime <= 0) {
            gameState.explosions.splice(i, 1);
        }
    }
}

/**
 * Create an explosion effect at the specified position
 * @param {number} x - X coordinate of explosion center
 * @param {number} y - Y coordinate of explosion center
 * @param {string} color - Color of the explosion
 */
function createExplosion(x, y, color = '#FFAA00') {
    gameState.explosions.push({
        x: x,
        y: y,
        radius: 30,
        color: color,
        lifetime: 500, // milliseconds
        initialLifetime: 500
    });
}

/**
 * Check for collisions between game objects
 * Handles bullet-enemy, player-enemy, and player-powerup collisions
 */
function checkCollisions() {
    // Check bullet-enemy collisions
    for (let i = gameState.bullets.length - 1; i >= 0; i--) {
        const bullet = gameState.bullets[i];
        
        for (let j = gameState.enemies.length - 1; j >= 0; j--) {
            const enemy = gameState.enemies[j];
            
            if (isColliding(bullet, enemy)) {
                // Create explosion effect at the enemy's position
                createExplosion(
                    enemy.x + enemy.width / 2,
                    enemy.y + enemy.height / 2,
                    '#FFAA00'
                );
                
                // Play explosion sound
                playSound('explosion');
                
                // Remove bullet
                gameState.bullets.splice(i, 1);
                
                // Reset enemy to top
                enemy.y = -enemy.height;
                enemy.x = Math.random() * (GAME_WIDTH - enemy.width);
                
                // Increase score by 1 point for each enemy hit
                gameState.score += 1;
                updateScoreDisplay();
                
                break;
            }
        }
    }
    
    // Check player-enemy collisions
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        if (isColliding(gameState.player, gameState.enemies[i])) {
            // Create explosion effect at the collision point
            createExplosion(
                gameState.player.x + gameState.player.width / 2,
                gameState.player.y + gameState.player.height / 2,
                '#FF0000'
            );
            
            // Play explosion sound
            playSound('explosion');
            
            // End the game when player collides with an enemy
            endGame();
            return; // Exit the function early since the game is over
        }
    }
    
    // Check player-powerup collisions
    for (let i = gameState.powerUps.length - 1; i >= 0; i--) {
        const powerUp = gameState.powerUps[i];
        
        if (isColliding(gameState.player, powerUp)) {
            // Apply power-up effect
            gameState.player.hasPowerUp = true;
            gameState.player.powerUpEndTime = gameState.gameTime + POWERUP_DURATION;
            
            // Play power-up sound
            playSound('powerup');
            
            // Remove the power-up
            gameState.powerUps.splice(i, 1);
        }
    }
}

/**
 * Check if two objects are colliding
 * Uses Axis-Aligned Bounding Box (AABB) collision detection
 * 
 * @param {Object} obj1 - First object with x, y, width, height properties
 * @param {Object} obj2 - Second object with x, y, width, height properties
 * @returns {boolean} - True if objects are colliding, false otherwise
 */
function isColliding(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

/**
 * Update score display
 * Updates the score element in the DOM and on the canvas
 */
function updateScoreDisplay() {
    scoreElement.textContent = gameState.score;
}

/**
 * Update lives display
 * Updates the lives element in the DOM
 */
function updateLivesDisplay() {
    livesElement.textContent = gameState.lives;
}

/**
 * End the game
 * Shows game over screen and final score
 */
function endGame() {
    console.log('Game over!');
    gameState.isRunning = false;
    showScreen(GameState.GAME_OVER);
}

/**
 * Render the game
 * Draws all game objects to the canvas
 */
function render() {
    // Clear canvas
    ctx.fillStyle = '#000033'; // Dark blue background
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    // Draw stars (background)
    drawStarfield();
    
    // Draw player ship
    drawPlayerShip();
    
    // Draw bullets
    drawBullets();
    
    // Draw enemies
    drawEnemies();
    
    // Draw power-ups
    drawPowerUps();
    
    // Draw explosions
    drawExplosions();
    
    // Draw score
    drawScore();
    
    // Draw power-up indicator if active
    if (gameState.player.hasPowerUp) {
        drawPowerUpIndicator();
    }
}

/**
 * Draw a simple starfield background
 */
function drawStarfield() {
    ctx.fillStyle = '#FFFFFF';
    
    // Use game time to create twinkling effect
    const starCount = 100;
    for (let i = 0; i < starCount; i++) {
        const x = (i * 17) % GAME_WIDTH;
        const y = (i * 19 + gameState.gameTime * 0.01) % GAME_HEIGHT;
        const size = (Math.sin(i + gameState.gameTime * 0.001) + 1) * 1.5;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * Draw the player ship
 */
function drawPlayerShip() {
    // Draw power-up glow if active
    if (gameState.player.hasPowerUp) {
        const glowRadius = 30;
        const gradient = ctx.createRadialGradient(
            gameState.player.x + gameState.player.width / 2,
            gameState.player.y + gameState.player.height / 2,
            0,
            gameState.player.x + gameState.player.width / 2,
            gameState.player.y + gameState.player.height / 2,
            glowRadius
        );
        
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.7)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(
            gameState.player.x + gameState.player.width / 2,
            gameState.player.y + gameState.player.height / 2,
            glowRadius,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
    
    // Draw ship body
    ctx.fillStyle = gameState.player.hasPowerUp ? '#00FFFF' : '#00CCFF'; // Brighter cyan when powered up
    
    ctx.beginPath();
    ctx.moveTo(gameState.player.x + gameState.player.width / 2, gameState.player.y);
    ctx.lineTo(gameState.player.x + gameState.player.width, gameState.player.y + gameState.player.height);
    ctx.lineTo(gameState.player.x, gameState.player.y + gameState.player.height);
    ctx.closePath();
    ctx.fill();
    
    // Draw ship cockpit
    ctx.fillStyle = gameState.player.hasPowerUp ? '#00FFFF' : '#0088FF';
    ctx.beginPath();
    ctx.arc(
        gameState.player.x + gameState.player.width / 2,
        gameState.player.y + gameState.player.height / 2,
        10,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

/**
 * Draw all bullets
 */
function drawBullets() {
    ctx.fillStyle = gameState.player.hasPowerUp ? '#FFFFFF' : '#FFFF00'; // White lasers when powered up
    
    gameState.bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

/**
 * Draw all enemy ships
 */
function drawEnemies() {
    gameState.enemies.forEach(enemy => {
        // Enemy body
        ctx.fillStyle = '#FF0000'; // Red color for enemies
        ctx.beginPath();
        ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
        ctx.lineTo(enemy.x + enemy.width, enemy.y);
        ctx.lineTo(enemy.x, enemy.y);
        ctx.closePath();
        ctx.fill();
        
        // Enemy cockpit
        ctx.fillStyle = '#880000';
        ctx.beginPath();
        ctx.arc(
            enemy.x + enemy.width / 2,
            enemy.y + enemy.height / 2,
            8,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
}

/**
 * Draw all power-ups
 */
function drawPowerUps() {
    gameState.powerUps.forEach(powerUp => {
        // Draw star shape for power-up
        const centerX = powerUp.x + powerUp.width / 2;
        const centerY = powerUp.y + powerUp.height / 2;
        const spikes = 5;
        const outerRadius = powerUp.width / 2;
        const innerRadius = powerUp.width / 4;
        
        // Add glow effect
        const gradient = ctx.createRadialGradient(
            centerX, centerY, innerRadius,
            centerX, centerY, outerRadius * 1.5
        );
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw the star
        ctx.fillStyle = '#FFFF00'; // Yellow star
        ctx.beginPath();
        ctx.moveTo(centerX + outerRadius, centerY);
        
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI * i) / spikes;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            ctx.lineTo(x, y);
        }
        
        ctx.closePath();
        ctx.fill();
        
        // Add pulsing animation based on game time
        const pulseScale = 1 + 0.2 * Math.sin(gameState.gameTime * 0.01);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2 * pulseScale;
        ctx.stroke();
    });
}

/**
 * Draw all explosion effects
 */
function drawExplosions() {
    gameState.explosions.forEach(explosion => {
        // Calculate the current size based on remaining lifetime
        const progress = 1 - (explosion.lifetime / explosion.initialLifetime);
        const currentRadius = explosion.radius * (1 - progress * 0.5);
        
        // Create a radial gradient for the explosion
        const gradient = ctx.createRadialGradient(
            explosion.x, explosion.y, 0,
            explosion.x, explosion.y, currentRadius
        );
        
        // Fade out the explosion as it ages
        const alpha = 1 - progress;
        
        gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        gradient.addColorStop(0.4, `rgba(255, 200, 0, ${alpha})`);
        gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, currentRadius, 0, Math.PI * 2);
        ctx.fill();
    });
}

/**
 * Draw the power-up indicator
 * Shows a visual indicator when power-up is active
 */
function drawPowerUpIndicator() {
    const remainingTime = gameState.player.powerUpEndTime - gameState.gameTime;
    const maxWidth = 100;
    const height = 10;
    const x = GAME_WIDTH - maxWidth - 10;
    const y = 10;
    
    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(x, y, maxWidth, height);
    
    // Draw remaining time bar
    const width = Math.max(0, (remainingTime / POWERUP_DURATION) * maxWidth);
    ctx.fillStyle = '#00FFFF';
    ctx.fillRect(x, y, width, height);
    
    // Draw text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('POWER-UP', x - 5, y + height - 1);
}

/**
 * Draw the score on the canvas
 */
function drawScore() {
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${gameState.score}`, 10, 30);
    
    // Only show lives during gameplay
    if (gameState.currentState === GameState.PLAYING) {
        ctx.fillText(`Lives: ${gameState.lives}`, 10, 60);
    }
}

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initGame);
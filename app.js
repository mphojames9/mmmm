// 5 Unique Levels mapped out completely by content categorical context
const LEVELS = [
    { 
        size: 9,  
        category: "Animals",
        words: ['LION', 'BEAR', 'WOLF', 'DEER', 'HAWK'],
        extraWords: ['CAT', 'DOG', 'PIG', 'BAT', 'FOX', 'COW', 'OWL', 'APE', 'RAT', 'BUG', 'BEE', 'ANT', 'ELK', 'EMU', 'YAK']
    },
    { 
        size: 10, 
        category: "Classic Names",
        words: ['JAMES', 'OLIVER', 'EMMA', 'LUCAS', 'SOPHIA'],
        extraWords: ['BOB', 'SAM', 'TOM', 'ANN', 'MAX', 'LEO', 'IAN', 'JOE', 'MIA', 'EVA', 'DAN', 'AMY', 'RON', 'ROY', 'BEN']
    },
    { 
        size: 10, 
        category: "Deep Space",
        words: ['ORBIT', 'MARS', 'COMET', 'STARS', 'NEBULA'],
        extraWords: ['SUN', 'SKY', 'MOON', 'UFO', 'VOID', 'RAY', 'ION', 'GAS', 'ORB', 'ROCK', 'DUST', 'HALO', 'DARK', 'NOVA', 'SUNS']
    },
    { 
        size: 11, 
        category: "Ocean Abyss",
        words: ['SHARK', 'WHALE', 'CORAL', 'DOLPHIN', 'OCTOPUS'],
        extraWords: ['SEA', 'EEL', 'RAY', 'COD', 'CLAM', 'CRAB', 'TIDE', 'WAVE', 'SAND', 'SALT', 'FISH', 'GULL', 'KELP', 'SHIP', 'BOAT']
    },
    { 
        size: 12, 
        category: "Modern Tech",
        words: ['PYTHON', 'REACT', 'MATRIX', 'FASTAPI', 'WIDGET'],
        extraWords: ['APP', 'WEB', 'NET', 'BOT', 'MAC', 'RAM', 'ROM', 'CPU', 'API', 'LAN', 'URL', 'SSD', 'AI', 'SQL', 'DEV']
    }
];

const COLORS = [
    'var(--color-1)', 'var(--color-2)', 'var(--color-3)', 
    'var(--color-4)', 'var(--color-5)', 'var(--color-6)'
];

// Engine Core Settings
let currentLevelIdx = 0;
let grid = [];
let gridSize = 9;
let activeWords = [];
let score = 0;
let coins = 0;
let lastHoveredCell = null; 

// Level Rewind Anti-Farming Safeguards
let levelStartScore = 0;
let levelStartCoins = 0;

// Track state matrix parameters
let isDragging = false;
let startCell = null;
let currentHighlight = null;
let foundWords = new Set();
let wordPlacements = {}; 

// Tracking Variables for Bonus Words
let extraWordsPlaced = [];
let extraWordsFound = new Set();
let savedHighlightsData = []; 

// Dynamic Level Metrics Tracker Configuration
let activeLevelTimeElapsed = 0;
let usedPowerupOnActiveLevel = false;
let levelTimerEngineInterval = null;

// ==========================================
// PREMIUM DAILY TIME ATTACK ENGINE
// ==========================================
const PREMIUM_DAILY_WORDS = [
    'ECLIPSE', 'QUANTUM', 'PARADOX', 'ENIGMA', 'CYBORG', 
    'NEON', 'GALAXY', 'CHRONOS', 'VORTEX', 'COSMIC',
    'ZENITH', 'PULSAR', 'MYSTIC', 'HORIZON', 'ASTRAL'
];

let isDailyMissionActive = false;
let dailyMissionTimeLeft = 0;
let dailyMissionTimerId = null;
let dailyMissionReward = 0;

// Comprehensive Fallback Structure for Missing Engine Statistics
let gameStats = JSON.parse(localStorage.getItem('premiumWordSearchStats')) || {
    totalWordsFound: 0,
    totalHintsUsed: 0,
    totalWandsUsed: 0,
    totalGamesPlayed: 1,
    totalFindTimeSec: 0,
    levelStars: { 0: 3 }
};

// Tracks time elapsed between word discoveries
let lastWordTimestamp = Date.now();

// ==========================================
// PREMIUM DAILY MISSION DATABANK CONFIGURATION
// ==========================================
// ==========================================
// PREMIUM DAILY MISSION DATABANK CONFIGURATION
// ==========================================

// 1. Keep the base templates untouched
const DEFAULT_DAILY_MISSIONS = [
    { id: 'extraWords', text: 'Find 20 Extra Words', target: 20, progress: 0, reward: 200, claimed: false },
    { id: 'speedRun', text: 'Finish a Level Under 2 Mins', target: 1, progress: 0, reward: 150, claimed: false },
    { id: 'complete10', text: 'Complete 10 Levels', target: 10, progress: 0, reward: 150, claimed: false },
    { id: 'noPowerups', text: 'Finish Level Without Power-ups', target: 1, progress: 0, reward: 100, claimed: false },
    { id: 'complete20', text: 'Complete 20 Levels', target: 20, progress: 0, reward: 250, claimed: false },
    { id: 'complete50', text: 'Complete 50 Levels', target: 50, progress: 0, reward: 1000, claimed: false },
    { id: 'watchAds', text: 'Watch 5 Dynamic Ad Clips', target: 5, progress: 0, reward: 1000, claimed: false },
    { id: 'internetTime', text: 'Stay Online for 5 Minutes', target: 300, progress: 0, reward: 300, claimed: false }
];

// Initialize the active array
let dailyMissions = loadOrResetDailyMissions();

// DOM Target Nodes
const boardEl = document.getElementById('board');
const highlightsEl = document.getElementById('highlights');
const wordListEl = document.getElementById('word-list');
const scoreEl = document.getElementById('score-val');
const coinsEl = document.getElementById('coins-val');
const levelEl = document.getElementById('level-val');
const levelLabelEl = document.getElementById('level-label');
const categoryEl = document.getElementById('category-text');
const btnHint = document.getElementById('btn-hint');
const btnWand = document.getElementById('btn-wand');
const btnRepeat = document.querySelector('.btn-reload');

const overlayEl = document.getElementById('level-complete-overlay');
const overlayBaseScoreEl = document.getElementById('overlay-base-score');
const overlayExtraCountEl = document.getElementById('overlay-extra-count');
const overlayBonusRewardEl = document.getElementById('overlay-bonus-reward');

setInterval(() => {
    if (navigator.onLine) {
        let netMission = dailyMissions.find(m => m.id === 'internetTime');
        if (netMission && !netMission.claimed && netMission.progress < netMission.target) {
            netMission.progress++;
            if (netMission.progress % 15 === 0) saveGameDaily(); 
        }
    }
}, 1000);

function saveGameDaily() {
    const gameState = {
        date: new Date().toDateString(),
        score,
        coins,
        dailyMissions
    };

    localStorage.setItem(
        'premiumWordSearchDailySave',
        JSON.stringify(gameState)
    );
    
    // ---> ADD THIS LINE HERE TO AUTO-SYNC TO GOOGLE:
    if (typeof window.savePlayerScore === 'function') window.savePlayerScore();
}

function loadDailySave() {
    const saved = localStorage.getItem('premiumWordSearchDailySave');
    if (!saved) return;

    const state = JSON.parse(saved);

    score = state.score;
    coins = state.coins;
    dailyMissions = state.dailyMissions;
}

// 2. Load missions based on the current date
function loadOrResetDailyMissions() {
    const today = new Date().toDateString(); // Grabs the current date string
    const savedRaw = localStorage.getItem('premiumWordSearchDailySave');
    
    if (savedRaw) {
        try {
            const state = JSON.parse(savedRaw);
            // If the save is from today, load the saved progress
            if (state.date === today && state.dailyMissions) {
                return state.dailyMissions;
            }
        } catch (e) { 
            console.error("Error parsing daily save for missions", e); 
        }
    }
    
    // If it's a new day (past midnight) or no save exists, return fresh defaults
    return JSON.parse(JSON.stringify(DEFAULT_DAILY_MISSIONS));
}


function saveGame() {
    // FIX: Safeguard against overwriting a valid saved grid with an empty grid when claiming rewards
    let gridToSave = grid;
    let placementsToSave = wordPlacements;
    let foundToSave = Array.from(foundWords);
    let extraPlacedToSave = extraWordsPlaced;
    let extraFoundToSave = Array.from(extraWordsFound);
    let highlightsToSave = savedHighlightsData;

    if (!grid || grid.length === 0 || !grid[0]) {
        const existingSaveRaw = localStorage.getItem('premiumWordSearchSave');
        if (existingSaveRaw) {
            try {
                const existingSave = JSON.parse(existingSaveRaw);
                if (existingSave.grid && existingSave.grid.length > 0) {
                    gridToSave = existingSave.grid;
                    placementsToSave = existingSave.wordPlacements || {};
                    foundToSave = existingSave.foundWords || [];
                    extraPlacedToSave = existingSave.extraWordsPlaced || [];
                    extraFoundToSave = existingSave.extraWordsFound || [];
                    highlightsToSave = existingSave.savedHighlightsData || [];
                }
            } catch (e) {
                console.error("Error reading existing save in saveGame:", e);
            }
        }
    }

    const gameState = {
        date: new Date().toDateString(),
        currentLevelIdx: currentLevelIdx,
        score: score,
        coins: coins,
        levelStartScore: levelStartScore,
        levelStartCoins: levelStartCoins,
        grid: gridToSave,
        wordPlacements: placementsToSave,
        foundWords: foundToSave,
        extraWordsPlaced: extraPlacedToSave,
        extraWordsFound: extraFoundToSave,
        savedHighlightsData: highlightsToSave,
        activeLevelTimeElapsed: activeLevelTimeElapsed,
        usedPowerupOnActiveLevel: usedPowerupOnActiveLevel,
        dailyMissions: dailyMissions
    };
    localStorage.setItem('premiumWordSearchSave', JSON.stringify(gameState));
    
    if (typeof window.savePlayerScore === 'function') window.savePlayerScore();
}

function loadSavedGame() {
    const saved = localStorage.getItem('premiumWordSearchSave');
    if (saved) {
        try {
            // 1. Declare and parse the state FIRST
            const state = JSON.parse(saved);
            
            // 2. NOW you can safely check and assign its properties
            if (typeof state.currentLevelIdx === "number") {
                currentLevelIdx = state.currentLevelIdx;
            }
            
            score = state.score;
            coins = state.coins;
            levelStartScore = state.levelStartScore;
            levelStartCoins = state.levelStartCoins;
            grid = state.grid;
            wordPlacements = state.wordPlacements;
            foundWords = new Set(state.foundWords || []);
            extraWordsPlaced = state.extraWordsPlaced || [];
            extraWordsFound = new Set(state.extraWordsFound || []);
            savedHighlightsData = state.savedHighlightsData || [];
            
            // New Daily Mission Attributes
            activeLevelTimeElapsed = state.activeLevelTimeElapsed || 0;
            usedPowerupOnActiveLevel = state.usedPowerupOnActiveLevel || false;
            if (state.dailyMissions) {
                dailyMissions = state.dailyMissions;
            }

            return true; 
        } catch (e) {
            console.error("Error parsing save data", e);
            return false;
        }
    }
    return false;
}

function resetSaveAndReload() {
     // BULLETPROOF LOCK: If the mission is running, ignore clicks completely
     if (isDailyMissionActive) return; 
     
     localStorage.removeItem('premiumWordSearchSave');
     score = levelStartScore;
     coins = levelStartCoins;
     loadLevel(currentLevelIdx, true); 
}

function saveStatsToStorage() {
    localStorage.setItem('premiumWordSearchStats', JSON.stringify(gameStats));
}

// === CORE GAME LOGIC ===
function bootOmniDashboard() {
    // FIX: Pre-load save data into memory immediately on startup
    loadSavedGame();
    if (typeof loadDailySave === 'function') loadDailySave();

    const saved = localStorage.getItem('premiumWordSearchSave');
    if (saved) {
        document.getElementById('omni-play-text').textContent = "Resume Journey";
    }
}

function mergeSaveDataAndUpdateUI() {
    // 1. Fetch both save files from local storage
    const dailySaveRaw = localStorage.getItem('premiumWordSearchDailySave');
    const campaignSaveRaw = localStorage.getItem('premiumWordSearchSave');

    let dailyScore = 0, dailyCoins = 0, dailyMissionsData = [];
    let campaignScore = 0, campaignCoins = 0, campaignMissionsData = [];

    // 2. Parse Daily Save safely
    if (dailySaveRaw) {
        try {
            const dailySave = JSON.parse(dailySaveRaw);
            dailyScore = dailySave.score || 0;
            dailyCoins = dailySave.coins || 0;
            dailyMissionsData = dailySave.dailyMissions || [];
        } catch (e) { 
            console.error("Error parsing daily save", e); 
        }
    }

    // 3. Parse Campaign Save safely
    if (campaignSaveRaw) {
        try {
            const campaignSave = JSON.parse(campaignSaveRaw);
            campaignScore = campaignSave.score || 0;
            campaignCoins = campaignSave.coins || 0;
            campaignMissionsData = campaignSave.dailyMissions || [];
        } catch (e) { 
            console.error("Error parsing campaign save", e); 
        }
    }

    // 4. FIX: Use Math.max to prevent exponential duplication
    // We take the highest value to ensure no progress is lost, but we don't double-count.
    score = Math.max(dailyScore, campaignScore);
    coins = Math.max(dailyCoins, campaignCoins);

   // 5. Smart-merge Daily Missions (Takes the highest progress to prevent data loss)
    const today = new Date().toDateString();
    
    if (dailyMissionsData.length > 0 || campaignMissionsData.length > 0) {
        dailyMissions.forEach(mission => {
            // Only pull campaign mission data if the campaign save was also updated today
            let campaignSaveIsCurrent = false;
            if (campaignSaveRaw) {
                 try {
                     const cSave = JSON.parse(campaignSaveRaw);
                     if (cSave.date === today) campaignSaveIsCurrent = true;
                 } catch (e) {}
            }

            const dMission = dailyMissionsData.find(m => m.id === mission.id);
            const cMission = campaignSaveIsCurrent ? campaignMissionsData.find(m => m.id === mission.id) : null;
            
            const dProgress = dMission ? dMission.progress : 0;
            const cProgress = cMission ? cMission.progress : 0;
            
            // Keep whichever save had more progress for today
            mission.progress = Math.max(dProgress, cProgress);
            
            // If it was claimed in EITHER save today, it stays claimed
            if ((dMission && dMission.claimed) || (cMission && cMission.claimed)) {
                mission.claimed = true;
            }
        });
    }

    // 6. Overwrite both local storages with the newly merged global data
    saveGameDaily();
    saveGame();

    // 7. Push the updated totals to the UI
    if (typeof updateEconomyUI === 'function') {
        updateEconomyUI();
    }
    
    console.log(`Merge Complete! Synced Score: ${score} | Synced Coins: ${coins}`);
}

function bootGameFromOmni() {
    if (typeof audioEngine !== 'undefined' && audioEngine.init) {
        audioEngine.init();
        audioEngine.playClick(); 
    }
    const dashboard = document.getElementById('omni-start-screen');
    dashboard.style.opacity = '0';
    
    setTimeout(() => {
        dashboard.classList.remove('active');
        dashboard.style.display = 'none'; 
        
        setupInteraction();
        
        // FIX: Verify that the loaded save actually contains a populated grid matrix
        if (loadSavedGame() && grid && grid.length > 0 && grid[0] && grid[0].length > 0) {
            restoreLevel();
            startLevelProcessingClock();
        } else {
            // If the save got corrupted by the previous bug, this will regenerate a fresh board for the current level
            loadLevel(currentLevelIdx || 0);
        }

        mergeSaveDataAndUpdateUI(); 
        
    }, 600); 
}

function openOmniModal(title, contentHTML) {
    document.getElementById('omni-modal-title').innerHTML = title;
    document.getElementById('omni-modal-body').innerHTML = contentHTML;
    document.getElementById('omni-master-modal').classList.add('active');
}

function closeOmniModal() {
    document.getElementById('omni-master-modal').classList.remove('active');
}

function startLevelProcessingClock() {
    if (levelTimerEngineInterval) clearInterval(levelTimerEngineInterval);
    levelTimerEngineInterval = setInterval(() => {
        activeLevelTimeElapsed++;
    }, 1000);
}

function loadLevel(idx, forceRegenerate = false) {
    if (forceRegenerate) {
        gameStats.totalGamesPlayed++;
        saveStatsToStorage();
    }
    lastWordTimestamp = Date.now(); 

    if (idx >= LEVELS.length) {
        alert(`Stunning Work! You have conquered every single premium level category! Final Score: ${score}`);
        localStorage.removeItem('premiumWordSearchSave'); 
        return;
    }

    currentLevelIdx = idx;
    const levelData = LEVELS[idx];
    gridSize = levelData.size;
    
    levelStartScore = score;
    levelStartCoins = coins;
    
    // Reset trackers for the new level
    activeLevelTimeElapsed = 0;
    usedPowerupOnActiveLevel = false;
    startLevelProcessingClock();
    
    activeWords = levelData.words.map((w, i) => ({
        word: w,
        color: COLORS[i % COLORS.length]
    }));

    foundWords.clear();
    wordPlacements = {};
    extraWordsPlaced = [];
    savedHighlightsData = [];
    
    overlayEl.classList.remove('active'); 
    highlightsEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    levelEl.textContent = currentLevelIdx + 1;
    categoryEl.textContent = levelData.category;
    
    generateGrid();
    renderWordList();
    renderGrid();
    updateEconomyUI();
    
    saveGame();
}

function restoreLevel() {
    if (currentLevelIdx == null || currentLevelIdx >= LEVELS.length) {
    currentLevelIdx = 0;
}

     if (currentLevelIdx >= LEVELS.length) {
        alert(`Stunning Work! You have conquered every single premium level category! Final Score: ${score}`);
        localStorage.removeItem('premiumWordSearchSave'); 
        return;
    }

    const levelData = LEVELS[currentLevelIdx];
    gridSize = levelData.size;
    
    activeWords = levelData.words.map((w, i) => ({
        word: w,
        color: COLORS[i % COLORS.length]
    }));
    
    overlayEl.classList.remove('active'); 
    highlightsEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    levelEl.textContent = currentLevelIdx + 1;
    categoryEl.textContent = levelData.category;
    
    renderWordList();
    renderGrid();
    recreateHighlightsFromSave();
    updateEconomyUI();

    if (foundWords.size === activeWords.length) {
        showLevelComplete();
    }
}

function renderWordList() {
    wordListEl.innerHTML = '';
    activeWords.forEach(data => {
        const div = document.createElement('div');
        div.className = 'word-item';
        div.id = `word-${data.word}`;
        
        if(foundWords.has(data.word)) {
             div.classList.add('found');
             // Visually cancel the found word
             div.style.textDecoration = 'line-through';
             div.style.opacity = '0.5'; 
        }
        
        div.innerHTML = `
            <div class="word-dot" style="background-color: ${data.color}"></div>
            <span>${data.word}</span>
        `;
        wordListEl.appendChild(div);
    });
}

function generateGrid() {
    grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
    const dirs = [[0,1], [1,0], [1,1], [-1,1], [-1,-1], [1,-1], [0,-1], [-1,0]];
    
    activeWords.forEach(data => {
        let placed = false;
        let attempts = 0;
        while (!placed && attempts < 300) {
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            const r = Math.floor(Math.random() * gridSize);
            const c = Math.floor(Math.random() * gridSize);
            
            if (canPlaceWord(data.word, r, c, dir)) {
                placeWord(data.word, r, c, dir);
                wordPlacements[data.word] = { 
                    r1: r, c1: c, 
                    r2: r + dir[0] * (data.word.length - 1), 
                    c2: c + dir[1] * (data.word.length - 1) 
                };
                placed = true;
            }
            attempts++;
        }
    });

    const levelData = isDailyMissionActive 
        ? { extraWords: ['BONUS', 'TIME', 'RUSH', 'FAST', 'TICK'] } 
        : LEVELS[currentLevelIdx];
        
    let shuffledBonus = [...levelData.extraWords].sort(() => 0.5 - Math.random());
    for(let i = 0; i < 15; i++) {
        if(!shuffledBonus[i]) break;
        let word = shuffledBonus[i];
        let attempts = 0;
        while(attempts < 100) {
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            const r = Math.floor(Math.random() * gridSize);
            const c = Math.floor(Math.random() * gridSize);
            if (canPlaceWord(word, r, c, dir)) {
                placeWord(word, r, c, dir);
                extraWordsPlaced.push(word);
                break;
            }
            attempts++;
        }
    }

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            if (grid[r][c] === '') grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
    }
}

function canPlaceWord(word, r, c, dir) {
    for (let i = 0; i < word.length; i++) {
        const nr = r + dir[0] * i;
        const nc = c + dir[1] * i;
        if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) return false;
        if (grid[nr][nc] !== '' && grid[nr][nc] !== word[i]) return false;
    }
    return true;
}

function placeWord(word, r, c, dir) {
    for (let i = 0; i < word.length; i++) {
        grid[r + dir[0] * i][c + dir[1] * i] = word[i];
    }
}

function renderGrid() {
    boardEl.innerHTML = '';

    // FIX: Removed 'return' so the DOM cells are rendered after generating the grid
    if (!grid || grid.length === 0 || !grid[0]) {
        generateGrid();
    }

    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const cell = document.createElement('div');
            cell.className = 'letter-cell';
            cell.textContent = grid[r][c];
            cell.dataset.r = r;
            cell.dataset.c = c;
            cell.id = `cell-${r}-${c}`;
            boardEl.appendChild(cell);
        }
    }
}

function recreateHighlightsFromSave() {
    highlightsEl.innerHTML = '';
    
    requestAnimationFrame(() => {
         savedHighlightsData.forEach(hData => {
             const startCellEl = document.getElementById(`cell-${hData.r1}-${hData.c1}`);
             const endCellEl = document.getElementById(`cell-${hData.r2}-${hData.c2}`);
             
             if (startCellEl && endCellEl) {
                 const restoredHighlight = document.createElement('div');
                 restoredHighlight.className = 'highlight-pill';
                 restoredHighlight.style.backgroundColor = hData.color;
                 
                 if (hData.isExtra) {
                     restoredHighlight.style.border = '2px solid var(--gold)';
                 }
                 
                 highlightsEl.appendChild(restoredHighlight);
                 updateHighlight(endCellEl, startCellEl, restoredHighlight);
             }
         });
    });
}

function setupInteraction() {
    boardEl.addEventListener('mousedown', handlePointerDown);
    boardEl.addEventListener('mouseover', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    boardEl.addEventListener('touchstart', (e) => {
    if (!e.touches || e.touches.length === 0) return; // Guard clause
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if(target && target.classList.contains('letter-cell')) handlePointerDown({target});
}, {passive: false});

boardEl.addEventListener('touchmove', (e) => {
    e.preventDefault(); 
    if (!e.touches || e.touches.length === 0) return; // Guard clause
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if(target && target.classList.contains('letter-cell')) handlePointerMove({target});
}, {passive: false});

    window.addEventListener('touchend', handlePointerUp);
    
    window.addEventListener('resize', () => {
         if(savedHighlightsData.length > 0 || foundWords.size > 0 || extraWordsFound.size > 0) {
              recreateHighlightsFromSave();
         }
    });
}

function animateStar(r, c, targetWordId) {
    const startCell = document.getElementById(`cell-${r}-${c}`);
    const targetWordEl = document.getElementById(targetWordId);
    
    if (!startCell || !targetWordEl) return;

    const startRect = startCell.getBoundingClientRect();
    const targetRect = targetWordEl.getBoundingClientRect();

    const star = document.createElement('div');
    star.textContent = '⭐'; 
    star.className = 'flying-star';
    
    star.style.left = `${startRect.left + startRect.width / 2}px`;
    star.style.top = `${startRect.top + startRect.height / 2}px`;
    star.style.transform = 'translate(-50%, -50%) scale(0.5) rotate(0deg)';
    
    document.body.appendChild(star);
    star.getBoundingClientRect();

    star.style.left = `${targetRect.left + targetRect.width / 2}px`;
    star.style.top = `${targetRect.top + targetRect.height / 2}px`;
    star.style.transform = 'translate(-50%, -50%) scale(1.5) rotate(720deg)';
    star.style.opacity = '0'; 

    setTimeout(() => {
        star.remove();
        targetWordEl.classList.add('found');
        // Visually cancel the found word
        targetWordEl.style.textDecoration = 'line-through';
        targetWordEl.style.opacity = '0.5';
    }, 600);
}

function handlePointerDown(e) {
    if (!e.target.classList.contains('letter-cell')) return;
    document.querySelectorAll('.hint-pulse').forEach(el => el.classList.remove('hint-pulse'));

    isDragging = true;
    startCell = e.target;
    
    currentHighlight = document.createElement('div');
    currentHighlight.className = 'highlight-pill';
    currentHighlight.style.backgroundColor = 'rgba(0,0,0,0.08)'; 
    highlightsEl.appendChild(currentHighlight);
    
    updateHighlight(startCell);
}

function handlePointerMove(e) {
    if (!isDragging || !e.target.classList.contains('letter-cell')) return;
    if (e.target !== lastHoveredCell) {
        if (typeof audioEngine !== 'undefined' && audioEngine.playHighlight) audioEngine.playHighlight();
        lastHoveredCell = e.target;
    }

    const r1 = parseInt(startCell.dataset.r);
    const c1 = parseInt(startCell.dataset.c);
    const r2 = parseInt(e.target.dataset.r);
    const c2 = parseInt(e.target.dataset.c);
    
    const dr = Math.abs(r2 - r1);
    const dc = Math.abs(c2 - c1);
    
    if (dr === 0 || dc === 0 || dr === dc) {
        updateHighlight(e.target);
    }
}

function updateHighlight(endCell, customStart = null, highlightEl = currentHighlight) {
    const start = customStart || startCell;
    const hContainer = highlightsEl.getBoundingClientRect();
    
    if (hContainer.width === 0) return; 

    const startRect = start.getBoundingClientRect();
    const endRect = endCell.getBoundingClientRect();

    const x1 = startRect.left - hContainer.left + startRect.width / 2;
    const y1 = startRect.top - hContainer.top + startRect.height / 2;
    const x2 = endRect.left - hContainer.left + endRect.width / 2;
    const y2 = endRect.top - hContainer.top + endRect.height / 2;

    const length = Math.hypot(x2 - x1, y2 - y1);
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
    const thickness = startRect.height * 0.75; 

    highlightEl.style.width = `${length + thickness}px`;
    highlightEl.style.height = `${thickness}px`;
    highlightEl.style.left = `${x1}px`;
    highlightEl.style.top = `${y1 - thickness / 2}px`;
    
    highlightEl.style.transformOrigin = 'left center';
    highlightEl.style.transform = `rotate(${angle}deg) translateX(${-thickness / 2}px)`;
    highlightEl.style.borderRadius = `${thickness / 2}px`;
    
    highlightEl.dataset.endCell = endCell.dataset.r + ',' + endCell.dataset.c;
}

function handlePointerUp() {
    if (!isDragging) return;
    isDragging = false;
    
    if (!currentHighlight || !currentHighlight.dataset.endCell) {
        if(currentHighlight) currentHighlight.remove();
        return;
    }

    const endCoords = currentHighlight.dataset.endCell.split(',');
    const r1 = parseInt(startCell.dataset.r);
    const c1 = parseInt(startCell.dataset.c);
    const r2 = parseInt(endCoords[0]);
    const c2 = parseInt(endCoords[1]);

    processWordSubmission(r1, c1, r2, c2, currentHighlight);
    currentHighlight = null;
}

function processWordSubmission(r1, c1, r2, c2, highlightElement) {
    const selectedStr = getWordFromSelection(r1, c1, r2, c2);
    const selectedStrRev = selectedStr.split('').reverse().join('');
    
    const match = activeWords.find(w => 
        (w.word === selectedStr || w.word === selectedStrRev) && 
        !foundWords.has(w.word)
    );

    if (match) {
        if (typeof audioEngine !== 'undefined' && audioEngine.playFound) audioEngine.playFound();
        foundWords.add(match.word);
        highlightElement.style.backgroundColor = match.color;

        let timeTaken = (Date.now() - lastWordTimestamp) / 1000;
        gameStats.totalFindTimeSec += timeTaken;
        gameStats.totalWordsFound++;
        lastWordTimestamp = Date.now(); 
        saveStatsToStorage();
        
        animateStar(r1, c1, `word-${match.word}`);
        spawnFloatingCoins(highlightElement, 25);
        
        savedHighlightsData.push({
            r1: r1, c1: c1, r2: r2, c2: c2, 
            color: match.color, isExtra: false
        });
        
        score += 100;
        coins += 25; 
        updateEconomyUI();
        saveGameDaily(); saveGame();
        

        if (foundWords.size === activeWords.length) {
            if (isDailyMissionActive) {
                setTimeout(winDailyMission, 500);
            } else {
                setTimeout(showLevelComplete, 1200); 
            }
        }
        return;
    }
    
    const isExtraWord = extraWordsPlaced.includes(selectedStr) || extraWordsPlaced.includes(selectedStrRev);
    const matchedExtraWord = extraWordsPlaced.includes(selectedStr) ? selectedStr : selectedStrRev;

    if (isExtraWord && !extraWordsFound.has(matchedExtraWord)) {
        let timeTaken = (Date.now() - lastWordTimestamp) / 1000;
        gameStats.totalFindTimeSec += timeTaken;
        gameStats.totalWordsFound++;
        lastWordTimestamp = Date.now(); 
        saveStatsToStorage();

        if (typeof audioEngine !== 'undefined' && audioEngine.playExtraFound) audioEngine.playExtraFound();
        extraWordsFound.add(matchedExtraWord);
        
        // WIRING: Update Extra Words Mission Count
        let extraWordsMission = dailyMissions.find(m => m.id === 'extraWords');
        if (extraWordsMission && extraWordsMission.progress < extraWordsMission.target) {
            extraWordsMission.progress++;
        }
        
        const bonusColor = 'rgba(244, 192, 83, 0.4)';
        highlightElement.style.backgroundColor = bonusColor;
        highlightElement.style.border = '2px solid var(--gold)';
        
        spawnFloatingCoins(highlightElement, 10);
        
        savedHighlightsData.push({
            r1: r1, c1: c1, r2: r2, c2: c2, 
            color: bonusColor, isExtra: true
        });
        
        coins += 10; 
        updateEconomyUI();
        saveGameDaily(); saveGame();
        
        return;
    }

    highlightElement.remove();
}

function getWordFromSelection(r1, c1, r2, c2) {
    let str = "";
    const steps = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
    if(steps === 0) return grid[r1][c1];
    
    const dr = (r2 - r1) / steps;
    const dc = (c2 - c1) / steps;

    for (let i = 0; i <= steps; i++) {
        str += grid[r1 + i * dr][c1 + i * dc];
    }
    return str;
}

function getUnfoundWord() {
    const remaining = activeWords.filter(w => !foundWords.has(w.word));
    if (remaining.length === 0) return null;
    return remaining[Math.floor(Math.random() * remaining.length)];
}

// ALTERNATIVE PLATFORM AD WATCH SIMULATOR
function simulateAdWatchTrigger(type) {
    openOmniModal("🎬 Launching Premium Clip", `
        <div style="padding:10px; text-align:center;">
            <p style="margin-bottom:15px;">Simulating premium sponsored network video loop stream...</p>
            <div class="premium-progress-track" style="height:10px; margin-bottom:15px;">
                <div class="premium-progress-fluid" id="ad-sim-fluid" style="width:0%; background:#2ecc71;"></div>
            </div>
            <p id="ad-sim-status" style="font-size:12px; color:#7a9c9f;">Loading Stream Asset...</p>
        </div>
    `);
    
    let pct = 0;
    let adInterval = setInterval(() => {
        pct += 25;
        document.getElementById('ad-sim-fluid').style.width = pct + '%';
        document.getElementById('ad-sim-status').textContent = `Streaming Clip (${pct}%)`;
        if(pct >= 100) {
            clearInterval(adInterval);
            setTimeout(() => {
                closeOmniModal();
                grantAdReward(type);
            }, 300);
        }
    }, 400);
}

function useHint() {
    if (isDailyMissionActive) return; // Mission safeguard
    usedPowerupOnActiveLevel = true;
    if (coins < 50) {
        if (window.AndroidBridge) {
            window.AndroidBridge.showAdForPowerup('hint');
        } else {
            simulateAdWatchTrigger('hint');
        }
        return;
    }
    executeHint(false); 
    gameStats.totalHintsUsed++;
    saveStatsToStorage();
}

function executeHint(isFree) {
    const targetWord = getUnfoundWord();
    if (!targetWord) return;

    if (!isFree) {
        coins -= 50;
        score = Math.max(0, score - 50); 
        updateEconomyUI();
       if (isDailyMissionActive) saveGameDaily(); else saveGame();
    }

    const coords = wordPlacements[targetWord.word];
    const cell = document.getElementById(`cell-${coords.r1}-${coords.c1}`);
    
    document.querySelectorAll('.hint-pulse').forEach(el => el.classList.remove('hint-pulse'));
    cell.classList.add('hint-pulse');
}

function useWand() {
    if (isDailyMissionActive) return; // Mission safeguard
    usedPowerupOnActiveLevel = true;
    if (coins < 150) {
        if (window.AndroidBridge) {
            window.AndroidBridge.showAdForPowerup('wand');
        } else {
            simulateAdWatchTrigger('wand');
        }
        return;
    }
    gameStats.totalWandsUsed++;
    saveStatsToStorage();
    executeWand(false); 
}

function executeWand(isFree) {
    const targetWord = getUnfoundWord();
    if (!targetWord) return;

    if (!isFree) {
        coins -= 150;
        score = Math.max(0, score - 50); 
        updateEconomyUI();
    }

    const coords = wordPlacements[targetWord.word];
    const start = document.getElementById(`cell-${coords.r1}-${coords.c1}`);
    const end = document.getElementById(`cell-${coords.r2}-${coords.c2}`);

    const wandHighlight = document.createElement('div');
    wandHighlight.className = 'highlight-pill';
    highlightsEl.appendChild(wandHighlight);
    
    updateHighlight(end, start, wandHighlight);
    processWordSubmission(coords.r1, coords.c1, coords.r2, coords.c2, wandHighlight);
}

window.grantAdReward = function(powerupType) {
    // WIRING: Update Ad Watching Mission Count
    let adsMission = dailyMissions.find(m => m.id === 'watchAds');
if (adsMission && adsMission.progress < adsMission.target) {
    adsMission.progress++;
}
    saveGameDaily(); saveGame();

    if (powerupType === 'hint') {
        executeHint(true); 
    } else if (powerupType === 'wand') {
        executeWand(true); 
    }
}

function updateEconomyUI() {
    scoreEl.textContent = score;
    coinsEl.textContent = coins;
    
    // --- HINT BUTTON ECONOMY ---
    const hintCost = document.querySelector('#btn-hint .cost');
    if (coins < 50) {
        // Not enough coins: Show clean Ad icon (No background, borders, or shadows)
        hintCost.innerHTML = '<img src="./images/camera.png" alt="Ad" style="width: 30px; height:30; object-fit: contain;">';
        hintCost.style.background = 'transparent';
        hintCost.style.border = 'none';
        hintCost.style.boxShadow = 'none';
        hintCost.style.backdropFilter = "none";
    } else {
        // Enough coins: Show premium red pill badge
        hintCost.innerHTML = '50 <img src="images/coin.png">';
        hintCost.style.background = 'linear-gradient(135deg, #ff416c, #d32f2f)';
        hintCost.style.border = '1px solid rgba(255, 255, 255, 0.6)';
        hintCost.style.boxShadow = '0 4px 10px rgba(211, 47, 47, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.7), inset 0 -2px 5px rgba(0, 0, 0, 0.25)';
    }

    // --- WAND BUTTON ECONOMY ---
    const wandCost = document.querySelector('#btn-wand .cost');
    if (coins < 150) {
        // Not enough coins: Show clean Ad icon (No background, borders, or shadows)
        wandCost.innerHTML = '<img src="./images/camera.png" alt="Ad" style="width: 30px; height: 30px; object-fit: contain;">';
        wandCost.style.background = 'transparent';
        wandCost.style.border = 'none';
        wandCost.style.boxShadow = 'none';
        wandCost.style.backdropFilter = "none";
    } else {
        // Enough coins: Show premium red pill badge
        wandCost.innerHTML = '150 <img src="images/coin.png">';
        wandCost.style.background = 'linear-gradient(135deg, #ff416c, #d32f2f)';
        wandCost.style.border = '1px solid rgba(255, 255, 255, 0.6)';
        wandCost.style.boxShadow = '0 4px 10px rgba(211, 47, 47, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.7), inset 0 -2px 5px rgba(0, 0, 0, 0.25)';
    }
}
    
let confettiAnimationId = null;
let holdsBonusRewardState = false;

function showLevelComplete() {
    if(levelTimerEngineInterval) clearInterval(levelTimerEngineInterval);
    if (typeof audioEngine !== 'undefined' && audioEngine.playWin) audioEngine.playWin(); 

   // Speed Run Check (Under 2 mins / 120 secs)
if (activeLevelTimeElapsed <= 120) {
    let speedMission = dailyMissions.find(m => m.id === 'speedRun');
    if (speedMission && speedMission.progress < speedMission.target) speedMission.progress = 1;
}

// Pure Run Check (No hints/wands used)
if (!usedPowerupOnActiveLevel) {
    let pureMission = dailyMissions.find(m => m.id === 'noPowerups');
    if (pureMission && pureMission.progress < pureMission.target) pureMission.progress = 1;
}
    // Milestone Counters
let m10 = dailyMissions.find(m => m.id === 'complete10');
if(m10 && m10.progress < m10.target) m10.progress++;

let m20 = dailyMissions.find(m => m.id === 'complete20');
if(m20 && m20.progress < m20.target) m20.progress++;

let m50 = dailyMissions.find(m => m.id === 'complete50');
if(m50 && m50.progress < m50.target) m50.progress++;

    saveGameDaily(); saveGame();

    const totalBaseScore = activeWords.length * 100;
    overlayBaseScoreEl.textContent = `+${totalBaseScore}`;
    
    const actualScoreGained = score - levelStartScore;
    const pointsLost = totalBaseScore - actualScoreGained;
    
    let earnedStars = 3;
    if (pointsLost > 0 && pointsLost <= 100) earnedStars = 2; 
    else if (pointsLost > 100) earnedStars = 1; 

    const stars = [
        document.getElementById('star-1'),
        document.getElementById('star-2'),
        document.getElementById('star-3')
    ];
    
    stars.forEach(star => {
        star.classList.remove('animate-pop', 'filled');
        void star.offsetWidth; 
    });

    setTimeout(() => { if (earnedStars >= 1) stars[0].classList.add('filled'); stars[0].classList.add('animate-pop'); }, 200);
    setTimeout(() => { if (earnedStars >= 2) stars[1].classList.add('filled'); stars[1].classList.add('animate-pop'); }, 450);
    setTimeout(() => { if (earnedStars >= 3) stars[2].classList.add('filled'); stars[2].classList.add('animate-pop'); }, 700);

    gameStats.levelStars[currentLevelIdx] = earnedStars;
    saveStatsToStorage();

    const extraCount = extraWordsFound.size;
    overlayExtraCountEl.textContent = extraCount;

    const progressPercentage = Math.min((extraCount / 10) * 100, 100);
    const progressBar = document.getElementById('overlay-progress-bar');
    const rewardNode = document.getElementById('overlay-reward-node');
    const imageShowcase = document.getElementById('bonus-image-showcase');
    
    imageShowcase.innerHTML = '';
    holdsBonusRewardState = false;
    
    progressBar.style.width = '0%';
    setTimeout(() => {
        progressBar.style.width = `${progressPercentage}%`;
    }, 150);

    if (extraCount >= 10) {
        overlayBonusRewardEl.textContent = "🏆 500 Coin Bonus Awarded!";
        overlayBonusRewardEl.classList.add('achieved');
        rewardNode.classList.add('unlocked');
        
        holdsBonusRewardState = true;
        imageShowcase.innerHTML = `<img src="images/coins.png" class="coin-blast-graphic" alt="500 Coins Reward">`;
        initPremiumConfettiEngine();
        
        coins += 500;
        score += 1000;
        extraWordsFound.clear();
        
        if (isDailyMissionActive) saveGameDaily(); else saveGame();
    } else {
        overlayBonusRewardEl.textContent = "Find 10 for a 500 Coin Bonus!";
        overlayBonusRewardEl.classList.remove('achieved');
        rewardNode.classList.remove('unlocked');
        updateEconomyUI();
    }

    overlayEl.classList.add('active');
}

function startNextLevel() {
    if (confettiAnimationId) {
        cancelAnimationFrame(confettiAnimationId);
        confettiAnimationId = null;
    }
    document.getElementById('premium-confetti-canvas').style.display = 'none';

    if (holdsBonusRewardState) {
        executeCoinFountainCascade(() => {
            overlayEl.classList.remove('active');
            setTimeout(() => {
                loadLevel(currentLevelIdx + 1, true);
            }, 300);
        });
    } else {
        overlayEl.classList.remove('active');
        setTimeout(() => {
            loadLevel(currentLevelIdx + 1, true);
        }, 300);
    }
}


function initPremiumConfettiEngineDaily() {
    const canvas = document.getElementById('premium-confetti-canvas');
    const ctx = canvas.getContext('2d');
    
    // Explicitly force the canvas layer over the success overlay with high-end visibility rules
    canvas.style.display = 'block';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '99999'; // Layered safely above level-complete-overlay
    canvas.style.pointerEvents = 'none';

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    // Refined Premium Palette: Platinum, Champagne Gold, Rose Gold, Pure White
    const colors = ['#e6e6e6', '#f3e5ab', '#b76e79', '#d4af37', '#ffffff'];
    
    // Generates a high-velocity particle stream launching from the bottom corners inward
    function createParticle(side) {
        const isLeft = side === 'left';
        return {
            x: isLeft ? 0 : width,
            y: height * 0.85,
            // Drastically reduced radius for fine dust/sparks
            radius: Math.random() * 1.5 + 0.5, 
            color: colors[Math.floor(Math.random() * colors.length)],
            // Cross-fountain vectors (slightly gentler for elegance)
            vx: isLeft ? (Math.random() * 12 + 6) : -(Math.random() * 12 + 6),
            vy: -(Math.random() * 14 + 10),
            opacity: 1,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.15, // Slower, more graceful rotation
            wobble: Math.random() * 10,
            wobbleSpeed: Math.random() * 0.05 + 0.02,
            // Geometric variety (Triangles, Ribbons, Sparks)
            type: Math.random() > 0.65 ? 'triangle' : (Math.random() > 0.35 ? 'ribbon' : 'circle'),
            // Finer, sharper geometry for ribbons/triangles
            width: Math.random() * 4 + 2,
            height: Math.random() * 7 + 4
        };
    }

    // Initial cinematic impact burst (increased count slightly to compensate for smaller size)
    for (let i = 0; i < 90; i++) {
        particles.push(createParticle('left'));
        particles.push(createParticle('right'));
    }

    function renderEngineLoop() {
        ctx.clearRect(0, 0, width, height);
        
        // Sustained ambient trickling streams as the level overlay settles
        if (particles.length < 220 && Math.random() > 0.25) {
            particles.push(createParticle(Math.random() > 0.5 ? 'left' : 'right'));
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            
            // Kinetic fluid path mechanics
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.32; // Slightly lower gravity for "floatier" foil
            p.vx *= 0.98; // Atmospheric air resistance drag
            p.rotation += p.rotationSpeed;
            p.wobble += p.wobbleSpeed;

            // Lateral organic drift swing
            p.x += Math.sin(p.wobble) * 0.5;

            // Smooth linear decay profile once past apex velocity
            if (p.vy > 1.2) {
                p.opacity -= 0.01;
            }

            // Garbage collection for off-screen/invisible nodes
            if (p.opacity <= 0 || p.y > height || p.x < 0 || p.x > width) {
                particles.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            
            // Tighter, crisp luminescent bloom glow
            ctx.shadowBlur = 3;
            ctx.shadowColor = p.color;

            if (p.type === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'triangle') {
                ctx.beginPath();
                ctx.moveTo(0, -p.width);
                ctx.lineTo(p.width, p.width);
                ctx.lineTo(-p.width, p.width);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
            }
            ctx.restore();
        }

        confettiAnimationId = requestAnimationFrame(renderEngineLoop);
    }
    
    renderEngineLoop();
}

function initPremiumConfettiEngine() {
    const canvas = document.getElementById('premium-confetti-canvas');
    const ctx = canvas.getContext('2d');
    canvas.style.display = 'block';
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const colors = ['#ffe066', '#f4c053', '#dca353', '#fff3b0', '#ffd700'];
    
    for (let i = 0; i < 110; i++) {
        particles.push({
            x: width / 2,
            y: height / 2 - 40,
            radius: Math.random() * 4 + 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: (Math.random() - 0.5) * 16,
            vy: (Math.random() - 0.6) * 20 - 4,
            opacity: 1,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.3,
            type: Math.random() > 0.4 ? 'circle' : 'ribbon',
            width: Math.random() * 6 + 4,
            height: Math.random() * 12 + 8
        });
    }

    function renderEngineLoop() {
        ctx.clearRect(0, 0, width, height);
        
        if (particles.length < 160 && Math.random() > 0.3) {
            particles.push({
                x: width / 2 + (Math.random() - 0.5) * 200,
                y: height / 2 - 60,
                radius: Math.random() * 2 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.8) * 5,
                opacity: 1,
                rotation: Math.random() * Math.PI,
                rotationSpeed: 0.05,
                type: 'circle'
            });
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.38; 
            p.vx *= 0.98; 
            p.rotation += p.rotationSpeed;
            
            if (p.vy > 1) p.opacity -= 0.008; 

            if (p.opacity <= 0 || p.y > height) {
                particles.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = p.opacity;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 6;
            ctx.shadowColor = 'rgba(218, 165, 32, 0.4)';

            if (p.type === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
            }
            ctx.restore();
        }

        confettiAnimationId = requestAnimationFrame(renderEngineLoop);
    }
    
    renderEngineLoop();
}

function executeCoinFountainCascade(callbackCompletion) {
    const container = document.getElementById('coin-fountain-container');
    const targetNode = document.getElementById('coins-val');
    const targetBounds = targetNode.getBoundingClientRect();
    
    const startX = window.innerWidth / 2;
    const startY = window.innerHeight / 2 - 40;
    const coinCount = 18;
    let arrivedCoins = 0;

    const displayCoinsStart = coins - 500;
    const finalTargetCoins = coins;
    
    scoreEl.textContent = score;
    coinsEl.textContent = displayCoinsStart;

    for (let i = 0; i < coinCount; i++) {
        setTimeout(() => {
            const img = document.createElement('img');
            img.src = 'images/coin.png';
            img.className = 'kinetic-flying-coin';
            
            img.style.left = `${startX}px`;
            img.style.top = `${startY}px`;
            img.style.transform = `translate(-50%, -50%) scale(0.2)`;
            container.appendChild(img);
            
            const explosionVx = (Math.random() - 0.5) * 220;
            const explosionVy = (Math.random() - 0.7) * 220 - 60;
            
            requestAnimationFrame(() => {
                img.style.transform = `translate(calc(-50% + ${explosionVx}px), calc(-50% + ${explosionVy}px)) scale(1.4) rotate(${Math.random() * 360}deg)`;
                
                setTimeout(() => {
                    img.style.left = `${targetBounds.left + targetBounds.width / 2}px`;
                    img.style.top = `${targetBounds.top + targetBounds.height / 2}px`;
                    img.style.transform = `translate(-50%, -50%) scale(0.6) rotate(${720 + Math.random() * 360}deg)`;
                    img.style.opacity = '0.7';
                }, 280);
            });

            setTimeout(() => {
                img.remove();
                arrivedCoins++;
                
                const incrementProgress = Math.floor((arrivedCoins / coinCount) * 500);
                coinsEl.textContent = displayCoinsStart + incrementProgress;
                
                targetNode.parentElement.parentElement.classList.remove('coin-stat-active-pulse');
                void targetNode.parentElement.parentElement.offsetWidth; 
                targetNode.parentElement.parentElement.classList.add('coin-stat-active-pulse');

                if (arrivedCoins === coinCount) {
                    coinsEl.textContent = finalTargetCoins;
                    updateEconomyUI();
                    setTimeout(callbackCompletion, 300);
                }
            }, 1000);

        }, i * 45); 
    }
}

function spawnFloatingCoins(startElement, amount) {
    const container = document.getElementById('coin-fountain-container');
    const targetNode = document.querySelector('.icon-coin img'); 
    
    if (!container || !targetNode || !startElement) return;

    const startBounds = startElement.getBoundingClientRect();
    const targetBounds = targetNode.getBoundingClientRect();

    const startX = startBounds.left + startBounds.width / 2;
    const startY = startBounds.top + startBounds.height / 2;
    const coinElementsCount = amount >= 25 ? 5 : 3; 

    for (let i = 0; i < coinElementsCount; i++) {
        setTimeout(() => {
            const img = document.createElement('img');
            img.src = 'images/coin.png';
            img.className = 'kinetic-flying-coin';
            
            img.style.left = `${startX}px`;
            img.style.top = `${startY}px`;
            img.style.transform = `translate(-50%, -50%) scale(0.3)`;
            container.appendChild(img);

            const popVx = (Math.random() - 0.5) * 120;
            const popVy = (Math.random() - 0.5) * 120 - 40;

            requestAnimationFrame(() => {
                img.style.transform = `translate(calc(-50% + ${popVx}px), calc(-50% + ${popVy}px)) scale(0.9) rotate(${Math.random() * 180}deg)`;
                
                setTimeout(() => {
                    img.style.left = `${targetBounds.left + targetBounds.width / 2}px`;
                    img.style.top = `${targetBounds.top + targetBounds.height / 2}px`;
                    img.style.transform = `translate(-50%, -50%) scale(0.5) rotate(${360 + Math.random() * 360}deg)`;
                    img.style.opacity = '0.8';
                }, 200); 
            });

            setTimeout(() => {
                img.remove();
                
                const pulseTarget = targetNode.parentElement.parentElement;
                pulseTarget.classList.remove('coin-stat-active-pulse');
                void pulseTarget.offsetWidth; 
                pulseTarget.classList.add('coin-stat-active-pulse');
            }, 950);

        }, i * 90); 
    }
}

function openTutorialModal() {
    document.getElementById('omni-tutorial-modal').classList.add('active');
}

function closeTutorialModal() {
    document.getElementById('omni-tutorial-modal').classList.remove('active');
}

function openSoundSettingsModal() {
    if (typeof audioEngine !== 'undefined' && audioEngine.playClick) audioEngine.playClick();
    
    // Check states safely from your engine
    const sfxOn = (typeof audioEngine !== 'undefined') ? audioEngine.sfxEnabled : true;
    const musicOn = (typeof audioEngine !== 'undefined') ? audioEngine.musicEnabled : true;
    
    // Grab current volumes if available, otherwise default to 80%
    const sfxVol = (typeof audioEngine !== 'undefined' && audioEngine.getSfxVolume) ? audioEngine.getSfxVolume() * 100 : 80;
    const musicVol = (typeof audioEngine !== 'undefined' && audioEngine.getMusicVolume) ? audioEngine.getMusicVolume() * 100 : 60;

    const contentHTML = `
        <div class="premium-settings-container">
            
            <div class="settings-control-card">
                <div class="settings-meta-row">
                    <div class="settings-label-group">
                        <span class="settings-title-text">Sound Effects</span>
                        <span class="settings-sub-text" id="sfx-vol-label">${sfxVol}%</span>
                    </div>
                    <button class="ui-toggle-btn-3d ${sfxOn ? 'toggle-on' : 'toggle-off'}" id="sfx-toggle" onclick="handleSettingToggle('sfx')">
                        <span class="toggle-3d-face">${sfxOn ? 'ON' : 'OFF'}</span>
                    </button>
                </div>
                <div class="slider-vault">
                    <input type="range" min="0" max="100" value="${sfxVol}" class="premium-range-slider" id="sfx-slider" oninput="handleVolumeSlider('sfx', this.value)">
                </div>
            </div>

            <div class="settings-control-card">
                <div class="settings-meta-row">
                    <div class="settings-label-group">
                        <span class="settings-title-text">Ambient Music</span>
                        <span class="settings-sub-text" id="music-vol-label">${musicVol}%</span>
                    </div>
                    <button class="ui-toggle-btn-3d ${musicOn ? 'toggle-on' : 'toggle-off'}" id="music-toggle" onclick="handleSettingToggle('music')">
                        <span class="toggle-3d-face">${musicOn ? 'ON' : 'OFF'}</span>
                    </button>
                </div>
                <div class="slider-vault">
                    <input type="range" min="0" max="100" value="${musicVol}" class="premium-range-slider" id="music-slider" oninput="handleVolumeSlider('music', this.value)">
                </div>
            </div>

        </div>
    `;
    
    openOmniModal('Audio Settings', contentHTML);
}

// Global UI update handlers to tie directly into your audio controller
function handleSettingToggle(type) {
    if (typeof audioEngine === 'undefined') return;
    if (audioEngine.playClick) audioEngine.playClick();
    
    const btn = document.getElementById(`${type}-toggle`);
    const face = btn.querySelector('.toggle-3d-face');
    
    if (type === 'sfx') {
        audioEngine.sfxEnabled = !audioEngine.sfxEnabled;
        const state = audioEngine.sfxEnabled;
        btn.className = `ui-toggle-btn-3d ${state ? 'toggle-on' : 'toggle-off'}`;
        face.textContent = state ? 'ON' : 'OFF';
    } else {
        audioEngine.musicEnabled = !audioEngine.musicEnabled;
        const state = audioEngine.musicEnabled;
        btn.className = `ui-toggle-btn-3d ${state ? 'toggle-on' : 'toggle-off'}`;
        face.textContent = state ? 'ON' : 'OFF';
        if (audioEngine.updateMusicPlayback) audioEngine.updateMusicPlayback(); 
    }
}

function handleVolumeSlider(type, val) {
    document.getElementById(`${type}-vol-label`).textContent = `${val}%`;
    if (typeof audioEngine === 'undefined') return;
    
    const normVol = val / 100;
    if (type === 'sfx' && audioEngine.setSfxVolume) {
        audioEngine.setSfxVolume(normVol);
    } else if (type === 'music' && audioEngine.setMusicVolume) {
        audioEngine.setMusicVolume(normVol);
    }
}

function toggleAudioState() {
    if (typeof audioEngine !== 'undefined' && audioEngine.toggleSFX) {
        const isEnabled = audioEngine.toggleSFX();
        document.getElementById('sound-state-text').innerText = isEnabled ? "ON" : "OFF";
        const btn = document.getElementById('sound-toggle-btn');
        btn.innerText = isEnabled ? "Mute All Sounds" : "Turn Sounds ON";
        btn.style.background = isEnabled ? "#ff416c" : "#2ecc71";
    }
}

// ==========================================
// DAILY MISSION TIME ATTACK SYSTEM FUNCTIONS
// ==========================================

function initiateDailyMission() {
   // 1. Verify if the mission is locked for today
    const lastPlayed = localStorage.getItem('premiumDailyMissionLastPlayed');
    const today = new Date().toDateString();

    if (lastPlayed === today) {
        openOmniModal("Mission Locked 🔒", `
            <div style="text-align: center; padding: 20px;">
                <h1 style="font-size: 40px; margin-bottom: 10px;">⏳</h1>
                <h3 style="color: #ff416c; margin-bottom: 15px;">Access Denied</h3>
                <p style="color: #ccc; margin-bottom: 25px;">You have already completed today's time attack. The grid will reset tomorrow.</p>
                <button onclick="closeOmniModal();" 
                        style="padding: 12px 24px; border-radius: 8px; border: none; background: #333; color: white; cursor: pointer; font-weight: bold; width: 100%;">
                    Understood
                </button>
            </div>
        `);
        return; // Stops the game from loading
    }

    // 2. Prepare words and parameters
    if (typeof audioEngine !== 'undefined' && audioEngine.playClick) audioEngine.playClick();
    
    let shuffled = [...PREMIUM_DAILY_WORDS].sort(() => 0.5 - Math.random());
    let selectedWords = shuffled.slice(0, 4);
    
    let totalLetters = selectedWords.join('').length;
    let timeAllocated = 1160 + totalLetters;
    dailyMissionReward = totalLetters; 

    // 3. Show Rules Modal Instead of Instantly Launching
openOmniModal("", `
    <div style="background-color: #121721; height:100%; border-radius: 16px; padding: 24px 20px; border: 1px solid rgba(232, 185, 84, 0.4); box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 15px rgba(232, 185, 84, 0.15); color: #ffffff; text-align: center; font-family: system-ui, -apple-system, sans-serif; position: relative;">
        
        <h3 style="color: #E8B954; font-size: 20px; font-weight: 700; margin: 0 0 12px 0; display: flex; justify-content: center; align-items: center; gap: 8px;">
           Time Attack 
            <img src="./images/clock.png" style="width: 20px; height: 20px;" alt="clock">
        </h3>
        
        <p style="font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">
            Can you find all <span style="color: #E8B954;">${selectedWords.length}</span> hidden words before time runs out?
        </p>
        
        <p style="color: #94A3B8; font-size: 13px; margin: 0 0 20px 0;">
            No power-ups allowed—just pure focus and fast reflexes.
        </p>
        
        <div style="display: flex; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <span style="color: #94A3B8; font-size: 12px; margin-bottom: 6px;">Time Limit:</span>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 18px; font-weight: 700;">${timeAllocated} Sec</span>
                    <img src="./images/clock.png" style="height: 24px;" alt="clock">
                </div>
            </div>
            
            <div style="width: 1px; background: rgba(255, 255, 255, 0.1); margin: 0 10px;"></div>
            
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <span style="color: #E8B954; font-size: 12px; margin-bottom: 6px;">Reward:</span>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 18px; font-weight: 700; color: #E8B954;">${dailyMissionReward}</span>
                    <img src="./images/gold.png" style="height: 22px;" alt="coins">
                </div>
            </div>
            
        </div>

        <button onclick="startDailyMissionFlow('${selectedWords.join(',')}', ${timeAllocated})"
                style="background: linear-gradient(to bottom, #1c2a43, #0a111e); border: 2px solid #E8B954; border-radius: 28px; color: #ffffff; font-size: 15px; font-weight: 600; padding: 12px 32px; cursor: pointer; box-shadow: 0 0 20px rgba(232, 185, 84, 0.25); transition: all 0.2s ease;">
            Start Challenge
        </button>
        
    </div>
`);
}

    window.startDailyMissionFlow = function(wordsString, timeLimit) {
    if (typeof audioEngine !== 'undefined') {
        if (audioEngine.init) audioEngine.init(); // Wakes up the engine for the grid
        if (audioEngine.playClick) audioEngine.playClick();
    }
    
    // Dismiss the explanation modal
    closeOmniModal();

    // Hide the master dashboard/omni screen exactly like bootGameFromOmni() does
    const dashboard = document.getElementById('omni-start-screen');
    if (dashboard) {
        dashboard.style.opacity = '0';
        setTimeout(() => {
            dashboard.classList.remove('active');
            dashboard.style.display = 'none'; 
            
            setupInteraction(); 
            launchDailyMissionBoard(wordsString, timeLimit);
        }, 400); 
    } else {
        launchDailyMissionBoard(wordsString, timeLimit);
    }
};

function launchDailyMissionBoard(wordsString, timeLimit) {
    isDailyMissionActive = true;
    dailyMissionTimeLeft = timeLimit;
    
    // Play a sound when the grid actively deploys
    if (typeof audioEngine !== 'undefined' && audioEngine.playClick) {
        audioEngine.playClick();
    }
    
    let selectedWords = wordsString.split(',');
    activeWords = selectedWords.map((w, i) => ({
        word: w,
        color: COLORS[i % COLORS.length]
    }));
    
    gridSize = 10; 
    foundWords.clear();
    wordPlacements = {};
    extraWordsPlaced = [];
    savedHighlightsData = [];

    // Setup UI for Mission
    if (levelLabelEl) levelLabelEl.style.display = 'none'; // Hide "Level "
    levelEl.innerHTML = "<span style='color: var(--gold); text-shadow: 0 0 8px rgba(236, 217, 175, 0.1);'>MISSION</span>";
    categoryEl.textContent = "Time Attack Mode";
    boardEl.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    highlightsEl.innerHTML = '';
    
    // Lock Powerups and Repeat via CSS class
    if (btnHint) btnHint.classList.add('locked-btn');
    if (btnWand) btnWand.classList.add('locked-btn');
    if (btnRepeat) btnRepeat.classList.add('locked-btn');

    generateGrid();
    renderWordList();
    renderGrid();
    
    startDailyMissionTimer();
}

function startDailyMissionTimer() {
    const missionTimerContainer = document.getElementById('mission-timer');
    
    // 1. Hide the power-up buttons since they are disabled anyway
    if (btnHint) btnHint.style.display = 'none';
    if (btnWand) btnWand.style.display = 'none';

    // 2. Create or grab the timer display and append it to the group
    let timerDisplay = document.getElementById('mission-timer-display');
    if (!timerDisplay) {
        timerDisplay = document.createElement('div');
        timerDisplay.id = 'mission-timer-display';
        missionTimerContainer.appendChild(timerDisplay);
    }
    
    // 3. Apply Premium Studio Styling
    timerDisplay.style.cssText = `
        display: flex; 
        align-items: center; 
        justify-content: center; 
        gap: 8px; 
        font-size: 20px; 
        font-weight: 900; 
        color: #E8B954; 
        background: linear-gradient(135deg, rgba(28, 42, 67, 0.95) 0%, rgba(10, 17, 30, 0.98) 100%); 
        padding: 8px 20px; 
        border-radius: 24px; 
        border: 1px solid rgba(232, 185, 84, 0.5); 
        box-shadow: 0 4px 15px rgba(232, 185, 84, 0.2), inset 0 2px 5px rgba(255,255,255,0.1); 
        text-shadow: 0 2px 4px rgba(0,0,0,0.5); 
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        min-width: 110px;
    `;
    timerDisplay.style.display = 'flex';
    
    // 4. Initial Content (Clock Icon + Seconds)
    const updateTimerUI = () => {
        timerDisplay.innerHTML = `
            <img src="./images/clock.png" style="width: 22px; height: 22px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));" alt="clock"> 
            <span>${dailyMissionTimeLeft}s</span>
        `;
    };
    
    updateTimerUI();

    // 5. Start the Engine Loop
    if(dailyMissionTimerId) clearInterval(dailyMissionTimerId);
    dailyMissionTimerId = setInterval(() => {
        dailyMissionTimeLeft--;
        updateTimerUI();
        
        // Premium Danger State (Under 10 seconds)
        if (dailyMissionTimeLeft <= 10) {
            timerDisplay.style.background = "linear-gradient(135deg, rgba(255, 65, 108, 0.95) 0%, rgba(211, 47, 47, 0.98) 100%)";
            timerDisplay.style.color = "#ffffff";
            timerDisplay.style.borderColor = "rgba(255, 255, 255, 0.6)";
            timerDisplay.style.boxShadow = "0 6px 20px rgba(255, 65, 108, 0.5), inset 0 2px 5px rgba(255,255,255,0.3)";
            timerDisplay.style.transform = dailyMissionTimeLeft % 2 === 0 ? "scale(1.06)" : "scale(0.96)";
            
            // Trigger the tick sound
            if (typeof audioEngine !== 'undefined') {
                if (audioEngine.playTick) audioEngine.playTick();
                else if (audioEngine.playClick) audioEngine.playClick();
            }
        }
        
        if (dailyMissionTimeLeft <= 0) failDailyMission();
    }, 1000);
}

    function openRewardsModal() {
    // Play sound if you have audio engine enabled
    if (typeof audioEngine !== 'undefined') audioEngine.playClick();
    document.getElementById('premium-rewards-modal').classList.add('active');
}

function closeRewardsModal() {
    document.getElementById('premium-rewards-modal').classList.remove('active');
}

function failDailyMission() {
    clearInterval(dailyMissionTimerId);
    resetMissionState();
    
    // Add lock here
    lockDailyMission(); 

    // Play a failure sound when time runs out
    if (typeof audioEngine !== 'undefined') {
        if (audioEngine.playFail) audioEngine.playFail(); // Use this if you have a fail sound
        else if (audioEngine.playClick) audioEngine.playClick(); // Fallback
    }

    openOmniModal("Mission Failed", `
        <div style="text-align: center; padding: 20px;">
            <h1 style="font-size: 40px; margin-bottom: 10px;">⏳</h1>
            <h3 style="color: #ff416c; margin-bottom: 15px;">Time Expired!</h3>
            <p style="color: #ccc; margin-bottom: 25px;">The grid locked down before you could extract all the targets.</p>
            <button onclick="closeOmniModal(); loadLevel(currentLevelIdx);" 
                    style="padding: 12px 24px; border-radius: 8px; border: none; background: #333; color: white; cursor: pointer; font-weight: bold; width: 100%;">
                Return to Campaign
            </button>
        </div>
    `);
}

function winDailyMission() {
    clearInterval(dailyMissionTimerId);
    resetMissionState();
    
    // Add lock here
    lockDailyMission(); 

    // Reward Economics
    coins += dailyMissionReward;
    updateEconomyUI();
    saveGameDaily()

    if (typeof audioEngine !== 'undefined' && audioEngine.playWin) audioEngine.playWin();
    if (typeof initPremiumConfettiEngine === 'function') initPremiumConfettiEngineDaily();
    if (typeof executeCoinFountainCascade === 'function') executeCoinFountainCascade(() => {});

    openOmniModal("Extraction Complete! 🏆", `
        <div style="text-align: center; padding: 20px;">
            <h3 style="color: var(--gold, #f4c053);">Flawless Execution!</h3>
            <p style="color: #ccc; margin-top: 10px;">You cleared the grid with <strong>${dailyMissionTimeLeft} seconds</strong> remaining!</p>
            <div style="background: rgba(46, 204, 113, 0.1); border: 1px solid #2ecc71; border-radius: 12px; padding: 15px; margin: 20px 0;">
                <span style="color: #a0aec0; font-size: 14px;">Bounty Secured</span>
                <h2 style="color: #2ecc71; margin: 5px 0 0 0;">+${dailyMissionReward} Coins</h2>
            </div>
            <button class="btn-resume" onclick="returnToHomePage()">Resume Campaign</button>
        </div>
    `);
}

function resetMissionState() {
    isDailyMissionActive = false;
    
    // 1. Hide the timer element and reset its dynamic danger styles
    let timerDisplay = document.getElementById('mission-timer-display');
    if (timerDisplay) {
        timerDisplay.style.display = 'none';
        timerDisplay.style.transform = "scale(1)";
        timerDisplay.style.background = ""; // Clear danger background
        timerDisplay.style.color = "";
    }
    
    // 2. Unhide and unlock the power-up buttons
    if (btnHint) { 
        btnHint.style.display = 'flex'; // Restore normal flex layout
        btnHint.classList.remove('locked-btn'); 
        btnHint.style.opacity = ''; 
        btnHint.style.pointerEvents = ''; 
    }
    if (btnWand) { 
        btnWand.style.display = 'flex';
        btnWand.classList.remove('locked-btn'); 
        btnWand.style.opacity = ''; 
        btnWand.style.pointerEvents = ''; 
    }
    if (btnRepeat) { 
        btnRepeat.classList.remove('locked-btn'); 
        btnRepeat.style.opacity = ''; 
        btnRepeat.style.pointerEvents = ''; 
    }
}

function openDynamicStatsModal() {
    let totalStarsEarned = 0;
    Object.values(gameStats.levelStars).forEach(stars => {
        totalStarsEarned += stars;
    });
    
    let maxPossibleStars = LEVELS.length * 3; 
    let rankPercentage = Math.min(Math.round((totalStarsEarned / maxPossibleStars) * 100), 100);

    let totalMaxPotentialCoins = 0;
    LEVELS.forEach(lvl => {
        totalMaxPotentialCoins += (lvl.words.length * 25) + 500;
    });

    let avgTimeText = "0.0s";
    if (gameStats.totalWordsFound > 0) {
        avgTimeText = (gameStats.totalFindTimeSec / gameStats.totalWordsFound).toFixed(1) + "s";
    }

    let playerRank = "Novice Seeker";
    let rankSubtitle = "Beginning the lexical journey";
    let rankColor = "#a0aec0";
    let rankGlow = "rgba(160, 174, 192, 0.1)";
    
    if (rankPercentage >= 80) { 
        playerRank = "Grand Wordmaster"; 
        rankSubtitle = "Unrivaled linguistic supremacy";
        rankColor = "#f4c053"; 
        rankGlow = "rgba(244, 192, 83, 0.2)";
    } else if (rankPercentage >= 50) { 
        playerRank = "Elite Cryptographer"; 
        rankSubtitle = "Master of advanced spatial patterns";
        rankColor = "#9b51e0"; 
        rankGlow = "rgba(155, 81, 224, 0.15)";
    } else if (rankPercentage >= 20) { 
        playerRank = "Adept Cartographer"; 
        rankSubtitle = "Efficient matrix pathfinder";
        rankColor = "#4facfe"; 
        rankGlow = "rgba(79, 172, 254, 0.15)";
    }

    let levelStarsHTML = "";
    LEVELS.forEach((lvl, index) => {
        let starsEarned = gameStats.levelStars[index] || 0;
        let starString = "<span class='star-glow'>★</span>".repeat(starsEarned) + "<span class='star-dim'>★</span>".repeat(3 - starsEarned);
        let activeClass = index === currentLevelIdx ? "active-level" : (starsEarned === 0 ? "locked-level" : "cleared-level");
        
        levelStarsHTML += `
            <div class='premium-level-chip ${activeClass}'>
                <div class='lvl-badge'>${index + 1}</div>
                <div class='lvl-stars'>${starString}</div>
            </div>`;
    });

    openOmniModal('Player Statistics Profile', `
        <div class='premium-dashboard-wrapper' style="padding-top:20px;">
            <div class='premium-layout-grid'>
                
                <div class='premium-column'>
                    <div class='premium-rank-banner' style='--rank-color: ${rankColor}; --rank-glow: ${rankGlow};'>
                        <div class='rank-icon'>👑</div>
                        <div class='rank-info'>
                            <small>Global Standing</small>
                            <strong>${playerRank}</strong>
                            <span class='rank-subtitle'>${rankSubtitle}</span>
                        </div>
                        <div class='rank-score'>${rankPercentage}<small>%</small></div>
                    </div>

                    <div class='premium-section-header'>Performance Metrics</div>
                    <div class='premium-metrics-grid'>
                        <div class='premium-metric-card'>
                            <div class='metric-icon' style='background: rgba(79, 172, 254, 0.08); color: #4facfe;'>🔤</div>
                            <div class='metric-data'>
                                <span class='metric-value'>${gameStats.totalWordsFound.toLocaleString()}</span>
                                <span class='metric-label'>Words Uncovered</span>
                            </div>
                        </div>
                        <div class='premium-metric-card'>
                            <div class='metric-icon' style='background: rgba(244, 192, 83, 0.08); color: #f4c053;'>⏱️</div>
                            <div class='metric-data'>
                                <span class='metric-value'>${avgTimeText}</span>
                                <span class='metric-label'>Temporal Pace</span>
                            </div>
                        </div>
                        <div class='premium-metric-card'>
                            <div class='metric-icon' style='background: rgba(155, 81, 224, 0.08); color: #9b51e0;'>🎮</div>
                            <div class='metric-data'>
                                <span class='metric-value'>${gameStats.totalGamesPlayed.toLocaleString()}</span>
                                <span class='metric-label'>Grids Resolved</span>
                            </div>
                        </div>
                        <div class='premium-metric-card'>
                            <div class='metric-icon' style='background: rgba(255, 126, 95, 0.08); color: #ff7e5f;'>💡</div>
                            <div class='metric-data'>
                                <span class='metric-value'>${(gameStats.totalHintsUsed + gameStats.totalWandsUsed).toLocaleString()}</span>
                                <span class='metric-label'>Strategic Assists</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class='premium-column'>
                    <div class='premium-section-header'>Campaign Matrix Progression</div>
                    <div class='premium-levels-container'>
                        ${levelStarsHTML}
                    </div>

                    <div class='premium-section-header'>Treasury & Coin Reserves</div>
                    <div class='premium-eco-card'>
                        <div class='eco-stats-row'>
                            <div class='eco-stat'>
                                <small>Liquid Purse</small>
                                <span>${coins.toLocaleString()} <span class='coin-lbl'>🪙</span></span>
                            </div>
                            <div class='eco-stat text-right'>
                                <small>Campaign Capacity</small>
                                <span>${totalMaxPotentialCoins.toLocaleString()} <span class='coin-lbl'>🪙</span></span>
                            </div>
                        </div>
                        <div class='premium-progress-track'>
                            <div class='premium-progress-fill' style='width: 0%;' data-target='${rankPercentage}%'></div>
                        </div>
                        <div class='eco-completion-badge'>
                            Completed ${rankPercentage}% of the Campaign Map.
                        </div>
                    </div>
                </div>

            </div>
            
            <div class='premium-dashboard-footer'>
                <span class='footer-pulse'>●</span> Live gameplay telemetry processing active.
            </div>
        </div>
    `);

    setTimeout(() => {
        const fillBar = document.querySelector('.premium-progress-fill');
        if(fillBar) fillBar.style.width = fillBar.getAttribute('data-target');
    }, 75);
}

function openDailyMissionsModal() {
    if (typeof audioEngine !== 'undefined') {
        if (audioEngine.init) audioEngine.init();
        if (audioEngine.playClick) audioEngine.playClick();
    }
    
    let htmlContainerStr = `<div class="mission-ui-container">`;
    
    dailyMissions.forEach(m => {
        const progressRatio = Math.min((m.progress / m.target) * 100, 100);
        const isComplete = m.progress >= m.target;
        
        // Format the progress text
        let progressLabel = `${m.progress}/${m.target}`;
        if(m.id === 'internetTime') {
            const minsCurrent = Math.floor(m.progress / 60);
            const minsTarget = Math.floor(m.target / 60);
            progressLabel = minsCurrent >= 1 ? `${minsCurrent}m/${minsTarget}m` : `${m.progress}s/${m.target}s`;
        }

        // Determine Button State
        let buttonTextStr = m.claimed ? "Claimed" : "Claim";
        let buttonAttributes = (isComplete && !m.claimed) ? "" : "disabled";
        
        let btnClass = "btn-locked"; 
        if (isComplete && !m.claimed) btnClass = "btn-ready";
        if (m.claimed) btnClass = "btn-claimed";

        htmlContainerStr += `
            <div class="mission-ui-card">
                
                <div class="mission-center-col">
                    <div class="mission-ui-title">${m.text}</div>
                    <div class="mission-ui-track">
                        <div class="mission-ui-fill" style="width: ${progressRatio}%;"></div>
                        <div class="mission-ui-progress-text">${progressLabel}</div>
                    </div>
                </div>
                
              <div class="mission-right-col">
    <div class="mission-reward-vault">
        <div class="reward-vault-inner">
            <img src="./images/gold.png" alt="Coin" class="ui-coin-icon 3d-pop" />
            <span class="ui-reward-text">+${m.reward}</span>
        </div>
    </div>
    
    <button class="ui-mission-btn-3d ${btnClass}" ${buttonAttributes} onclick="claimMissionReward('${m.id}', this)">
        <span class="btn-3d-text">${buttonTextStr}</span>
    </button>
</div>
                
            </div>
        `;
    });

    htmlContainerStr += `</div>`;
    openOmniModal("Daily Missions", htmlContainerStr);
}

function claimMissionReward(missionId, elementButtonRef) {
    let activeTargetMission = dailyMissions.find(m => m.id === missionId);
    
    // Double check that it's actually complete and hasn't been double-claimed
    if (activeTargetMission && activeTargetMission.progress >= activeTargetMission.target && !activeTargetMission.claimed) {
        
        // 1. Mark as claimed
        activeTargetMission.claimed = true;
        
        // 2. Grant the specific reward amount from the array
        coins += activeTargetMission.reward;
        
        // 3. Update the UI and Save Data
        updateEconomyUI();
        if (isDailyMissionActive) saveGameDaily(); else saveGame();
        
        // 4. Lock the button so it can't be spammed
        elementButtonRef.textContent = "Claimed";
        elementButtonRef.disabled = true;
        
        // 5. Trigger sound and visual coin fountain
        if (typeof audioEngine !== 'undefined' && audioEngine.playClick) audioEngine.playClick();
        spawnFloatingCoins(elementButtonRef.parentElement, 15);
        
        // 6. Refresh the modal to update progress bars
        setTimeout(() => {
            openDailyMissionsModal();
        }, 600);
    }
}

function openMoreGamesModal() {
    if (typeof audioEngine !== 'undefined' && audioEngine.playClick) audioEngine.playClick();
    

    // 1. Dynamic Game Data Config
const premiumGames = [
    {
        id: 'matrix-2048',
        title: '2028 Matrix',
        subtitle: 'Strategic number fusion',
        url: './otherGames/2048.html',
        image: './images/2048.png',
        fallbackGradient: 'linear-gradient(135deg, #ff416c, #d32f2f)',
        glowColor: 'rgba(211, 47, 47, 0.4)'
    },
    {
        id: 'lexa',
        title: 'Lexa',
        subtitle: 'Advanced word anagrams',
        url: './otherGames/lexa.html',
        image: './images/echo.png',
        fallbackGradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
        glowColor: 'rgba(79, 172, 254, 0.4)'
    },
    {
        id: 'quizz',
        title: 'Quizz Master',
        subtitle: 'Global trivia championship',
        url: './otherGames/quizz.html',
        image: './images/quiz.png',
        fallbackGradient: 'linear-gradient(135deg, #9b51e0, #6f42c1)',
        glowColor: 'rgba(155, 81, 224, 0.4)'
    }
];

// 2. Dynamic HTML Generator
const renderGameCards = () => {
    return premiumGames.map(game => `
        <a href="${game.url}" class="premium-game-card" style="--glow-color: ${game.glowColor};">
            <div class="pgc-icon" style="background: ${game.fallbackGradient};">
                <img src="${game.image}" alt="${game.title}" class="pgc-img" onerror="this.style.display='none'" />
            </div>
            <div class="pgc-content">
                <h4>${game.title}</h4>
                <p>${game.subtitle}</p>
            </div>
            <div class="pgc-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
            </div>
        </a>
    `).join('');
};

// 3. Complete Template String
const gamesHtml = `
    <div class="pgc-container">
        <p class="pgc-header">
            Expand your library
        </p>

        <div class="pgc-list">
            ${renderGameCards()}
        </div>
    </div>

    <style>
        /* Responsive Container & Custom Scrollbar */
        .pgc-container {
            display: flex;
            flex-direction: column;
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
        }

        .pgc-header {
            color: #a0aec0;
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            padding-left: 4px;
        }

        .pgc-list {
            display: flex;
            flex-direction: column;
            gap: 14px;
            max-height: 420px;
            overflow-y: auto;
            padding: 4px;
            /* Custom Smooth Scrollbar */
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }

        .pgc-list::-webkit-scrollbar {
            width: 6px;
        }
        .pgc-list::-webkit-scrollbar-track {
            background: transparent;
        }
        .pgc-list::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
        }
        .pgc-list::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.4);
        }

        /* Premium Game Card Layout */
        .premium-game-card {
            text-decoration: none;
            display: flex;
            align-items: center;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 18px;
            padding: 14px 16px;
            box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.1), 0 8px 20px rgba(0, 0, 0, 0.2);
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            overflow: hidden;
        }

        /* Subtle Dynamic Glow on Card Edge */
        .premium-game-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 4px;
            height: 100%;
            background: var(--glow-color, #ffffff);
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        /* Avatar Thumbnail & Image Handling */
        .premium-game-card .pgc-icon {
            width: 56px;
            height: 56px;
            border-radius: 14px;
            display: flex;
            justify-content: center;
            align-items: center;
            margin-right: 16px;
            flex-shrink: 0;
            box-shadow: 0 6px 14px var(--glow-color, rgba(0,0,0,0.3));
            position: relative;
            overflow: hidden;
        }

        .premium-game-card .pgc-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: inherit;
            transition: transform 0.4s ease;
        }

        /* Text Content */
        .premium-game-card .pgc-content {
            flex-grow: 1;
            text-align: left;
            min-width: 0; /* Ensures text truncation works on small screens */
        }
        
        .premium-game-card .pgc-content h4 {
            margin: 0;
            color: #ffffff;
            font-size: 16px;
            font-weight: 800;
            letter-spacing: 0.5px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .premium-game-card .pgc-content p {
            margin: 4px 0 0 0;
            color: #8fa8aa;
            font-size: 13px;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        /* Call to Action Arrow */
        .premium-game-card .pgc-arrow {
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.08);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            color: var(--gold, #f4c053);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-left: 12px;
            transition: transform 0.3s ease, background 0.3s ease, border-color 0.3s ease;
        }

        /* Hover & Active Physics */
        .premium-game-card:hover {
            transform: translateY(-4px) scale(1.01);
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.04) 100%);
            border-color: rgba(255, 255, 255, 0.25);
            box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.2), 0 14px 28px rgba(0, 0, 0, 0.35);
        }
        
        .premium-game-card:hover::before {
            opacity: 1;
        }

        .premium-game-card:hover .pgc-img {
            transform: scale(1.12);
        }

        .premium-game-card:hover .pgc-arrow {
            background: rgba(244, 192, 83, 0.15);
            border-color: rgba(244, 192, 83, 0.4);
            transform: translateX(4px) scale(1.08);
        }

        .premium-game-card:active {
            transform: translateY(0px) scale(0.99);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }

        /* Responsive Breakpoints for Mobile */
        @media (max-width: 480px) {
            .premium-game-card {
                padding: 12px;
                border-radius: 14px;
            }
            .premium-game-card .pgc-icon {
                width: 48px;
                height: 48px;
                margin-right: 12px;
            }
            .premium-game-card .pgc-content h4 {
                font-size: 15px;
            }
            .premium-game-card .pgc-content p {
                font-size: 12px;
            }
            .premium-game-card .pgc-arrow {
                width: 34px;
                height: 34px;
            }
        }
    </style>
`;
    openOmniModal('Premium Arcade', gamesHtml);
}
// Locks the mission by saving today's date string to local storage
function lockDailyMission() {
    const today = new Date().toDateString(); // e.g., "Fri Jul 10 2026"
    localStorage.setItem('premiumDailyMissionLastPlayed', today);
}

// Unique list of all game assets to preload
const PRELOAD_IMAGES = [
    'images/nature.png',   // Core background image
    'images/coin.png',     // Floating animations & button economy
    'images/coins.png',    // 500-coin bonus graphic
    'images/camera.png',   // Ad power-up buttons
    'images/clock.png',    // Time Attack mission UI
    'images/gold.png'      // Daily Mission reward icons
];

/**
 * Preloads all essential image assets into the browser cache
 * to prevent delay, blank elements, or stuttering during active gameplay.
 */
function preloadGameAssets(callback) {
    let loadedCount = 0;
    const totalAssets = PRELOAD_IMAGES.length;

    if (totalAssets === 0) {
        if (callback) callback();
        return;
    }

    console.log("Preloading game assets...");

    PRELOAD_IMAGES.forEach(src => {
        const img = new Image();
        
        // Move forward whether the image loads successfully or encounters an error
        img.onload = () => {
            loadedCount++;
            if (loadedCount === totalAssets) {
                console.log("All game assets preloaded successfully!");
                if (callback) callback();
            }
        };
        
        img.onerror = () => {
            console.warn(`Failed to preload image: ${src}`);
            loadedCount++;
            if (loadedCount === totalAssets) {
                console.log("Preloader complete (with warning/s).");
                if (callback) callback();
            }
        };

        img.src = src;
    });
}

// Global high-speed caching memory bank for instantaneous UI injection
let cachedLeaderboardData = null;

async function preloadGlobalLeaderboard() {
    try {
        return await new Promise((resolve) => {
            setTimeout(() => {
                const synchronizedMockup = [
                    { name: "AlphaSeeker", score: 28400, rank: 1, current: false },
                    { name: "LexicConqueror", score: 24200, rank: 2, current: false },
                    { name: "MatrixKing", score: 21950, rank: 3, current: false },
                    { name: "Player_You", score: score || 16500, rank: 4, current: true },
                    { name: "CrypticPro", score: 14100, rank: 5, current: false }
                ];
                
                cachedLeaderboardData = synchronizedMockup;
                resolve(true);
            }, 1400); 
        });
    } catch (error) {
        console.error("Leaderboard network gateway error:", error);
        return false;
    }
}

function deployPremiumAppPipeline() {
    // 1. First, boot your dashboard logic in the background
    bootOmniDashboard(); 
    
    const progressFill = document.getElementById('premium-progress-fluid');
    const statusLabel = document.getElementById('loading-status-text');
    const systemOverlay = document.getElementById('premium-loading-overlay');
    
    let graphicsSystemReady = false;
    let dataStreamReady = false;
    
    function evaluateSystemStatus() {
        if (graphicsSystemReady && dataStreamReady) {
            if (progressFill) progressFill.style.width = "100%";
            if (statusLabel) statusLabel.textContent = "Data Handshake Verified";
            
            setTimeout(() => {
                if (systemOverlay) {
                    systemOverlay.classList.add('fade-out-complete');
                    setTimeout(() => systemOverlay.remove(), 500);
                }
            }, 400);
        }
    }
    
    if (statusLabel) statusLabel.textContent = "Preloading Media Elements...";
    
    // Utilize your existing preloader
    if (typeof preloadGameAssets === 'function') {
        preloadGameAssets(() => {
            graphicsSystemReady = true;
            if (progressFill) progressFill.style.width = "50%";
            if (statusLabel) statusLabel.textContent = "Connecting Secure Lead Services...";
            evaluateSystemStatus();
        });
    }
    
    preloadGlobalLeaderboard().then(() => {
        dataStreamReady = true;
        if (graphicsSystemReady && progressFill) progressFill.style.width = "90%";
        evaluateSystemStatus();
    });
}

// Start the sequence when the DOM is ready
window.addEventListener('DOMContentLoaded', deployPremiumAppPipeline);

function returnToHomePage() {
    window.location.href = 'index.html'; 
}



// NOTE: We removed the standalone bootOmniDashboard() call from here 
// because it is now safely triggered inside deployPremiumAppPipeline()

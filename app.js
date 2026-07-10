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
let coins = 350;
let lastHoveredCell = null; 

// Level Rewind Anti-Farming Safeguards
let levelStartScore = 0;
let levelStartCoins = 350;

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
let dailyMissions = [
    { id: 'extraWords', text: 'Find 20 Extra Words', target: 20, progress: 0, reward: 200, claimed: false },
    { id: 'speedRun', text: 'Finish a Level Under 2 Mins', target: 1, progress: 0, reward: 150, claimed: false },
    { id: 'complete10', text: 'Complete 10 Levels', target: 10, progress: 0, reward: 150, claimed: false },
    { id: 'noPowerups', text: 'Finish Level Without Power-ups', target: 1, progress: 0, reward: 100, claimed: false },
    { id: 'complete20', text: 'Complete 20 Levels', target: 20, progress: 0, reward: 250, claimed: false },
    { id: 'complete50', text: 'Complete 50 Levels', target: 50, progress: 0, reward: 1000, claimed: false },
    { id: 'watchAds', text: 'Watch 5 Dynamic Ad Clips', target: 5, progress: 0, reward: 1000, claimed: false },
    { id: 'internetTime', text: 'Stay Online for 5 Minutes', target: 300, progress: 0, reward: 300, claimed: false } // 300 secs = 5 mins
];

// DOM Target Nodes
const boardEl = document.getElementById('board');
const highlightsEl = document.getElementById('highlights');
const wordListEl = document.getElementById('word-list');
const scoreEl = document.getElementById('score-val');
const coinsEl = document.getElementById('coins-val');
const levelEl = document.getElementById('level-val');
const categoryEl = document.getElementById('category-text');
const btnHint = document.getElementById('btn-hint');
const btnWand = document.getElementById('btn-wand');
const btnRepeat = document.querySelector('.btn-reload');

const overlayEl = document.getElementById('level-complete-overlay');
const overlayBaseScoreEl = document.getElementById('overlay-base-score');
const overlayExtraCountEl = document.getElementById('overlay-extra-count');
const overlayBonusRewardEl = document.getElementById('overlay-bonus-reward');

// === INTERNET NETWORK DURATION MONITOR TRACKING LOOP ===
setInterval(() => {
    if (navigator.onLine) {
        let netMission = dailyMissions.find(m => m.id === 'internetTime');
        if (netMission && !netMission.claimed && netMission.progress < netMission.target) {
            netMission.progress++;
            if (netMission.progress % 15 === 0) { // Save every 15 seconds to prevent excessive writes
                saveGame();
            }
        }
    }
}, 1000);

// === SAVE / LOAD SYSTEM ===

function saveGame() {
    const gameState = {
        currentLevelIdx: currentLevelIdx,
        score: score,
        coins: coins,
        levelStartScore: levelStartScore,
        levelStartCoins: levelStartCoins,
        grid: grid,
        wordPlacements: wordPlacements,
        foundWords: Array.from(foundWords),
        extraWordsPlaced: extraWordsPlaced,
        extraWordsFound: Array.from(extraWordsFound),
        savedHighlightsData: savedHighlightsData,
        activeLevelTimeElapsed: activeLevelTimeElapsed,
        usedPowerupOnActiveLevel: usedPowerupOnActiveLevel,
        dailyMissions: dailyMissions
    };
    localStorage.setItem('premiumWordSearchSave', JSON.stringify(gameState));
}

function loadSavedGame() {
    const saved = localStorage.getItem('premiumWordSearchSave');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            
            currentLevelIdx = state.currentLevelIdx;
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
    const saved = localStorage.getItem('premiumWordSearchSave');
    if (saved) {
        document.getElementById('omni-play-text').textContent = "Resume Journey";
    }
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
        if (loadSavedGame()) {
            restoreLevel();
            startLevelProcessingClock();
        } else {
            loadLevel(0);
        }
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
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if(target && target.classList.contains('letter-cell')) handlePointerDown({target});
    }, {passive: false});
    
    boardEl.addEventListener('touchmove', (e) => {
        e.preventDefault(); 
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
        saveGame();

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
        saveGame();
        
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
        saveGame(); 
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
    saveGame();

    if (powerupType === 'hint') {
        executeHint(true); 
    } else if (powerupType === 'wand') {
        executeWand(true); 
    }
}

function updateEconomyUI() {
    scoreEl.textContent = score;
    coinsEl.textContent = coins;
    
    const hintCost = document.querySelector('#btn-hint .cost');
    if (coins < 50) {
        hintCost.innerHTML = '🎥 Ad';
        hintCost.style.background = 'linear-gradient(135deg, #a8ff78, #78ffd6)';
        hintCost.style.color = '#000';
    } else {
        hintCost.innerHTML = '50 <img src="images/coin.png">';
        hintCost.style.background = 'linear-gradient(135deg, #ff416c, #d32f2f)';
        hintCost.style.color = '#ffffff';
    }

    const wandCost = document.querySelector('#btn-wand .cost');
    if (coins < 150) {
        wandCost.innerHTML = '🎥 Ad';
        wandCost.style.background = 'linear-gradient(135deg, #a8ff78, #78ffd6)';
        wandCost.style.color = '#000';
    } else {
        wandCost.innerHTML = '150 <img src="images/coin.png">';
        wandCost.style.background = 'linear-gradient(135deg, #ff416c, #d32f2f)';
        wandCost.style.color = '#ffffff';
    }
}
    
let confettiAnimationId = null;
let holdsBonusRewardState = false;

function showLevelComplete() {
    if(levelTimerEngineInterval) clearInterval(levelTimerEngineInterval);
    if (typeof audioEngine !== 'undefined' && audioEngine.playWin) audioEngine.playWin(); 

    // ==========================================
    // WIRING: VALIDATE LEVEL MISSIONS METRICS
    // ==========================================
    if (activeLevelTimeElapsed <= 120) {
        let speedMission = dailyMissions.find(m => m.id === 'speedRun');
        if (speedMission && speedMission.progress < speedMission.target) {
            speedMission.progress = 1;
        }
    }
    if (!usedPowerupOnActiveLevel) {
        let pureMission = dailyMissions.find(m => m.id === 'noPowerups');
        if (pureMission && pureMission.progress < pureMission.target) {
            pureMission.progress = 1;
        }
    }
    let m10 = dailyMissions.find(m => m.id === 'complete10');
    if(m10 && m10.progress < m10.target) m10.progress++;
    let m20 = dailyMissions.find(m => m.id === 'complete20');
    if(m20 && m20.progress < m20.target) m20.progress++;
    let m50 = dailyMissions.find(m => m.id === 'complete50');
    if(m50 && m50.progress < m50.target) m50.progress++;

    saveGame();

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
        
        saveGame();
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
    
    const stateText = (typeof audioEngine !== 'undefined' && audioEngine.sfxEnabled) ? "ON" : "OFF";
    const btnColor = (typeof audioEngine !== 'undefined' && audioEngine.sfxEnabled) ? "#ff416c" : "#2ecc71";
    const btnText = (typeof audioEngine !== 'undefined' && audioEngine.sfxEnabled) ? "Mute All Sounds" : "Turn Sounds ON";

    const contentHTML = `
        <div style="font-size: 16px; margin-bottom: 20px;">
            Premium Sound FX: <strong id="sound-state-text" style="color: var(--theme-text);">${stateText}</strong>
        </div>
        <button onclick="toggleAudioState()" style="
            width: 100%; padding: 16px; border-radius: 14px; 
            border: none; background: ${btnColor}; color: white; 
            font-weight: 800; font-size: 16px; cursor: pointer;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15); transition: background 0.3s;
        " id="sound-toggle-btn">${btnText}</button>
    `;
    
    openOmniModal('Audio Settings', contentHTML);
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
    openOmniModal("Daily Challenge: Time Attack ⏱️", `
        <div style="text-align: center; padding: 10px;">
            <h3 style="color: #ff416c; margin-bottom: 15px;">The Clock is Ticking!</h3>
            <p style="color: #7a9c9f; font-size: 14px; margin-bottom: 20px;">
                Find all <strong>${selectedWords.length}</strong> targets before the grid locks down. <br>
                Power-ups are disabled. Quick reflexes are required!
            </p>
            <div style="display: flex; justify-content: space-around; background: rgba(0,0,0,0.03); border-radius: 12px; padding: 10px; margin-bottom: 20px;">
                <div>
                    <span style="display: block; font-size: 11px; text-transform: uppercase; color: #a0aec0; font-weight: 800;">Time Limit</span>
                    <span style="font-size: 16px; font-weight: 900; color: var(--theme-text);">${timeAllocated}s</span>
                </div>
                <div>
                    <span style="display: block; font-size: 11px; text-transform: uppercase; color: #a0aec0; font-weight: 800;">Bounty Reward</span>
                    <span style="font-size: 16px; font-weight: 900; color: #f4c053;">${dailyMissionReward} Coins</span>
                </div>
            </div>
            <button onclick="startDailyMissionFlow('${selectedWords.join(',')}', ${timeAllocated})"
                    style="padding: 14px 24px; border-radius: 12px; border: none; background: linear-gradient(135deg, #ff416c, #ff4b2b); color: white; font-weight: bold; font-size: 16px; cursor: pointer; width: 100%; box-shadow: 0 4px 15px rgba(255, 65, 108, 0.4);">
                Start Extraction!
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
    levelEl.innerHTML = "<span style='color: var(--gold); text-shadow: 0 0 8px rgba(244,192,83,0.5);'>MISSION</span>";
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
    let timerDisplay = document.getElementById('mission-timer-display');
    if (!timerDisplay) {
        timerDisplay = document.createElement('div');
        timerDisplay.id = 'mission-timer-display';
        timerDisplay.style = "font-size: 18px; font-weight: 900; color: #ff416c; text-align: center; margin: 10px 0; background: rgba(255, 65, 108, 0.1); padding: 8px; border-radius: 8px; border: 1px solid rgba(255, 65, 108, 0.3);";
        categoryEl.parentElement.insertAdjacentElement('afterend', timerDisplay);
    }
    
    timerDisplay.style.display = 'block';
    timerDisplay.textContent = `⏱️ CLOCK: ${dailyMissionTimeLeft}s`;

    if(dailyMissionTimerId) clearInterval(dailyMissionTimerId);
    dailyMissionTimerId = setInterval(() => {
        dailyMissionTimeLeft--;
        timerDisplay.textContent = `⏱️ CLOCK: ${dailyMissionTimeLeft}s`;
        
        // Pulse red and play a tick sound when under 10 seconds
        if (dailyMissionTimeLeft <= 10) {
            timerDisplay.style.background = "rgba(255, 0, 0, 0.2)";
            timerDisplay.style.transform = dailyMissionTimeLeft % 2 === 0 ? "scale(1.02)" : "scale(0.98)";
            
            // Trigger the tick sound (Fallback to playClick if you don't have a dedicated playTick)
            if (typeof audioEngine !== 'undefined') {
                if (audioEngine.playTick) audioEngine.playTick();
                else if (audioEngine.playClick) audioEngine.playClick();
            }
        }
        
        if (dailyMissionTimeLeft <= 0) failDailyMission();
    }, 1000);
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
    saveGame();

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

<button class="btn-got-it" onclick="returnToHomePage()">Got It</button>
        </div>
    `);
}

function resetMissionState() {
    isDailyMissionActive = false;
    document.getElementById('mission-timer-display').style.display = 'none';
    document.getElementById('mission-timer-display').style.transform = "scale(1)";
    
    // Remove the CSS lock to re-enable everything
    if (btnHint) btnHint.classList.remove('locked-btn');
    if (btnWand) btnWand.classList.remove('locked-btn');
    if (btnRepeat) btnRepeat.classList.remove('locked-btn');

    // (Optional: Clean up any old inline styles just in case they are stuck from earlier attempts)
    if (btnHint) { btnHint.style.opacity = ''; btnHint.style.pointerEvents = ''; }
    if (btnWand) { btnWand.style.opacity = ''; btnWand.style.pointerEvents = ''; }
    if (btnRepeat) { btnRepeat.style.opacity = ''; btnRepeat.style.pointerEvents = ''; }
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
    // 2. Prepare words and parameters
    if (typeof audioEngine !== 'undefined') {
        if (audioEngine.init) audioEngine.init(); // This wakes up the audio engine
        if (audioEngine.playClick) audioEngine.playClick();
    }
    
    let htmlContainerStr = `<div class="premium-mission-container">`;
    
    dailyMissions.forEach(m => {
        const progressRatio = Math.min((m.progress / m.target) * 100, 100);
        const isComplete = m.progress >= m.target;
        
        let progressLabel = `${m.progress} / ${m.target}`;
        if(m.id === 'internetTime') {
            const minsCurrent = Math.floor(m.progress / 60);
            const minsTarget = Math.floor(m.target / 60);
            progressLabel = minsCurrent >= 1 ? `${minsCurrent}m / ${minsTarget}m` : `${m.progress}s / ${m.target}s`;
        }

        let buttonTextStr = m.claimed ? "Claimed" : "Claim Reward";
        let buttonAttributes = (isComplete && !m.claimed) ? "" : "disabled";

        htmlContainerStr += `
            <div class="premium-mission-card">
                <div class="mission-meta-row">
                    <span class="mission-title-text">${m.text}</span>
                    <span class="mission-reward-pill">🪙 ${m.reward}</span>
                </div>
                <div class="mission-rail">
                    <div class="mission-fluid" style="width: ${progressRatio}%;"></div>
                </div>
                <div class="mission-action-row">
                    <span>Progress: ${progressLabel}</span>
                    <button class="btn-claim-mission" ${buttonAttributes} onclick="claimMissionReward('${m.id}', this)">${buttonTextStr}</button>
                </div>
            </div>
        `;
    });

    htmlContainerStr += `</div>`;
    openOmniModal("🎯 Daily Missions", htmlContainerStr);
}

function claimMissionReward(missionId, elementButtonRef) {
    let activeTargetMission = dailyMissions.find(m => m.id === missionId);
    if (activeTargetMission && activeTargetMission.progress >= activeTargetMission.target && !activeTargetMission.claimed) {
        activeTargetMission.claimed = true;
        coins += activeTargetMission.reward;
        updateEconomyUI();
        saveGame();
        
        elementButtonRef.textContent = "Claimed";
        elementButtonRef.disabled = true;
        
        if (typeof audioEngine !== 'undefined' && audioEngine.playClick) audioEngine.playClick();
        spawnFloatingCoins(elementButtonRef.parentElement, 15);
        
        setTimeout(() => {
            openDailyMissionsModal();
        }, 600);
    }
}

// Locks the mission by saving today's date string to local storage
function lockDailyMission() {
    const today = new Date().toDateString(); // e.g., "Fri Jul 10 2026"
    localStorage.setItem('premiumDailyMissionLastPlayed', today);
}


function returnToHomePage() {
    // OPTION A: If your home page is a completely separate HTML file
    // Use this to redirect the browser. Update 'index.html' if your home page is named differently.
    window.location.href = 'index.html'; 


    /*
    // 1. Hide the success overlay
    document.getElementById('success-overlay').style.display = 'none';
    
    // 2. Hide the confetti canvas (if you are using the premium confetti engine)
    const confettiCanvas = document.getElementById('premium-confetti-canvas');
    if (confettiCanvas) confettiCanvas.style.display = 'none';
    
    // 3. Show the home/main menu container
    document.getElementById('home-menu-container').style.display = 'block';
    */
}

bootOmniDashboard();
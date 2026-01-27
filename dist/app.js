// =============================================================================
// MANDARIN QUEST - Standalone Game Engine with Centralized State Management
// Architecture: Single-Page Application (SPA) with Clean View Switching
// =============================================================================

// =============================================================================
// GLOBAL STATE: The "Single Source of Truth"
// =============================================================================

const STORAGE_KEY = 'mandarin_quest_progress';

const APP_STATE = {
    currentView: null,             // 'bookshelf' or 'lesson' (null at boot to force first render)
    allLessons: [],                // Cached lesson data from data.json
    currentLesson: null,           // Active lesson object
    currentPage: 0,                // Story page index (0-based)
    totalPages: 0,                 // Total pages in story
    charProgress: {},              // Character hunt progress: { char: { found, total }}
    hintsRemaining: 0,             // Hint system: calculated as 15% of total seek chars
    maxHints: 0                    // Maximum hints available for current lesson
};

// =============================================================================
// 1. INIT: Bootstrap Application
// =============================================================================

/**
 * Initialize the application - called once on DOMContentLoaded
 */
async function initApp() {
    try {
        const response = await fetch('data.json?v=' + Date.now());
        if (!response.ok) {
            throw new Error(`Failed to load data.json: ${response.status}`);
        }
        
        APP_STATE.allLessons = await response.json();
        
        // Verify data integrity
        if (APP_STATE.allLessons.length === 0) {
            throw new Error('No lessons loaded from data.json');
        }
        
        // Render initial view
        switchView('bookshelf');
    } catch (error) {
        
        // Show friendly error to user
        const container = document.getElementById('app-container');
        container.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 20px;
                text-align: center;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                font-family: 'Noto Sans SC', sans-serif;
            ">
                <div style="font-size: 5rem; margin-bottom: 20px;">📜</div>
                <h1 style="font-size: 2rem; margin-bottom: 10px;">糟糕！卷轴丢失了...</h1>
                <p style="font-size: 1.2rem; margin-bottom: 30px; opacity: 0.9;">Oops! The scrolls are lost.</p>
                <button onclick="location.reload()" style="
                    padding: 15px 40px;
                    font-size: 1.2rem;
                    background: white;
                    color: #667eea;
                    border: none;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: bold;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    transition: transform 0.2s;
                "
                onmouseover="this.style.transform='scale(1.05)'"
                onmouseout="this.style.transform='scale(1)'">
                    🔄 刷新页面 / Refresh
                </button>
                <p style="margin-top: 20px; font-size: 0.9rem; opacity: 0.7;">Error: ${error.message}</p>
            </div>
        `;
    }
}

// =============================================================================
// 2. ARCHITECTURE: Centralized View State Management (THE VIEW SWITCHER)
// =============================================================================

/**
 * CENTRAL STATE MANAGEMENT - Controls all view transitions
 * This is the single entry point for switching between bookshelf and lesson views.
 * Prevents multiple render cycles, manages state, and provides error boundaries.
 * 
 * @param {string} viewName - Target view: 'bookshelf' or 'lesson'
 */
function switchView(viewName) {
    
    // Prevent redundant switches
    const container = document.getElementById('app-container');
    const hasContent = !!(container && container.children && container.children.length > 0);
    if (viewName === APP_STATE.currentView && hasContent) {
        return;
    }
    
    APP_STATE.currentView = viewName;
    
    if (!container) {
        return;
    }
    
    try {
        if (viewName === 'bookshelf') {
            renderBookshelf();
        } else if (viewName === 'lesson') {
            renderLesson();
        } else {
            throw new Error(`Unknown view: ${viewName}`);
        }
    } catch (error) {
        // Fallback: return to bookshelf on error
        APP_STATE.currentView = 'bookshelf';
        renderBookshelf();
    }
}

// =============================================================================
// 3. STATE: localStorage and Progress Management
// =============================================================================

/**
 * Get all completed lesson IDs from localStorage
 * @returns {Array<string>} Array of completed lesson IDs
 */
function getProgress() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

/**
 * Save progress to localStorage
 * @param {Array<string>} progress - Array of completed lesson IDs
 */
function saveProgress(progress) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

/**
 * Mark a lesson as completed
 * @param {string|number} lessonId - The lesson to mark complete
 */
function completeLessonProgress(lessonId) {
    const progress = getProgress();
    const lessonIdStr = String(lessonId);
    
    if (!progress.includes(lessonIdStr)) {
        progress.push(lessonIdStr);
        saveProgress(progress);
    }
}

/**
 * Check if a lesson is completed
 * @param {string|number} lessonId - The lesson to check
 * @returns {boolean} True if completed
 */
function isLessonCompleted(lessonId) {
    return getProgress().includes(String(lessonId));
}

/**
 * Check if a lesson is unlocked (can be played)
 * First lesson is always unlocked; subsequent lessons unlock when previous is completed
 * @param {number} lessonIndex - Zero-based lesson index in the array
 * @returns {boolean} True if unlocked
 */
function isLessonUnlocked(lessonIndex) {
    // First lesson is always unlocked
    if (lessonIndex === 0) return true;
    
    // No lessons loaded
    if (APP_STATE.allLessons.length === 0) return false;
    
    // Check if previous lesson is completed
    const previousLesson = APP_STATE.allLessons[lessonIndex - 1];
    return isLessonCompleted(previousLesson.lessonId);
}

/**
 * Clear all progress (for testing)
 */
function clearAllProgress() {
    localStorage.removeItem(STORAGE_KEY);
}

// =============================================================================
// 4. COMPONENTS: Reusable UI Elements
// =============================================================================

/**
 * Create a book card element for the bookshelf
 * @param {Object} lesson - The lesson object
 * @param {number} index - Zero-based index in lessons array
 * @returns {HTMLElement} The book card element
 */
function createBookElement(lesson, index) {
    
    const isUnlocked = isLessonUnlocked(index);
    const isCompleted = isLessonCompleted(lesson.lessonId);
    
    const book = document.createElement('div');
    book.className = `book-card ${isUnlocked ? 'unlocked' : 'locked'}`;
    book.dataset.lessonId = lesson.lessonId;
    
    const coverImg = lesson.imagePath || 'images/placeholder.png';
    const filterClass = isUnlocked ? '' : 'grayscale';
    
    book.innerHTML = `
        <div class="book-cover ${filterClass}" style="background-image: url('${coverImg}');">
            ${!isUnlocked ? '<div class="lock-icon">🔒</div>' : ''}
            ${isCompleted ? '<div class="star-badge">⭐</div>' : ''}
            <img src="${coverImg}" alt="cover" style="display:none;" onerror="console.error('❌ [IMAGE] Failed to load: ${coverImg}')" onload="console.log('✅ [IMAGE] Loaded: ${coverImg}')">
        </div>
        <div class="book-info">
            <div class="book-title">${lesson.title}</div>
            <div class="book-hero">🦸 ${lesson.hero || 'Unknown'}</div>
        </div>
    `;
    
    // Attach click handler
    if (isUnlocked) {
        book.style.cursor = 'pointer';
        book.addEventListener('click', (e) => {
            e.preventDefault();
            onBookClick(lesson.lessonId);
        });
    } else {
        book.addEventListener('click', (e) => {
            e.preventDefault();
        });
    }
    
    return book;
}

// =============================================================================
// 5. VIEWS: Render Functions (SPA Views)
// =============================================================================

/**
 * Render the bookshelf view
 */
async function renderBookshelf() {
    
    // Verify data exists
    if (APP_STATE.allLessons.length === 0) {
        await initApp();
        return;
    }
    
    const container = document.getElementById('app-container');
    if (!container) {
        return;
    }
    
    try {
        container.innerHTML = `
            <div id="bookshelf">
                <header class="bookshelf-header">
                    <h1>📚 Mandarin Quest</h1>
                    <p>读故事 找汉字</p>
                </header>
                <div class="bookshelf-grid" id="bookshelf-grid"></div>
                <footer class="bookshelf-footer">
                    ${window.DEBUG_MODE ? `<button onclick="window.clearAllProgress(); location.reload();" class="reset-btn">
                        🔄 Reset Progress (Testing)
                    </button>` : ''}
                </footer>
            </div>
        `;
        
        // Populate grid
        const grid = document.getElementById('bookshelf-grid');
        APP_STATE.allLessons.forEach((lesson, index) => {
            const bookElement = createBookElement(lesson, index);
            grid.appendChild(bookElement);
        });
    } catch (error) {
        container.innerHTML = `<div style="padding:20px; color:red;">Error rendering bookshelf</div>`;
    }
}

/**
 * Handle book click - transition to lesson view
 * @param {string|number} lessonId - The lesson ID to load
 */
function onBookClick(lessonId) {
    
    // Find lesson in data
    const lesson = APP_STATE.allLessons.find(l => l.lessonId === lessonId);
    if (!lesson) {
        return;
    }
    
    // Set current lesson and reset story state
    APP_STATE.currentLesson = lesson;
    APP_STATE.currentPage = 0;
    APP_STATE.totalPages = 0;
    APP_STATE.charProgress = {};
    switchView('lesson');
}

/**
 * Render the lesson view - with pre-rendered story content hidden behind entry page
 */
async function renderLesson() {
    
    // Verify lesson data
    if (!APP_STATE.currentLesson) {
        switchView('bookshelf');
        return;
    }
    
    const container = document.getElementById('app-container');
    if (!container) {
        return;
    }
    
    try {
        const imageUrl = APP_STATE.currentLesson.imagePath || 'images/placeholder.png';
        
        container.innerHTML = `
            <!-- Background Scenery -->
            <div id="scenery" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${imageUrl}') center/cover; z-index: -1;">
                <img src="${imageUrl}" 
                     style="display:none;" 
                     onerror="console.error('❌ [IMAGE] Failed to load: ${imageUrl}')"
                     onload="console.log('✅ [IMAGE] Loaded successfully')">
            </div>

            <!-- HUD (Hidden initially, shown when game starts) -->
            <div id="hud" style="position: relative; z-index: 100; background: rgba(0,0,0,0.85); border-bottom: 3px solid var(--hero-gold); padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; color: white; display: none;">
                <div class="hero-name" id="ui-hero">🦸 ${APP_STATE.currentLesson.hero}</div>
                <div class="task-box" id="ui-inventory"></div>
            </div>

            <!-- Book Viewport (Hidden initially, shown when game starts) -->
            <div id="book-viewport" style="height: 70vh; display: flex; align-items: center; justify-content: center; margin-top: 10px; display: none;">
                <div id="page-wrapper" style="position: relative; width: 95vw; max-width: 900px; height: 100%;"></div>
            </div>

            <!-- Entry/Start Page Overlay -->
            <div id="entry-page" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7)); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 3000;">
                <h1 id="ui-title" style="color: white; font-size: 3.5rem; margin-bottom: 30px; text-shadow: 2px 2px 15px #000; font-family: 'Noto Sans SC', sans-serif;">
                    ${APP_STATE.currentLesson.title}
                </h1>
                <button class="start-btn" onclick="window.startGame()">开始阅读</button>
                <button onclick="window.switchView('bookshelf')" style="padding: 10px 20px; font-size: 1rem; background-color: rgba(255,255,255,0.3); border: 2px solid white; border-radius: 20px; cursor: pointer; color: white; margin-top: 20px;">
                    ← 返回书架
                </button>
            </div>

            <!-- Vocabulary Popup -->
            <div id="p-overlay" onclick="window.closePopup()" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 400; display: none;"></div>
            <div id="popup" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; width: 85%; max-width: 450px; padding: 25px; border-radius: 15px; border: 4px solid var(--hero-gold); text-align: center; display: none; z-index: 500;">
                <div style="font-size:2.5rem;">🏮</div>
                <h2 id="p-word" style="color:var(--red-ink); margin:10px 0;"></h2>
                <div id="p-pinyin" style="color:#666; font-style:italic;"></div>
                <p id="p-mean" style="font-size:1.3rem;"></p>
                <button onclick="window.closePopup()" style="margin-top:20px; padding:10px 20px; cursor:pointer;">关闭</button>
            </div>

            <!-- Victory Screen -->
            <div id="firework-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 999; flex-direction: column; align-items: center; justify-content: center;">
                <div class="victory-text" style="color: var(--hero-gold); font-size: 5rem; font-weight: bold; text-shadow: 0 0 20px #fff, 0 0 30px var(--hero-gold); animation: rainbow 2s infinite, pulse 1s infinite alternate;">你真棒!</div>
            </div>
        `;

        // NOW pre-build and populate the story content (hidden under entry page)
        setupCharacterTracker();
        buildInteractiveStory();
        setupHintSystem();
    } catch (error) {
        container.innerHTML = `<div style="padding:20px; color:red;">Error rendering lesson</div>`;
        setTimeout(() => switchView('bookshelf'), 2000);
    }
}

/**
 * Start game - initialize story and show game container
 */
function startGame() {
    
    try {
        // Hide entry page overlay
        const entryPage = document.getElementById('entry-page');
        if (entryPage) {
            entryPage.style.display = 'none';
        }
        
        // Show HUD and book viewport (story was pre-built in renderLesson)
        const hud = document.getElementById('hud');
        const bookViewport = document.getElementById('book-viewport');
        const hintContainer = document.getElementById('hint-container');
        
        if (hud) hud.style.display = 'flex';
        if (bookViewport) bookViewport.style.display = 'flex';
        if (hintContainer) hintContainer.style.display = 'flex';
        
        // Show story (single scrollable view)
        showCurrentPage();
    } catch (error) {
    }
}

/**
 * Setup character tracker HUD
 */
function setupCharacterTracker() {
    
    const inventory = document.getElementById('ui-inventory');
    inventory.innerHTML = '';
    
    let totalCharsToFind = 0;
    
    APP_STATE.currentLesson.seekCharacters.forEach(char => {
        const regex = new RegExp(char, 'g');
        const matches = APP_STATE.currentLesson.storyText.match(regex);
        const totalCount = matches ? matches.length : 0;
        
        totalCharsToFind += totalCount;
        
        APP_STATE.charProgress[char] = { found: 0, total: totalCount };
        
        inventory.innerHTML += `
            <div class="char-slot" id="slot-${char}">
                <div class="char-main">${char}</div>
                <div class="char-count" id="count-${char}">0/${totalCount}</div>
            </div>`;
    });
    
    // Calculate hints as 15% of total characters to find, rounded up
    APP_STATE.hintsRemaining = Math.ceil(totalCharsToFind * 0.15);
    APP_STATE.maxHints = APP_STATE.hintsRemaining;
}

/**
 * Setup hint system UI below the story
 */
function setupHintSystem() {
    
    const bookViewport = document.getElementById('book-viewport');
    if (!bookViewport) return;
    
    // Create hint button container below story
    const hintContainer = document.createElement('div');
    hintContainer.id = 'hint-container';
    hintContainer.style.cssText = `
        text-align: center; 
        margin-top: 25px; 
        padding: 20px;
        display: flex;
        justify-content: center;
    `;
    hintContainer.style.display = 'none';

    hintContainer.innerHTML = `
        <button id="hint-btn" 
                onclick="window.useHint()" 
                style="
                    padding: 20px 50px; 
                    font-size: 1.6rem; 
                    background: linear-gradient(135deg, #FF9F43 0%, #FF6348 100%); 
                    color: white; 
                    border: none; 
                    border-radius: 35px; 
                    cursor: pointer; 
                    font-weight: bold; 
                    box-shadow: 0 8px 25px rgba(255, 99, 72, 0.5); 
                    transition: all 0.3s;
                    min-width: 280px;
                    margin-right: 20px;
                "
                onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 12px 35px rgba(255, 99, 72, 0.7)';"
                onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 8px 25px rgba(255, 99, 72, 0.5)';">
            💡 获得提示 (<span id="hint-count">${APP_STATE.maxHints}</span>/${APP_STATE.maxHints})
        </button>
        
        ${window.DEBUG_MODE ? `<button id="test-complete-btn" 
                onclick="window.testCompletion()" 
                style="
                    padding: 15px 35px; 
                    font-size: 1.2rem; 
                    background: linear-gradient(135deg, #00D2FF 0%, #3A7BD5 100%); 
                    color: white; 
                    border: none; 
                    border-radius: 25px; 
                    cursor: pointer; 
                    font-weight: bold; 
                    box-shadow: 0 4px 15px rgba(58, 123, 213, 0.4); 
                    transition: all 0.3s;
                "
                onmouseover="this.style.transform='scale(1.05)';"
                onmouseout="this.style.transform='scale(1)';">
            🧪 测试完成效果
        </button>` : ''}
    `;
    
    bookViewport.parentNode.insertBefore(hintContainer, bookViewport.nextSibling);
}

/**
 * Use one hint - reveal a random unrevealed seek character
 */
function useHint() {
    if (APP_STATE.hintsRemaining <= 0) {
        return;
    }
    
    // Find all unhidden seek characters on the page
    const unrevealedChars = Array.from(document.querySelectorAll('.hidden-char:not(.found)'));
    
    if (unrevealedChars.length === 0) {
        return;
    }
    
    // Pick a random unrevealed character and auto-reveal it
    const randomChar = unrevealedChars[Math.floor(Math.random() * unrevealedChars.length)];
    const char = randomChar.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
    
    if (char) {
        // Simulate click to reveal the character
        window.captureCharacter(randomChar, char, null);
        // Apply hint-specific highlight
        randomChar.classList.add('hint-reveal');
        randomChar.style.setProperty('color', '#6C63FF', 'important');
        randomChar.style.setProperty('text-shadow', '0 0 8px rgba(108, 99, 255, 0.5)', 'important');
        randomChar.style.setProperty('background', 'rgba(108, 99, 255, 0.08)', 'important');
        // Scroll into view to show context
        randomChar.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // Decrement and update UI
    APP_STATE.hintsRemaining--;
    const hintBtn = document.getElementById('hint-btn');
    const hintCount = document.getElementById('hint-count');
    
    if (hintCount) hintCount.innerText = APP_STATE.hintsRemaining;
    
    // Grey out button when no hints left
    if (APP_STATE.hintsRemaining <= 0) {
        if (hintBtn) {
            hintBtn.disabled = true;
            hintBtn.style.background = '#b0b0b0';
            hintBtn.style.cursor = 'not-allowed';
            hintBtn.style.boxShadow = 'none';
                        hintBtn.style.opacity = '0.6';
            hintBtn.innerText = `💡 提示已用完 (0/${APP_STATE.maxHints})`;
        }
    }
}

/**
 * Build interactive story
 */
function buildInteractiveStory() {
    
    const storyHtml = buildStoryHtml(
        APP_STATE.currentLesson.storyText,
        APP_STATE.currentLesson.pinyinText,
        APP_STATE.currentLesson.vocabToExplain,
        APP_STATE.currentLesson.seekCharacters
    );
    
    document.getElementById('page-wrapper').innerHTML = storyHtml;
}

/**
 * Build story HTML with vocab and seek characters
 * @param {string} text - Story text
 * @param {string} pinyin - Pinyin annotations
 * @param {Array} vocabList - Vocabulary array
 * @param {Array} hiddenChars - Characters to seek
 * @returns {string} HTML string
 */
function buildStoryHtml(text, pinyin, vocabList, hiddenChars) {
    // Build a clean mapping of position -> pinyin
    const pinyinWords = pinyin.trim().split(/\s+/);
    const charToPinyinMap = new Map();
    
    // Extract all Chinese characters with their positions
    let chineseCharIndex = 0;
    for (let i = 0; i < text.length; i++) {
        if (/[\u4e00-\u9fa5]/.test(text[i])) {
            charToPinyinMap.set(i, pinyinWords[chineseCharIndex] || "");
            chineseCharIndex++;
        }
    }
    
    let htmlOut = "";
    htmlOut += `<div class="story-page visible" id="story-container"><div style="width: 100%; max-width: 800px; line-height: 2.5;">`;

    let i = 0;
    while (i < text.length) {
        const vocab = vocabList.find(v => text.substr(i).startsWith(v.character));
        
        if (vocab) {
            htmlOut += `<span class="vocab-word" onclick="window.showPopup('${escapeHtml(vocab.character)}','${escapeHtml(vocab.definition)}','${escapeHtml(vocab.pinyin)}')">`;
            
            for (let k = 0; k < vocab.character.length; k++) {
                const py = charToPinyinMap.get(i + k) || "";
                htmlOut += renderChar(text[i + k], py, hiddenChars);
            }
            
            htmlOut += `</span>`;
            i += vocab.character.length;
        } else {
            const py = charToPinyinMap.get(i) || "";
            htmlOut += renderChar(text[i], py, hiddenChars);
            i++;
        }
    }
    
    htmlOut += `</div></div>`;
    
    return htmlOut;
}

/**
 * Render single character with ruby annotations
 * @param {string} char - Character to render
 * @param {string} py - Pinyin for this character
 * @param {Array} hiddenChars - Characters to make interactive
 * @returns {string} HTML string
 */
function renderChar(char, py, hiddenChars) {
    const isSeek = hiddenChars.includes(char);
    const isChinese = /[\u4e00-\u9fa5]/.test(char);
    
    if (!isChinese) return char;
    
    if (isSeek) {
        return `<ruby class="hidden-char" onclick="window.captureCharacter(this,'${char}',event)">${char}<rt>${py}</rt></ruby>`;
    }
    
    return `<ruby>${char}<rt>${py}</rt></ruby>`;
}

/**
 * Escape HTML entities
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Navigate to next page
 */
/**
 * Show the story (single scrollable view - no pagination)
 */
function showCurrentPage() {
    // Story is already visible in the single scrollable view
}

/**
 * Finish lesson - mark complete, unlock next, show victory
 */


/**
 * Test completion screen - for development/testing
 */
function testCompletion() {
    finishLesson();
}

function finishLesson() {
    
    completeLessonProgress(APP_STATE.currentLesson.lessonId);
    
    const container = document.getElementById('app-container');
    container.innerHTML = `
        <div style="
            display: flex; 
            align-items: center; 
            justify-content: center; 
            height: 100vh; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            text-align: center; 
            flex-direction: column;
            position: relative;
            overflow: hidden;
        ">
            <img src="https://media.giphy.com/media/26tOZ42Mg6pbTUPHW/giphy.gif" 
                 style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.4; z-index: 0;" 
                 alt="fireworks">
            <div style="position: relative; z-index: 1;">
                <div style="font-size: 6rem; margin-bottom: 30px; animation: bounce 1s infinite;">🎉</div>
                <div style="font-size: 3.5rem; font-weight: bold; text-shadow: 0 0 30px rgba(255,255,255,0.8); margin-bottom: 20px;">恭喜你！</div>
                <div style="font-size: 2rem; margin-top: 20px; text-shadow: 0 0 20px rgba(255,255,255,0.6);">你完成了这堂课！</div>
            </div>
        </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }
    `;
    document.head.appendChild(style);
    
    setTimeout(() => switchView('bookshelf'), 4000);
}


/**
 * Test completion screen - for development/testing
 */
function testCompletion() {
    finishLesson();
}

/**
 * Show vocabulary popup
 * @param {string} character - The character
 * @param {string} definition - The definition
 * @param {string} pinyin - The pinyin
 */
function showPopup(character, definition, pinyin) {
    
    document.getElementById('p-word').innerText = character;
    document.getElementById('p-pinyin').innerText = pinyin || '';
    document.getElementById('p-mean').innerText = definition || '';
    document.getElementById('p-overlay').style.display = 'block';
    document.getElementById('popup').style.display = 'block';
}

/**
 * Close popup
 */
function closePopup() {
    document.getElementById('p-overlay').style.display = 'none';
    document.getElementById('popup').style.display = 'none';
}

/**
 * Capture character during hunt - mark as found and show sparkles
 * @param {HTMLElement} element - The character element
 * @param {string} char - The character
 * @param {Event} evt - The click event
 */
function captureCharacter(element, char, evt) {
    if (evt && typeof evt.stopPropagation === 'function') {
        evt.stopPropagation();
    }
    
    if (element.classList.contains('found')) return;
    
    // Add the 'found' class - CSS handles visual styling
    element.classList.add('found');

    // Inline highlight with kid-friendly bright coral color and subtle glow (no position shift)
    element.style.setProperty('color', '#FF6B6B', 'important');
    element.style.setProperty('font-weight', '700', 'important');
    element.style.setProperty('text-shadow', '0 0 8px rgba(255, 107, 107, 0.5)', 'important');
    element.style.setProperty('filter', 'none', 'important');
    
    if (APP_STATE.charProgress[char]) {
        APP_STATE.charProgress[char].found++;
        const countEl = document.getElementById(`count-${char}`);
        if (countEl) {
            countEl.innerText = `${APP_STATE.charProgress[char].found}/${APP_STATE.charProgress[char].total}`;
        }
        
        if (APP_STATE.charProgress[char].found === APP_STATE.charProgress[char].total) {
            const slot = document.getElementById(`slot-${char}`);
            if (slot) slot.classList.add('done');
        }
    }
    
    // Sparkle animation
    const rect = element.getBoundingClientRect();
    const x = (evt && typeof evt.clientX === 'number') ? evt.clientX : rect.left + rect.width / 2;
    const y = (evt && typeof evt.clientY === 'number') ? evt.clientY : rect.top + rect.height / 2;
    for (let i = 0; i < 12; i++) {
        const spark = document.createElement('div');
        spark.style.position = 'fixed';
        spark.style.left = x + 'px';
        spark.style.top = y + 'px';
        spark.style.width = '10px';
        spark.style.height = '10px';
        spark.style.background = '#FFD700';
        spark.style.borderRadius = '50%';
        spark.style.pointerEvents = 'none';
        spark.style.boxShadow = '0 0 10px #FFD700';
        document.body.appendChild(spark);
        
        const angle = (i / 12) * Math.PI * 2;
        const distance = 100;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        
        spark.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1 },
            { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
        ], {
            duration: 600,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }).onfinish = () => spark.remove();
    }
    
    checkLessonCompletion();
}

/**
 * Check if lesson is complete - all seek characters fully found
 */
function checkLessonCompletion() {
    const allChars = APP_STATE.currentLesson.seekCharacters;
    
    // Check if all characters have been found (all instances of each)
    const allFound = allChars.every(char => 
        APP_STATE.charProgress[char] && 
        APP_STATE.charProgress[char].found === APP_STATE.charProgress[char].total &&
        APP_STATE.charProgress[char].total > 0
    );
    
    if (allFound && allChars.length > 0) {
        setTimeout(() => finishLesson(), 1000);
    }
}

// =============================================================================
// 6. GLOBAL FUNCTION EXPOSURE
// =============================================================================

window.initApp = initApp;
window.switchView = switchView;
window.startGame = startGame;
window.showCurrentPage = showCurrentPage;
window.finishLesson = finishLesson;
window.captureCharacter = captureCharacter;
window.showPopup = showPopup;
window.closePopup = closePopup;
window.clearAllProgress = clearAllProgress;
window.useHint = useHint;
window.testCompletion = testCompletion;
window.APP_STATE = APP_STATE;

// =============================================================================
// 7. BOOTSTRAP
// =============================================================================

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

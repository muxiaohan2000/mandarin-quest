// =============================================================================
// MANDARIN QUEST - Integration Tests
// Tests for bookshelf unlock logic, progress persistence, and UI rendering
// =============================================================================

const TEST_RESULTS = [];

// UI renderer for Spec Runner panel
function renderResultsToPanel() {
    const panel = document.getElementById('spec-runner');
    if (!panel) return;
    panel.innerHTML = '';
    TEST_RESULTS.forEach(r => {
        const line = document.createElement('div');
        line.textContent = `[${r.status}] ${r.name}: ${r.message || ''}`;
        line.style.color = r.status === 'PASS' ? '#8BC34A' : '#FF5252';
        panel.appendChild(line);
    });
}

// Helper: ensure lessons are loaded
async function ensureLessonsLoaded() {
    if (window.APP_STATE && Array.isArray(window.APP_STATE.allLessons) && window.APP_STATE.allLessons.length > 0) {
        return window.APP_STATE.allLessons;
    }
    if (typeof window.initApp === 'function') {
        await window.initApp();
        return window.APP_STATE.allLessons;
    }
    const resp = await fetch('data.json');
    const lessons = await resp.json();
    return lessons;
}

/**
 * Test runner helper
 */
function assert(testName, condition, errorMsg = '') {
    if (condition) {
        TEST_RESULTS.push({ name: testName, status: 'PASS', message: '✅' });
        console.log(`✅ [PASS] ${testName}`);
    } else {
        TEST_RESULTS.push({ name: testName, status: 'FAIL', message: errorMsg });
        console.error(`❌ [FAIL] ${testName}: ${errorMsg}`);
    }
}

/**
 * TEST 1: Data Structure Validation
 * Verify all lessons have required fields
 */
async function testDataStructure() {
    console.log('\n=== TEST 1: Data Structure ===');
    const lessons = await ensureLessonsLoaded();
    
    assert(
        'Data loads successfully',
        lessons.length > 0,
        `Expected lessons to load, got ${lessons.length}`
    );
    
    const requiredFields = ['lessonId', 'title', 'hero', 'storyText', 'imagePath', 'vocabToExplain', 'seekCharacters'];
    
    lessons.slice(0, 3).forEach((lesson, idx) => {
        requiredFields.forEach(field => {
            assert(
                `Lesson ${idx} has field: ${field}`,
                field in lesson,
                `Missing field ${field} in lesson ${lesson.lessonId}`
            );
        });
    });
}

/**
 * TEST 2: localStorage Progress Management
 * Verify progress is saved and retrieved correctly
 */
function testProgressStorage() {
    console.log('\n=== TEST 2: Progress Storage ===');
    
    // Clear any existing progress
    clearAllProgress();
    
    assert(
        'Initial progress is empty',
        getProgress().length === 0,
        `Expected empty progress, got ${getProgress().length} items`
    );
    
    // Add a lesson
    completeLessonProgress('Group_1');
    assert(
        'Lesson marked as complete',
        isLessonCompleted('Group_1'),
        'Group_1 should be in progress'
    );
    
    // Check persistence
    const saved = JSON.parse(localStorage.getItem('mandarin_quest_progress'));
    assert(
        'Progress persisted to localStorage',
        saved && saved.includes('Group_1'),
        'Group_1 not found in localStorage'
    );
    
    // Add another lesson
    completeLessonProgress('Group_2');
    assert(
        'Multiple lessons tracked',
        getProgress().length === 2,
        `Expected 2 lessons, got ${getProgress().length}`
    );
    
    // Cleanup
    clearAllProgress();
}

/**
 * TEST 3: Unlock Logic - Sequential Unlocking
 * Verify: Group_1 always unlocked, Group_2 unlocked only if Group_1 complete
 */
function testUnlockLogic() {
    console.log('\n=== TEST 3: Unlock Logic ===');
    
    clearAllProgress();
    
    // First lesson always unlocked
    assert(
        'Group_1 (index 0) is always unlocked',
        isLessonUnlocked(0),
        'First lesson should always be unlocked'
    );
    
    // Second lesson locked initially
    assert(
        'Group_2 (index 1) locked when Group_1 not completed',
        !isLessonUnlocked(1),
        'Second lesson should be locked initially'
    );
    
    // Complete first lesson
    completeLessonProgress('Group_1');
    
    // Second lesson now unlocked
    assert(
        'Group_2 (index 1) unlocked after Group_1 completed',
        isLessonUnlocked(1),
        'Second lesson should unlock after first is complete'
    );
    
    // Third lesson still locked
    assert(
        'Group_3 (index 2) still locked after only Group_1 complete',
        !isLessonUnlocked(2),
        'Third lesson should still be locked'
    );
    
    // Complete second lesson
    completeLessonProgress('Group_2');
    
    // Third lesson now unlocked
    assert(
        'Group_3 (index 2) unlocked after Group_2 completed',
        isLessonUnlocked(2),
        'Third lesson should unlock after second is complete'
    );
    
    // Cleanup
    clearAllProgress();
}

/**
 * TEST 4: Star Badge Display Logic
 * Verify completed lessons show star, uncompleted don't
 */
function testStarLogic() {
    console.log('\n=== TEST 4: Star Badge Logic ===');
    
    clearAllProgress();
    
    // No stars initially
    assert(
        'No star for new lesson',
        !isLessonCompleted('Group_1'),
        'Group_1 should not have star initially'
    );
    
    // Complete lesson
    completeLessonProgress('Group_1');
    
    // Star appears
    assert(
        'Star appears after completion',
        isLessonCompleted('Group_1'),
        'Group_1 should have star after completion'
    );
    
    // Other lessons don't have stars
    assert(
        'Other lessons still no star',
        !isLessonCompleted('Group_2'),
        'Group_2 should not have star'
    );
    
    // Cleanup
    clearAllProgress();
}

/**
 * TEST 5: createBookElement Component
 * Verify book element renders correctly based on state
 */
async function testCreateBookElement() {
    console.log('\n=== TEST 5: createBookElement Component ===');
    
    clearAllProgress();
    await initApp();
    
    const lesson1 = APP_STATE.allLessons[0];
    const lesson2 = APP_STATE.allLessons[1];
    
    // Create first book (unlocked, not completed)
    const book1 = createBookElement(lesson1, 0);
    assert(
        'Book1 has unlocked class',
        book1.classList.contains('unlocked'),
        'First book should be unlocked'
    );
    assert(
        'Book1 has no lock icon',
        !book1.innerHTML.includes('🔒'),
        'First book should not have lock icon'
    );
    
    // Create second book (locked initially)
    const book2 = createBookElement(lesson2, 1);
    assert(
        'Book2 has locked class',
        book2.classList.contains('locked'),
        'Second book should be locked initially'
    );
    assert(
        'Book2 has lock icon',
        book2.innerHTML.includes('🔒'),
        'Second book should have lock icon'
    );
    
    // Complete first lesson
    completeLessonProgress(lesson1.lessonId);
    
    // Re-create first book (should show star)
    const book1Updated = createBookElement(lesson1, 0);
    assert(
        'Book1 shows star after completion',
        book1Updated.innerHTML.includes('⭐'),
        'First book should show star after completion'
    );
    
    // Second book now unlocked
    const book2Updated = createBookElement(lesson2, 1);
    assert(
        'Book2 unlocked after Book1 completed',
        book2Updated.classList.contains('unlocked'),
        'Second book should be unlocked after first is complete'
    );
    assert(
        'Book2 has no lock icon when unlocked',
        !book2Updated.innerHTML.includes('🔒'),
        'Second book should not have lock icon when unlocked'
    );
    
    // Cleanup
    clearAllProgress();
}

/**
 * TEST 6: Integration - Full Unlock Chain
 * Verify completing lessons sequentially unlocks next books
 */
function testIntegrationUnlockChain() {
    console.log('\n=== TEST 6: Integration - Unlock Chain ===');
    
    clearAllProgress();
    
    // Scenario: User completes Group_1, Group_2, Group_3
    const lessonIds = ['Group_1', 'Group_2', 'Group_3'];
    
    lessonIds.forEach((id, idx) => {
        completeLessonProgress(id);
        
        // Check that up to current lesson are completed
        for (let i = 0; i <= idx; i++) {
            assert(
                `${lessonIds[i]} is completed after step ${idx + 1}`,
                isLessonCompleted(lessonIds[i]),
                `${lessonIds[i]} should be complete`
            );
        }
        
        // Check that next lesson is unlocked (if not already)
        if (idx < lessonIds.length - 1) {
            assert(
                `${lessonIds[idx + 1]} is unlocked after ${lessonIds[idx]} complete`,
                isLessonUnlocked(idx + 1),
                `${lessonIds[idx + 1]} should be unlocked`
            );
        }
    });
    
    // Cleanup
    clearAllProgress();
}

/**
 * TEST 7: Progress Persistence Across Page Reload
 * Simulate page reload and verify progress is retained
 */
function testPersistenceAcrossReload() {
    console.log('\n=== TEST 7: Persistence Across Reload ===');
    
    clearAllProgress();
    
    // Save progress
    completeLessonProgress('Group_1');
    completeLessonProgress('Group_2');
    const progressBefore = JSON.stringify(getProgress());
    
    // Simulate reading from localStorage (what happens on page reload)
    const stored = localStorage.getItem('mandarin_quest_progress');
    const progressAfter = JSON.stringify(JSON.parse(stored));
    
    assert(
        'Progress persists after simulated reload',
        progressBefore === progressAfter,
        `Progress mismatch: before=${progressBefore}, after=${progressAfter}`
    );
    
    assert(
        'Exact lessons retrieved',
        getProgress().includes('Group_1') && getProgress().includes('Group_2'),
        'Should contain both Group_1 and Group_2'
    );
    
    // Cleanup
    clearAllProgress();
}

/**
 * TEST 8: Lesson Data Validation
 * Verify all lessons have valid image paths and content
 */
async function testLessonDataValidity() {
    console.log('\n=== TEST 8: Lesson Data Validity ===');
    
    await initApp();
    
    APP_STATE.allLessons.forEach((lesson, idx) => {
        assert(
            `Lesson ${idx} has non-empty title`,
            lesson.title && lesson.title.length > 0,
            `Lesson ${idx} has empty title`
        );
        
        assert(
            `Lesson ${idx} has non-empty hero`,
            lesson.hero && lesson.hero.length > 0,
            `Lesson ${idx} has empty hero`
        );
        
        assert(
            `Lesson ${idx} has story text`,
            lesson.storyText && lesson.storyText.length > 0,
            `Lesson ${idx} has no story text`
        );
        
        assert(
            `Lesson ${idx} has vocabulary`,
            Array.isArray(lesson.vocabToExplain) && lesson.vocabToExplain.length > 0,
            `Lesson ${idx} has no vocabulary`
        );
        
        assert(
            `Lesson ${idx} has seek characters`,
            Array.isArray(lesson.seekCharacters) && lesson.seekCharacters.length > 0,
            `Lesson ${idx} has no seek characters`
        );
        
        assert(
            `Lesson ${idx} has image path`,
            lesson.imagePath && lesson.imagePath.length > 0,
            `Lesson ${idx} has no image path`
        );
    });
}

/**
 * TEST 9: UI Navigation - Book Click
 * Verify clicking a book triggers lesson view
 */
async function testBookClickNavigation() {
    console.log('\n=== TEST 9: Book Click Navigation ===');
    
    clearAllProgress();
    await initApp();
    
    // Render bookshelf
    const container = document.getElementById('app-container');
    if (!container) {
        assert(
            'app-container exists',
            false,
            'Cannot find #app-container element'
        );
        return;
    }
    
    await renderBookshelf();
    
    // Verify bookshelf is displayed
    assert(
        'Bookshelf renders',
        container.innerHTML.includes('bookshelf'),
        'Bookshelf should be visible in container'
    );
    
    // Find first book (should be unlocked)
    const firstBook = container.querySelector('.book-card[data-lesson-id="Group_1"]');
    assert(
        'First book element exists',
        firstBook !== null,
        'Could not find first book with data-lesson-id="Group_1"'
    );
    
    if (!firstBook) return;
    
    assert(
        'First book is unlocked',
        firstBook.classList.contains('unlocked'),
        'First book should have unlocked class'
    );
    
    // Simulate click on first book
    const beforeHTML = container.innerHTML;
    firstBook.click();
    
    // Wait for DOM update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const afterHTML = container.innerHTML;
    
    assert(
        'UI changes after click',
        beforeHTML !== afterHTML,
        'Container HTML should change after clicking book'
    );
    
    assert(
        'Lesson view displays',
        afterHTML.includes('scenery') || afterHTML.includes('entry-page'),
        'Lesson view elements should appear after clicking book'
    );
    
    assert(
        'Lesson title appears',
        afterHTML.includes('小明和会发光的字'),
        'First lesson title should appear in the view'
    );
    
    // Cleanup
    clearAllProgress();
}

/**
 * TEST 11: Lesson Rendering Flow
 * Verify that lesson is pre-rendered on entry page load
 */
async function testLessonRenderingFlow() {
    console.log('\n🧪 [TEST 11] Lesson Rendering Flow...');
    
    // Setup: ensure we're on bookshelf and can click a book
    await ensureLessonsLoaded();
    if (!window.APP_STATE || !window.APP_STATE.allLessons || window.APP_STATE.allLessons.length === 0) {
        assert('Lesson data available', false, 'No lessons loaded');
        return;
    }
    
    // Switch to bookshelf
    if (typeof window.switchView === 'function') {
        window.switchView('bookshelf');
    }
    
    // Wait for render
    await new Promise(r => setTimeout(r, 100));
    
    // Get first lesson
    const lesson = window.APP_STATE.allLessons[0];
    assert('First lesson exists', !!lesson, 'No lesson available to test');
    
    if (!lesson) return;
    
    // Simulate clicking a book: set current lesson and switch view
    window.APP_STATE.currentLesson = lesson;
    if (typeof window.switchView === 'function') {
        window.switchView('lesson');
    }
    
    // Wait for lesson to render
    await new Promise(r => setTimeout(r, 200));
    
    const container = document.getElementById('app-container');
    const entryPage = document.getElementById('entry-page');
    const pageWrapper = document.getElementById('page-wrapper');
    const hud = document.getElementById('hud');
    
    assert(
        'Entry page exists',
        !!entryPage,
        'Entry page (#entry-page) should be in DOM'
    );
    
    assert(
        'Entry page visible',
        entryPage && entryPage.style.display !== 'none',
        'Entry page should be visible (display: flex or empty)'
    );
    
    assert(
        'Page wrapper exists',
        !!pageWrapper,
        'Page wrapper (#page-wrapper) should exist for story content'
    );
    
    // KEY TEST: Story should be PRE-RENDERED in page-wrapper
    assert(
        'Story pre-rendered',
        pageWrapper && pageWrapper.innerHTML.length > 0,
        'Story HTML should already be in page-wrapper (pre-rendered, not waiting for button click)'
    );
    
    // Verify first page is marked .visible
    const storyPages = pageWrapper ? pageWrapper.querySelectorAll('.story-page') : [];
    assert(
        'Story pages created',
        storyPages.length > 0,
        `Should have at least 1 story page, found ${storyPages.length}`
    );
    
    if (storyPages.length > 0) {
        const firstPageVisible = storyPages[0].classList.contains('visible');
        assert(
            'First page marked visible',
            firstPageVisible,
            'First story page should have .visible class for display'
        );
    }
    
    // Test HUD exists
    assert(
        'HUD exists',
        !!hud,
        'HUD (#hud) should exist for character tracker'
    );
    
    // HUD should be hidden until button is clicked
    const hudDisplay = hud ? window.getComputedStyle(hud).display : 'unknown';
    assert(
        'HUD hidden until button',
        hud && (hud.style.display === 'none' || hudDisplay === 'none'),
        'HUD should be hidden until "开始阅读" is clicked'
    );
    
    // Test: Click "开始阅读" button reveals story
    const startBtn = container?.querySelector('.start-btn');
    assert(
        'Start button exists',
        !!startBtn,
        'Start button (class="start-btn") should exist'
    );
    
    if (startBtn && typeof window.startGame === 'function') {
        // Click button to start game
        window.startGame();
        
        // Wait for visibility changes
        await new Promise(r => setTimeout(r, 100));
        
        // Entry page should now be hidden
        const entryPageAfter = document.getElementById('entry-page');
        const entryHidden = entryPageAfter && entryPageAfter.style.display === 'none';
        assert(
            'Entry page hidden after start',
            entryHidden,
            'Entry page should hide when "开始阅读" is clicked'
        );
        
        // HUD should now be visible
        const hudAfter = document.getElementById('hud');
        const hudVisible = hudAfter && (hudAfter.style.display === 'flex' || window.getComputedStyle(hudAfter).display === 'flex');
        assert(
            'HUD visible after start',
            hudVisible,
            'HUD should display after button click'
        );
        
        // Book viewport should be visible
        const bookViewport = document.getElementById('book-viewport');
        const bookVisible = bookViewport && (bookViewport.style.display === 'flex' || window.getComputedStyle(bookViewport).display === 'flex');
        assert(
            'Book viewport visible after start',
            bookVisible,
            'Book viewport should display after button click'
        );
    }
    
    // Cleanup: switch back to bookshelf
    if (typeof window.switchView === 'function') {
        window.switchView('bookshelf');
    }
}

/**
 * Run all tests and display results
 */
async function runAllTests() {
    const panel = document.getElementById('spec-runner');
    if (panel) panel.style.display = 'block';
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     MANDARIN QUEST - INTEGRATION TEST SUITE              ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    TEST_RESULTS.length = 0; // Clear previous results
    
    await testDataStructure();
    testProgressStorage();
    testUnlockLogic();
    testStarLogic();
    await testCreateBookElement();
    testIntegrationUnlockChain();
    testPersistenceAcrossReload();
    await testLessonDataValidity();
    await testBookClickNavigation();
    await testLessonRenderingFlow();
    
    // Print summary
    const passed = TEST_RESULTS.filter(t => t.status === 'PASS').length;
    const total = TEST_RESULTS.length;
    const percentage = Math.round((passed / total) * 100);
    
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                    TEST SUMMARY                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n  Passed: ${passed}/${total} (${percentage}%)\n`);
    
    TEST_RESULTS.forEach(result => {
        const icon = result.status === 'PASS' ? '✅' : '❌';
        console.log(`  ${icon} ${result.name}`);
        if (result.message && result.status === 'FAIL') {
            console.log(`     └─ ${result.message}`);
        }
    });
    renderResultsToPanel();
    
    console.log('\n');
    
    return passed === total;
}

// Expose to window for console access
window.runAllTests = runAllTests;
window.TEST_RESULTS = TEST_RESULTS;

// Tests can be run manually from console: runAllTests()

// ============================================================================
// COMPLETION SCREEN UPDATE - Replace finishLesson() function in app.js
// ============================================================================

/**
 * Finish lesson - mark complete, unlock next, show victory with animated fireworks
 */
function finishLesson() {
    console.log('🎉 [FINISH-LESSON] Lesson complete!');
    
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
            font-size: 3rem; 
            text-align: center; 
            flex-direction: column;
            position: relative;
            overflow: hidden;
        ">
            <img src="https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExaGxkZmRqZjJ5dWtyMmV4cDFheGJvZ2NwcDFmZzV2cjVvdTB5MGU5NyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/g5R9dok94mrIvplmZd/giphy.gif" 
                 style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.4; z-index: 0;" 
                 alt="fireworks">
            <div style="position: relative; z-index: 1;">
                <div style="font-size: 6rem; margin-bottom: 30px; animation: bounce 1s infinite;">🎉</div>
                <div style="font-size: 3.5rem; font-weight: bold; text-shadow: 0 0 30px rgba(255,255,255,0.8); margin-bottom: 20px;">恭喜你！</div>
                <div style="font-size: 2rem; margin-top: 20px; text-shadow: 0 0 20px rgba(255,255,255,0.6);">你完成了这堂课！</div>
            </div>
        </div>
    `;
    
    // Add bounce animation
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


// ============================================================================
// TEST COMPLETION BUTTON - Add this function to app.js
// ============================================================================

/**
 * Test completion button - for development/verification only
 */
function testCompletion() {
    console.log('🧪 [TEST] Triggering completion screen...');
    finishLesson();
}


// ============================================================================
// EXPOSE testCompletion - Add this to global function exposure section
// ============================================================================
// In the section where you have:
// window.useHint = useHint;
// Add:
// window.testCompletion = testCompletion;


// ============================================================================
// ADD TEST BUTTON TO setupHintSystem() - Update the hintContainer.innerHTML
// ============================================================================

// Replace the hintContainer.innerHTML section in setupHintSystem() with:
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
        💡 获得提示 (<span id="hint-count">5</span>/5)
    </button>
    
    <button id="test-complete-btn" 
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
    </button>
`;

# 🎮 App.js Usage Guide

## Quick Start

### Basic Usage
```javascript
// Load a specific lesson
renderLesson('Group_1');

// Load lesson by numeric ID
renderLesson(2);
```

### Integration in HTML
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Mandarin Quest</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <script src="app.js"></script>
    <script>
        // Auto-load first lesson on page load
        window.addEventListener('DOMContentLoaded', () => {
            renderLesson('Group_1');
        });
    </script>
</body>
</html>
```

## Core Functions

### `renderLesson(lessonId)`
Main entry point - renders a complete lesson with all interactive features.

```javascript
await renderLesson('Group_1');
// Loads lesson data, builds UI, initializes game state
```

### `loadLesson(lessonId)`
Fetch a specific lesson from data.json without rendering.

```javascript
const lesson = await loadLesson('Group_1');
console.log(lesson.title); // "小明和会发光的字"
```

### `loadAllLessons()`
Fetch all lessons (useful for bookshelf view).

```javascript
const allLessons = await loadAllLessons();
console.log(`Total lessons: ${allLessons.length}`); // 33
```

## Progress Tracking

### Check Completion
```javascript
const isComplete = checkLessonCompletion('Group_1');
if (isComplete) {
    console.log('This lesson has been completed!');
}
```

### Get All Completed Lessons
```javascript
const completed = getCompletedLessons();
console.log(`Completed: ${completed.length} lessons`);
// Example: ["Group_1", "Group_2"]
```

### Clear Progress (Testing/Reset)
```javascript
clearAllProgress();
console.log('All progress reset!');
```

## Game Flow

1. **Entry Page** → User sees lesson title + "开始阅读" button
2. **Game Start** → `startGame()` hides entry, shows game UI
3. **Character Hunt** → User clicks characters marked in `seekCharacters`
4. **Sparkle Animation** → Visual feedback on each capture
5. **Sensei Guide** → User clicks vocab words to see definitions
6. **Victory** → When all characters found → Fireworks + localStorage save

## Data Structure Reference

### Lesson Object
```javascript
{
  "lessonId": "Group_1",
  "title": "小明和会发光的字",
  "storyText": "...",
  "pinyinText": "...",
  "vocabToExplain": [
    {
      "character": "活泼",
      "pinyin": "huó pō",
      "definition": "形容像小动物一样..."
    }
  ],
  "seekCharacters": ["一", "了", "字", "学", "课"],
  "imageUrl": "https://drive.google.com/..."
}
```

### Character Progress Tracking
```javascript
charProgress = {
  "一": { found: 0, total: 5 },
  "了": { found: 2, total: 3 },
  // ...
}
```

## Required CSS Classes

app.js expects these CSS classes to exist (port from Lesson_html):

### Essential Classes
- `.hidden-char` - Clickable seek characters
- `.vocab-word` - Vocabulary words (trigger popup)
- `.char-slot` - Character tracker slots
- `.char-slot.done` - Completed character (gold highlight)
- `.sparkle` - Sparkle particle animation

### UI Elements
- `#scenery` - Background image container
- `#entry-page` - Start screen
- `#main-game-container` - Main game UI
- `#hud` - Hero name + character tracker
- `#ui-inventory` - Character tracker container
- `#book-viewport` - Story display area
- `#popup` - Vocabulary definition popup
- `#firework-overlay` - Victory animation

## Debugging

### Console Logging
```javascript
// Enable verbose logging
console.log('Current lesson:', currentLesson);
console.log('Character progress:', charProgress);
console.log('Completed lessons:', getCompletedLessons());
```

### Common Issues

**Issue:** "Lesson not found"
- **Fix:** Check lessonId matches data.json exactly (case-sensitive)

**Issue:** No sparkles appear
- **Fix:** Ensure CSS for `.sparkle` class is loaded

**Issue:** Vocab popup doesn't show
- **Fix:** Check `vocabToExplain` array is properly parsed in data.json

**Issue:** Progress not saving
- **Fix:** Check browser allows localStorage (not in private/incognito mode)

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Required APIs:**
- `fetch()` - Data loading
- `localStorage` - Progress saving
- ES6 features (`async/await`, arrow functions, template literals)

## Performance Notes

- Data is cached after first load (no repeated fetches)
- Sparkle particles auto-cleanup (no memory leaks)
- LocalStorage has ~5MB limit (sufficient for progress data)

## Next Steps

See [MIGRATION_LOG.md](MIGRATION_LOG.md) Phase 3 for:
- Creating complete index.html
- Porting all CSS from Lesson_html
- Adding bookshelf navigation

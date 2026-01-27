# 📚 Mandarin Quest - 读故事 找汉字

An interactive Chinese language learning game where students read engaging stories and hunt for hidden characters. This standalone web application helps learners practice reading comprehension and character recognition through gamified adventures.

---

## 🚀 Quick Start

### Run Locally
1. Open `index.html` in a modern browser (Chrome, Firefox, Edge)
2. Or use a local server:
   ```bash
   python3 -m http.server 5500
   # Open http://localhost:5500
   ```

### Debug Mode
Access debug tools by appending `?debug=true` to the URL:
- Test Runner button
- Reset Progress button
- Complete Lesson button (instant testing)

Example: `http://localhost:5500?debug=true`

---

## 📁 Project Structure

```
Mandarin Quest/
├── index.html      # Main HTML structure
├── style.css       # All visual styling
├── app.js          # Game engine (vanilla JS)
├── data.json       # 33 lesson database
├── tests.js        # Test suite
├── images/         # Fireworks GIF and assets
└── archive/        # Migration artifacts (backups, docs)
```

---

## 📝 Adding New Lessons

### Step 1: Prepare Your Data
Each lesson requires:
1. **Story Text** (Chinese characters with punctuation)
2. **Pinyin Text** (space-separated, one pinyin word per Chinese character)
3. **Vocabulary List** (characters to explain with definitions)
4. **Seek Characters** (characters students must hunt for)

### Step 2: Data Structure
Add a new object to `data.json`:

```json
{
  "lessonId": "Group_34",
  "title": "新的冒险",
  "storyText": "小明去了森林。他看到一只小鸟。",
  "pinyinText": "xiǎo míng qù le sēn lín tā kàn dào yī zhī xiǎo niǎo",
  "vocabToExplain": [
    {
      "character": "森林",
      "pinyin": "sēn lín",
      "definition": "forest; woods"
    }
  ],
  "seekCharacters": ["明", "鸟"]
}
```

### Step 3: Pinyin Alignment Rules
**Critical**: Pinyin must align 1:1 with Chinese characters.

#### Character Count Example:
- Story: `小明去了森林。` (6 Chinese characters, punctuation ignored)
- Pinyin: `xiǎo míng qù le sēn lín` (6 words)

#### Extraction Method:
```python
# Extract Chinese characters only
chars = [c for c in story_text if '\u4e00' <= c <= '\u9fa5']
# Total chars must equal total pinyin words
```

#### Common Mistakes:
❌ Including punctuation in pinyin count  
❌ Skipping characters  
❌ Double-counting multi-character words  

✅ One pinyin word per Chinese character  
✅ Ignore all punctuation and whitespace in story text  
✅ Validate: `len(chinese_chars) == len(pinyin_words.split())`

### Step 4: Validation
Run this Python script to verify alignment:

```python
import json

with open('data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

for lesson in data:
    story = lesson['storyText']
    pinyin = lesson['pinyinText']
    
    chars = [c for c in story if '\u4e00' <= c <= '\u9fa5']
    words = pinyin.strip().split()
    
    if len(chars) != len(words):
        print(f"❌ {lesson['lessonId']}: {len(chars)} chars, {len(words)} pinyin")
    else:
        print(f"✅ {lesson['lessonId']}")
```

---

## 🎯 How the Pinyin Mapping Works

### Rendering Pipeline
1. **Extract Characters**: `buildStoryHtml()` extracts all Chinese characters from `storyText`
2. **Build Map**: Creates position-based mapping: `Map<textPosition, pinyinWord>`
3. **Render Ruby Tags**: Wraps each character in `<ruby>` with corresponding pinyin in `<rt>`

### Example:
```javascript
// Input
storyText: "小明去了森林。"
pinyinText: "xiǎo míng qù le sēn lín"

// Character Map (positions in original text)
{
  0: "xiǎo",  // 小
  1: "míng",  // 明
  2: "qù",    // 去
  3: "le",    // 了
  4: "sēn",   // 森
  5: "lín"    // 林
  // Position 6 (。) is skipped (not Chinese char)
}

// Rendered HTML
<ruby>小<rt>xiǎo</rt></ruby>
<ruby>明<rt>míng</rt></ruby>
<ruby>去<rt>qù</rt></ruby>
...
```

### Vocabulary Word Handling
Multi-character vocabulary words are wrapped together:
```html
<span class="vocab-word" onclick="showPopup(...)">
  <ruby>森<rt>sēn</rt></ruby>
  <ruby>林<rt>lín</rt></ruby>
</span>
```

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Lesson loads without errors
- [ ] Pinyin aligns correctly with characters
- [ ] Seek characters are clickable
- [ ] Vocabulary popups display definitions
- [ ] Hints reveal characters (15% of total)
- [ ] Completion screen appears with fireworks
- [ ] Progress persists after refresh

### Automated Tests
Open browser console:
```javascript
// Run all tests (debug mode only)
runAllTests()
```

---

## 🎨 Customization

### Hint Percentage
Default: 15% of total seek characters (rounded up)
```javascript
// In setupCharacterTracker()
APP_STATE.hintsRemaining = Math.ceil(totalCharsToFind * 0.15);
```

### Color Scheme
```css
/* style.css */
:root {
    --hero-gold: #FFD700;
    --paper: #fafafa;
    --red-ink: #c0392b;
}

.hidden-char.found { color: #FF6B6B; }        /* Coral */
.hidden-char.hint-reveal { color: #6C63FF; }  /* Indigo */
.vocab-word { color: #00BCD4; }               /* Teal */
```

---

## 📊 Data Integrity

### Common Issues
1. **Misaligned Pinyin**: Run validation script (see Step 4)
2. **Vocab Conflicts**: Don't include single-character vocab that's also a seek character
3. **Missing Characters**: Ensure seek characters exist in story text

### Cleanup Scripts
Located in `archive/` for reference:
- Pinyin corruption detection
- Seek character validation
- Vocabulary conflict resolution

---

## 🌐 Deployment

### GitHub Pages
1. Push to GitHub repository
2. Enable Pages in Settings → Pages
3. Select `main` branch
4. Access at `https://username.github.io/repo-name`

### Netlify / Vercel
1. Connect repository
2. Build command: (none - static site)
3. Publish directory: `.` (root)

---

## 📄 License & Credits

This project is an educational tool for Mandarin Chinese learners.

**Technologies:**
- Vanilla JavaScript (ES6+)
- HTML5 with Ruby annotations
- CSS3 with variables and flexbox
- JSON data storage

**Original Migration:**
Converted from Google Apps Script + Google Sheets to standalone web app.

---

## 🐛 Troubleshooting

### Pinyin Not Showing
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Check browser console for errors
- Verify `data.json` loads correctly

### Characters Not Clickable
- Check `seekCharacters` array in data.json
- Ensure characters exist in `storyText`

### Test Buttons Not Visible
- Add `?debug=true` to URL
- Check console for `DEBUG_MODE` value

---

**Happy Teaching! 🎓📖**

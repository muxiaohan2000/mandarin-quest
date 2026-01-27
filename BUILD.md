# 🏗️ Build Structure

This project uses a **dual-build** system to keep production clean while maintaining a robust debug environment.

---

## 📁 Directory Structure

```
Localized project/
├── /dist/               👈 PRODUCTION BUILD (Customer-Facing)
│   ├── index.html      (Debug mode hidden)
│   ├── app.js          (No console.logs)
│   ├── style.css
│   ├── data.json
│   ├── tests.js        (Loaded but not visible)
│   ├── images/
│   └── README.md
│
├── /dev/                👈 DEBUG BUILD (Development)
│   ├── index.html      (Debug mode enabled)
│   ├── app.js          (Full console.logs)
│   ├── style.css
│   ├── data.json
│   ├── tests.js        (Active & visible)
│   ├── images/
│   └── README.md
│
├── /archive/           (Migration artifacts & backups)
├── app.js              (Source - edit here)
├── index.html          (Source - edit here)
├── style.css           (Source - edit here)
├── data.json           (Source - edit here)
├── tests.js            (Source - edit here)
├── README.md           (Documentation)
└── BUILD.md            (This file)
```

---

## 🚀 Using Each Build

### Production Build (`/dist`)
**Audience:** End users  
**Features:**
- Debug UI hidden (buttons only appear with `?debug=true`)
- Console logs stripped
- Clean, minimal output
- Test suite loaded but dormant

**Run:**
```bash
# Option 1: Live Server
# Right-click dist/index.html → "Open with Live Server"

# Option 2: Python server
python3 -m http.server 5500 --directory dist
# Open http://localhost:5500
```

### Development Build (`/dev`)
**Audience:** Developers & testers  
**Features:**
- Full console logging enabled
- Test runner visible by default
- Reset Progress button visible
- Test Completion button visible
- Perfect for pinyin testing and debugging

**Run:**
```bash
# Option 1: Live Server
# Right-click dev/index.html → "Open with Live Server"

# Option 2: Python server
python3 -m http.server 5500 --directory dev
# Open http://localhost:5500
```

---

## 🔄 Build Workflow

### Step 1: Development
1. Edit files in **root directory** (`app.js`, `index.html`, `style.css`, `data.json`)
2. Test in `/dev` build
3. Run console tests: `runAllTests()`
4. Test new pinyin strings here before deployment

### Step 2: Rebuild (After Changes)
Run the build script to sync production:

```bash
python3 build.py
```

This will:
- Copy updated files to `/dist` and `/dev`
- Strip console logs from `/dist/app.js`
- Preserve debug logs in `/dev/app.js`

### Step 3: Production Deploy
- Deploy contents of `/dist` to your hosting (GitHub Pages, Netlify, etc.)
- Users get clean, logged-out experience
- Debug features still available with `?debug=true` (for admins)

---

## 🧪 Testing Pinyin Strings

### Workflow for New Lessons
1. Add lesson to **root** `data.json`
2. Copy updated `data.json` to both `/dev` and `/dist`
3. Open `/dev/index.html` (or `/dev/index.html?debug=true`)
4. Load the new lesson
5. Test pinyin alignment in console
6. Once validated, no rebuild needed (data.json is shared)

### Example: Testing Group_31 Pinyin
```
1. Edit root data.json with new pinyin for Group_31
2. cp data.json dev/data.json
3. Open dev/index.html?debug=true
4. Load Lesson 31 and verify alignment
5. Once confirmed, cp data.json dist/data.json
```

---

## 🛠️ Build Script (`build.py`)

Create this file in the root directory to automate builds:

```python
#!/usr/bin/env python3
import shutil
import re
from pathlib import Path

def build():
    root = Path('.')
    
    # Copy to dist and dev
    for target in ['dist', 'dev']:
        print(f"📦 Building /{target}...")
        
        for file in ['index.html', 'style.css', 'data.json', 'tests.js']:
            shutil.copy(f'{file}', f'{target}/{file}')
        
        # Handle app.js
        with open('app.js', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Strip console logs for production
        if target == 'dist':
            content = re.sub(r'^\s*console\.(log|error|warn|info)\([^;]*\);?\n', '', 
                           content, flags=re.MULTILINE)
        
        with open(f'{target}/app.js', 'w', encoding='utf-8') as f:
            f.write(content)
    
    # Copy assets
    for target in ['dist', 'dev']:
        if Path(f'{target}/images').exists():
            shutil.rmtree(f'{target}/images')
        shutil.copytree('images', f'{target}/images')
    
    print("✅ Build complete!")
    print("   /dist - Production (no logs, hidden debug UI)")
    print("   /dev  - Development (full logs, visible debug UI)")

if __name__ == '__main__':
    build()
```

**Run:**
```bash
python3 build.py
```

---

## 📋 Pre-Deployment Checklist

- [ ] Edit files in root directory (not in `/dist` or `/dev`)
- [ ] Test thoroughly in `/dev`
- [ ] Run `python3 build.py` to sync production
- [ ] Verify `/dist` files are updated
- [ ] Test `/dist/index.html` works without debug mode
- [ ] Test `/dist/index.html?debug=true` shows debug buttons
- [ ] Deploy `/dist` to hosting

---

## 🚫 What NOT to Do

❌ Don't edit files directly in `/dist` or `/dev` (changes will be overwritten on rebuild)  
❌ Don't deploy `/dev` to production  
❌ Don't forget to run build script after editing source files  
❌ Don't commit `/dist` and `/dev` to version control (add to `.gitignore`)

---

## 📝 .gitignore

If using Git, add this to `.gitignore`:

```
/dist/
/dev/
/archive/
.DS_Store
*.swp
.vscode/
```

---

## 🎯 Summary

| | `/dist` | `/dev` |
|---|---|---|
| **Purpose** | Production release | Development & testing |
| **Audience** | End users | Developers |
| **Console logs** | ❌ Stripped | ✅ Full |
| **Debug UI** | Hidden (needs `?debug=true`) | ✅ Visible |
| **Test Runner** | Available | ✅ Always visible |
| **Reset Button** | Hidden | ✅ Visible |
| **Deploy?** | ✅ YES | ❌ NO |

---

**Happy coding! 🚀**

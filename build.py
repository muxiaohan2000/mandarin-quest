#!/usr/bin/env python3
"""
Build Script for Mandarin Quest
Syncs source files to /dist (production) and /dev (debug) builds
Strips console logs from production version
"""

import shutil
import re
from pathlib import Path

def build():
    root = Path('.')
    
    print("🏗️  Building Mandarin Quest...")
    print("=" * 60)
    
    # Copy core files to both dist and dev
    for target in ['dist', 'dev']:
        print(f"\n📦 Updating /{target}...")
        
        # Copy static files
        for file in ['index.html', 'style.css', 'data.json', 'tests.js', 'README.md']:
            src = root / file
            dst = root / target / file
            if src.exists():
                shutil.copy(src, dst)
                print(f"   ✅ {file}")
        
        # Handle app.js with conditional processing
        app_src = root / 'app.js'
        app_dst = root / target / 'app.js'
        
        with open(app_src, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Strip console logs for production
        if target == 'dist':
            original_lines = content.count('\n')
            content = re.sub(
                r'^\s*console\.(log|error|warn|info)\([^;]*\);?\n', 
                '', 
                content, 
                flags=re.MULTILINE
            )
            removed_logs = original_lines - content.count('\n')
            print(f"   ✅ app.js (removed {removed_logs} console statements)")
        else:
            print(f"   ✅ app.js (with full logging)")
        
        with open(app_dst, 'w', encoding='utf-8') as f:
            f.write(content)
    
    # Sync images directory
    for target in ['dist', 'dev']:
        target_images = root / target / 'images'
        if target_images.exists():
            shutil.rmtree(target_images)
        shutil.copytree(root / 'images', target_images)
        print(f"\n   ✅ {target}/images synced")
    
    print("\n" + "=" * 60)
    print("✅ Build complete!\n")
    print("📊 Build Summary:")
    print("   /dist  - Production build (no console logs, hidden debug UI)")
    print("   /dev   - Debug build (full logs, visible debug UI)\n")
    print("🚀 Next steps:")
    print("   1. Test in /dev:  python3 -m http.server 5500 --directory dev")
    print("   2. Deploy /dist to your hosting provider")
    print("   3. Users can access debug mode with: ?debug=true parameter\n")

if __name__ == '__main__':
    try:
        build()
    except Exception as e:
        print(f"\n❌ Build failed: {e}")
        exit(1)

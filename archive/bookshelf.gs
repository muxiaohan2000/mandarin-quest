function doGet(e) {
  const template = HtmlService.createTemplateFromFile('16. bookshelfHTML');
  // Error handling: If fetching data fails, return an empty list so the page still loads
  try {
    template.allLessons = getAllLessonsData();
  } catch (err) {
    Logger.log("Error fetching data: " + err);
    template.allLessons = []; 
  }
  return template.evaluate()
      .setTitle("Mandarin Quest")
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getAllLessonsData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Textbook_Data");
  
  // Guard clause: Check if sheet exists
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // No data found

  const headers = data[0];
  
  // Find columns dynamically
  const col = {
    id: headers.indexOf("Lesson ID"),
    title: headers.indexOf("Story Title"),
    hero: headers.indexOf("heroAssignments"),
    story: headers.indexOf("Story (Simplified)"),
    pinyin: headers.indexOf("Story Pinyin"),
    vocab: headers.indexOf("Vocabulary List (JSON)"),
    chars: headers.indexOf("chars_to_learn"),
    image: headers.indexOf("image_link"),
    status: headers.indexOf("Status") // Look for "Status" specifically
  };

  // Map data with SAFETY checks
  const validLessons = [];

  // Start loop from 1 to skip header
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // 1. Skip empty rows
    if (!row[col.id] || !row[col.title]) continue;

    try {
      // 2. Image Logic - Use the proven working method
      let rawImg = (row[col.image] || "").toString().trim();
      let finalImg = "https://via.placeholder.com/400x600?text=No+Image";

      if (rawImg) {
        // Use the extraction method that worked before
        let cleanId = rawImg.includes('id=') ? 
                      rawImg.split('id=')[1].split('&')[0] : 
                      (rawImg.split('/d/')[1] || rawImg);
        
        cleanId = cleanId.split('/')[0].split('?')[0];
        
        // Use the Googleusercontent URL format that worked
        if (cleanId && cleanId.length >= 25) {
          finalImg = "https://lh3.googleusercontent.com/d/" + cleanId + "=s1000";
        }
      }

      // 3. JSON Logic (Safe Parse)
      let vocabList = [];
      try {
        let jsonStr = (row[col.vocab] || "[]").toString();
        // Simple fix for common excel copy-paste errors
        if (jsonStr.toLowerCase() === "false") jsonStr = "[]"; 
        vocabList = JSON.parse(jsonStr);
      } catch (e) {
        // If JSON is bad, just give empty vocab, don't crash
        vocabList = []; 
      }

      // 4. Status Logic (Default to Locked if empty, unless it's Lesson 1)
      let status = row[col.status] || "Locked";
      if (row[col.id] == 1 && status == "Locked") status = "Active"; // Force Lesson 1 open

      validLessons.push({
        lessonId: row[col.id],
        title: row[col.title],
        hero: row[col.hero],
        status: status,
        imageUrl: finalImg,
        storyText: row[col.story] || "No story content.",
        pinyinText: row[col.pinyin] || "",
        charsToMaster: (row[col.chars] || "").split(/[,，、]/).map(c => c.trim()).filter(c => c),
        vocabToExplain: vocabList
      });

    } catch (err) {
      Logger.log("Skipped Row " + (i+1) + " due to error: " + err);
      // Continue to next row
    }
  }

  return validLessons.sort((a, b) => a.lessonId - b.lessonId);
}

function completeLessonAndUnlockNext(currentLessonId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Textbook_Data");
  const data = sheet.getDataRange().getValues();
  
  // Find the column index for "Status" again to be safe
  const statusColIndex = data[0].indexOf("Status") + 1; // +1 for 1-based index
  
  if (statusColIndex === 0) return false; // Column not found

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == currentLessonId) {
      sheet.getRange(i + 1, statusColIndex).setValue("Completed");
      // Unlock next row if it exists
      if (i + 1 < data.length) {
         sheet.getRange(i + 2, statusColIndex).setValue("Active");
      }
      break;
    }
  }
  return true;
}

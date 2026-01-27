function doGet(e) {
  const template = HtmlService.createTemplateFromFile('14.4 APPShell3D');
  const allData = getLiveLessonData();
  
  if (!allData || allData.length === 0) {
    return HtmlService.createHtmlOutput("<h3 style='color:white;'>Error: No 'Active' lesson found.</h3>");
  }

  const currentLesson = allData[0];
  template.lessonData = allData;

  // 1. IMAGE FIX: Using your specific retrieval logic
  let rawId = currentLesson.driveImageId || "";
  if (rawId) {
    let cleanId = rawId.includes('id=') ? rawId.split('id=')[1].split('&')[0] : (rawId.split('/d/')[1] || rawId);
    cleanId = cleanId.split('/')[0].split('?')[0];
    template.IMAGE_URL = "https://lh3.googleusercontent.com/d/" + cleanId;
  } else {
    template.IMAGE_URL = "https://via.placeholder.com/1200x800?text=No+Background+Found";
  }

  return template.evaluate()
      .setTitle("Mandarin Quest")
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getLiveLessonData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Textbook_Data"); 
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const col = {
    hero: headers.indexOf("heroAssignments"),
    prompt: headers.indexOf("Visual Prompt"), 
    story: headers.indexOf("Story (Simplified)"),
    title: headers.indexOf("Story Title"), // Column F
    pinyin: headers.indexOf("Story Pinyin"),
    vocab: headers.indexOf("Vocabulary List (JSON)"), // Column I
    chars: headers.indexOf("chars_to_learn"),
    image: headers.indexOf("image_link"),
    status: 16 // Column Q
  };

  const activeRow = data.slice(1).find(row => row[col.status] === "Active");
  if (!activeRow) return [];

  const getVal = (idx) => (activeRow[idx] || "").toString();

  return [{
    titleName: getVal(col.title) || "本次冒险", 
    heroName: getVal(col.hero) || "主人公",
    driveImageId: getVal(col.image), // Passed to doGet for the cleanId logic
    senseiName: getVal(col.prompt).includes("[SENSEI GUIDE]:") ? getVal(col.prompt).split("[SENSEI GUIDE]:")[1].split("作为")[0].trim() : "Sensei",
    storyText: getVal(col.story),
    pinyinText: getVal(col.pinyin),
    charsToMaster: getVal(col.chars).split(/[,，、]/).map(c => c.trim()).filter(c => c),
    vocabToExplain: JSON.parse(getVal(col.vocab) || "[]")
  }];
}

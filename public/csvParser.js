export function parseCSV(csvText) {
    console.log("RAW CSV TEXT:", csvText);
  
    const firstLine = csvText.split(/\r?\n/)[0];
    const likelyDelimiter = firstLine.includes('\t') ? '\t' : ',';
    console.log("Detected delimiter:", JSON.stringify(likelyDelimiter));
  
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      trimHeaders: true,
      delimiter: likelyDelimiter
    });
  
    console.log("Parsed meta fields:", parsed.meta?.fields);
    console.log("Raw parsed data:", parsed.data);
  
    function getQuestions(entry) {
      return {
        question1: entry['Question 1'] || null,
        question2: entry['Question 2'] || null,
        question3: entry['Question 3'] || null
      };
    }
  
    function getPrayers(entry) {
      return {
        prayer1: entry['Prayer 1'] || null,
        prayer2: entry['Prayer 2'] || null,
        prayer3: entry['Prayer 3'] || null
      };
    }
  
    const finalData = parsed.data
      .filter(entry => Object.values(entry).some(v => v && v.trim() !== ''))
      .map(entry => {
        const questions = getQuestions(entry);
        const prayers = getPrayers(entry);
  
        if (entry.Day) {
          const dayClean = entry.Day.trim();
          const dayOffset = parseInt(dayClean, 10) - 1;
          if (!isNaN(dayOffset)) {
            const today = new Date();
            const baseDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const date = new Date(baseDate);
            date.setDate(baseDate.getDate() + dayOffset);
            entry.Date = date.toISOString().split('T')[0];
            delete entry.Day;
          }
        }
  
        entry.questions = [questions.question1, questions.question2, questions.question3];
        entry.prayers = [prayers.prayer1, prayers.prayer2, prayers.prayer3];
        return entry;
      });
  
    console.log("Final parsed JSON:", finalData);
    return finalData;
  }
  
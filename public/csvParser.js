// csvParser.js
export function parseCSV(text) {
    const [headerLine, ...lines] = text.trim().split('\n');
    const headers = headerLine.split(',');
  
    return lines.map(line => {
      const values = line.split(',');
      const entry = {};
      headers.forEach((h, i) => {
        entry[h.trim()] = values[i]?.trim() || '';
      });
      return entry;
    });
  }
  
// csvParser.js
export function parseCSV(text) {
    const [headerLine, ...lines] = text.trim().split('\n');
    const headers = headerLine.split(',').map(h => h.trim());
  
    return lines.map(line => {
        const values = line.split(',').map(v => v.trim());
        const entry = {};
        headers.forEach((header, i) => {
            let cell = values[i] || '';
            const lowerHeader = header.toLowerCase();
            
            if (lowerHeader === 'date') {
                // Try to parse the cell as a date
                const parsedDate = new Date(cell);
                if (!isNaN(parsedDate.getTime())) {
                    const year = parsedDate.getFullYear();
                    const month = (parsedDate.getMonth() + 1).toString().padStart(2, '0');
                    const day = parsedDate.getDate().toString().padStart(2, '0');
                    cell = `${year}-${month}-${day}`;
                }
            } else if (lowerHeader === 'day') {
                // Use current year and month with the day value
                const dayNum = parseInt(cell, 10);
                if (!isNaN(dayNum)) {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = (now.getMonth() + 1).toString().padStart(2, '0');
                    cell = `${year}-${month}-${dayNum.toString().padStart(2, '0')}`;
                }
            }
            
            entry[header] = cell;
        });
        return entry;
    });
}
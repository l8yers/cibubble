// adminutils.js

export function stripAccent(str) {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// New, robust CSV parser: throws on wrong header or row mismatch
export function parseCsv(text) {
  const lines = text.trim().split('\n').filter(line => line.trim() !== '');
  if (!lines.length) return [];
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  // Must match exactly:
  if (header.join(',') !== 'url,tags,country,level') {
    throw new Error("CSV header must be: url,tags,country,level");
  }
  if (header.length !== 4) {
    throw new Error("CSV must have exactly 4 columns: url,tags,country,level");
  }
  return lines.slice(1).map((line, idx) => {
    const values = line.split(',');
    if (values.length !== header.length) {
      throw new Error(`Row ${idx+2} column count mismatch (${values.length} vs ${header.length}): ${line}`);
    }
    const row = {};
    header.forEach((key, i) => row[key] = (values[i] || '').trim());
    return row;
  });
}

export function normalizeTags(raw) {
  let arr = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === 'string') arr = raw.split(',');
  arr = arr.map(t => String(t || '').trim().toLowerCase()).filter(Boolean);
  return [...new Set(arr)];
}

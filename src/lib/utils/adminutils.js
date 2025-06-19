export function stripAccent(str) {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeTags(raw) {
  let arr = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === 'string') arr = raw.split(',');
  arr = arr.map(t => String(t || '').trim().toLowerCase()).filter(Boolean);
  return [...new Set(arr)];
}

export function parseCsv(text) {
  const lines = text.trim().split('\n').filter(line => line.trim() !== '');
  if (!lines.length) return [];
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row = {};
    header.forEach((key, i) => row[key] = values[i] || '');
    return row;
  });
}

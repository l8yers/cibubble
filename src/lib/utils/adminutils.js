// adminutils.js

export function stripAccent(str) {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// New, robust CSV parser: throws on wrong header or row mismatch
// adminutils.js
import Papa from 'papaparse';

export function stripAccent(str) {
  return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function parseCsv(text) {
  // Parse CSV with header, handle quoted fields, skip empty lines
  const { data, errors } = Papa.parse(text.trim(), {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false // everything as string
  });

  if (errors && errors.length) {
    // Give a readable error, with row info if possible
    throw new Error(errors[0].message + (errors[0].row ? ` (Row ${errors[0].row + 2})` : ''));
  }

  // Required columns check
  if (
    !data.length ||
    !('url' in data[0]) ||
    !('tags' in data[0]) ||
    !('country' in data[0]) ||
    !('level' in data[0])
  ) {
    throw new Error('CSV header must be: url,tags,country,level');
  }

  // Return rows in normalised form
  return data.map(row => ({
    url: (row.url || '').trim(),
    tags: (row.tags || '').trim(),
    country: (row.country || '').trim(),
    level: (row.level || '').trim(),
  }));
}

// Normalise tags
export function normalizeTags(raw) {
  let arr = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === 'string') arr = raw.split(',');
  arr = arr.map(t => String(t || '').trim().toLowerCase()).filter(Boolean);
  return [...new Set(arr)];
}


export function normalizeTags(raw) {
  let arr = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === 'string') arr = raw.split(',');
  arr = arr.map(t => String(t || '').trim().toLowerCase()).filter(Boolean);
  return [...new Set(arr)];
}

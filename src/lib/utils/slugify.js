// src/lib/utils/slugify.js
export function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // remove non-word chars
    .replace(/\s+/g, '-')     // spaces to dashes
    .replace(/-+/g, '-')      // collapse dashes
    .replace(/^-+|-+$/g, ''); // trim leading/trailing dash
}

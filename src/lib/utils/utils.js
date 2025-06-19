export function difficultyLabel(level) {
  switch (level) {
    case 'easy': return 'Easy';
    case 'intermediate': return 'Intermediate';
    case 'advanced': return 'Advanced';
    // If you still want to show old "superbeginner", keep this:
    case 'superbeginner': return 'Super Beginner';
    default: return 'Not Yet Rated';
  }
}

export function difficultyColor(level) {
  switch (level) {
    case 'easy': return '#069C56';           // Use the old beginner color for easy
    case 'intermediate': return '#FF980E';
    case 'advanced': return '#D3212C';
    case 'superbeginner': return '#44c366';  // Optional, for legacy support
    default: return '#bbb';
  }
}

export function formatLength(sec) {
  if (!sec || isNaN(sec)) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

export function getBestThumbnail(video) {
  if (video.thumbnail) return video.thumbnail;
  if (video.id) return `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
  return '/images/no_thumb_nail.png';
}

export function levelOrder(level) {
  // Make sure 'easy' is in the order now
  return ['easy', 'intermediate', 'advanced'].indexOf(level);
  // Add 'superbeginner' at the start if you still support it
  // return ['superbeginner', 'easy', 'intermediate', 'advanced'].indexOf(level);
}

export function shuffleArray(array) {
  let arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

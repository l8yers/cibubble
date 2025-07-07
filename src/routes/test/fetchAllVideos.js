// Dummy fetchAllVideos.js for /routes/test
export async function fetchAllVideos() {
  return {
    data: [
      {
        id: '1',
        title: 'Easy Spanish - How to Order Coffee',
        level: 'easy',
        tags: ['food', 'conversation'],
        country: 'Spain',
        channel_name: 'Dreaming Spanish',
        thumbnail: 'https://placehold.co/320x180?text=Coffee',
        length: 540
      },
      {
        id: '2',
        title: 'History of Latin America',
        level: 'intermediate',
        tags: ['history', 'latin america'],
        country: 'Mexico',
        channel_name: 'Latin History TV',
        thumbnail: 'https://placehold.co/320x180?text=History',
        length: 1800
      },
      {
        id: '3',
        title: 'Science for Kids',
        level: 'advanced',
        tags: ['science', 'children'],
        country: 'Argentina',
        channel_name: 'ScienceNow',
        thumbnail: '',
        length: 660
      }
    ],
    error: null
  };
}

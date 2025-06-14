<script>
  import SortBar from '$lib/components/SortBar.svelte';
  let levels = [
    { value: 'easy', label: 'Easy' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];
  let sortChoices = [{ value: 'random', label: 'Random' }];
  let countryOptions = ['Spain'];
  let tagOptions = ['For Learners'];
  let selectedLevels = ['easy', 'intermediate', 'advanced'];
  let sortBy = 'random';
  let selectedCountry = '';
  let selectedTags = [];
  let hideWatched = false;
  let searchTerm = '';
  let searchOpen = false;

  function handleSortBarChange(e) {
    console.log('Changed', e.detail);
    selectedLevels = e.detail.selectedLevels;
    sortBy = e.detail.sortBy;
    selectedCountry = e.detail.selectedCountry;
    selectedTags = e.detail.selectedTags;
    hideWatched = e.detail.hideWatched;
    searchTerm = e.detail.searchTerm;
    searchOpen = e.detail.searchOpen;
  }
</script>

<SortBar
  {levels}
  {sortChoices}
  {countryOptions}
  {tagOptions}
  selectedLevels={selectedLevels}
  sortBy={sortBy}
  selectedCountry={selectedCountry}
  selectedTags={selectedTags}
  hideWatched={hideWatched}
  searchTerm={searchTerm}
  searchOpen={searchOpen}
  on:change={handleSortBarChange}
/>

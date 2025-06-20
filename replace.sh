find src -name '*.svelte' -exec sed -i.bak \
  -e "s/import { *onMount, *writable *} from 'svelte\/store';/import { onMount } from 'svelte';\nimport { writable } from 'svelte\/store';/g" \
  -e "s/import { *writable, *onMount *} from 'svelte\/store';/import { writable } from 'svelte\/store';\nimport { onMount } from 'svelte';/g" \
  {} +

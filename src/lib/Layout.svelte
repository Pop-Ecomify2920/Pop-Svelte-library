<script lang="ts">
  import { location } from 'svelte-spa-router'
  import Sidebar from '@/lib/components/Sidebar.svelte'
  import SearchBar from '@/lib/components/SearchBar.svelte'
  import { Menu } from 'lucide-svelte'
  
  $: path = $location.split('?')[0]
  $: isShellHidden = path === '/' || path === '/auth'
</script>

<div class="flex h-screen bg-background overflow-hidden">
  {#if !isShellHidden}
    <Sidebar />
  {/if}

  <main class="flex-1 flex flex-col overflow-hidden">
    {#if !isShellHidden}
      <header class="h-16 border-b border-border flex items-center px-4 md:px-6 gap-4">
        <button class="md:hidden p-2 rounded hover:bg-muted" aria-label="Open menu">
          <Menu size={24} />
        </button>
        <SearchBar />
      </header>
    {/if}

    <div class="flex-1 overflow-auto">
      <slot />
    </div>
  </main>
</div>

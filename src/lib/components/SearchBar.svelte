<script lang="ts">
  import { push } from 'svelte-spa-router'
  import { Search, X } from 'lucide-svelte'

  function handleSearch(value: string) {
    const trimmed = value.trim()
    const base = '/photos'
    const target = trimmed ? `${base}?q=${encodeURIComponent(trimmed)}` : base
    push(target)

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('search-changed', { detail: trimmed }))
    }
  }

  function handleClear() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('search-changed', { detail: '' }))
    }
    push('/photos')
  }
</script>

<div class="w-full max-w-4xl mx-auto pl-1 px-4">
  <div class="relative">
    <span class="z-10 absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground pointer-events-none">
      <Search size={24} />
    </span>
    <input
      type="text"
      class="pl-16 pr-12 h-14 text-lg rounded-full transition-shadow auth-input w-full"
      placeholder="Search your photos"
      on:input={(e) => handleSearch((e.currentTarget as HTMLInputElement).value)}
      aria-label="Search"
    />
    <button
      type="button"
      class="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      on:click={handleClear}
      aria-label="Clear search"
    >
      <X size={22} />
    </button>
  </div>
</div>



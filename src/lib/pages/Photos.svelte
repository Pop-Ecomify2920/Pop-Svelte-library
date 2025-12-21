<script lang="ts">
  // Photos page using uploaded data (IndexedDB) with viewer, selection, and search.
  import { onMount } from 'svelte'
  import type { Photo } from '@/lib/stores/photos'
  import { uploadedPhotos } from '@/lib/stores/photos'
  import PhotoViewer from '@/lib/components/PhotoViewer.svelte'
  import { photosStore } from '@/lib/stores/photos'
  import RequireAuth from '@/lib/components/RequireAuth.svelte'
  import { albums, type Album } from '@/lib/stores/albumsLocal'
  import { addPhotosToAlbum } from '@/lib/stores/albumPhotos'

  let searchQuery = ''
  let viewerOpen = false
  let currentPhotoIndex = 0
  let selectedIds: number[] = []
  let lastSelectedIndex: number | null = null
  let addToAlbumOpen = false
  let selectedAlbumId: string | null = null
  let newAlbumName = ''

  function updateSearchFromUrl() {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    searchQuery = params.get('q') ?? ''
  }

  onMount(() => {
    updateSearchFromUrl()

    // Restore viewer state from localStorage
    const savedViewer = localStorage.getItem('photo-viewer-state')
    if (savedViewer) {
      try {
        const { open, index } = JSON.parse(savedViewer)
        if (open && allPhotos[index]) {
          viewerOpen = true
          currentPhotoIndex = index
        }
      } catch {}
    }

    const handler = (event: Event) => {
      const custom = event as CustomEvent<string>
      searchQuery = custom.detail ?? ''
    }

    window.addEventListener('search-changed', handler as EventListener)

    return () => {
      window.removeEventListener('search-changed', handler as EventListener)
    }
  })

  $: allPhotos = [...$uploadedPhotos]

  $: filteredPhotos =
    searchQuery.trim() === ''
      ? allPhotos
      : allPhotos.filter((photo) => photo.alt.toLowerCase().includes(searchQuery.toLowerCase()))

  $: grouped = filteredPhotos.reduce<Record<string, Photo[]>>((acc, photo) => {
    if (!acc[photo.date]) acc[photo.date] = []
    acc[photo.date].push(photo)
    return acc
  }, {})

  $: {
    // Persist viewer state
    if (viewerOpen) {
      localStorage.setItem('photo-viewer-state', JSON.stringify({ open: true, index: currentPhotoIndex }))
    } else {
      localStorage.removeItem('photo-viewer-state')
    }
  }

  function openViewer(photoId: number) {
    const idx = allPhotos.findIndex((p) => p.id === photoId)
    if (idx >= 0) {
      currentPhotoIndex = idx
      viewerOpen = true
      // Save state immediately
      localStorage.setItem('photo-viewer-state', JSON.stringify({ open: true, index: idx }))
    }
  }

  function isSelected(id: number) {
    return selectedIds.includes(id)
  }

  function toggleSelect(id: number) {
    if (isSelected(id)) {
      selectedIds = selectedIds.filter((x) => x !== id)
    } else {
      selectedIds = [...selectedIds, id]
    }
    lastSelectedIndex = allPhotos.findIndex((p) => p.id === id)
  }

  function handleTileClick(photoId: number, e: MouseEvent) {
    // Shift+click range select when we already have an anchor
    if ((e as MouseEvent).shiftKey && lastSelectedIndex !== null) {
      const currentIndex = allPhotos.findIndex((p) => p.id === photoId)
      const start = Math.min(currentIndex, lastSelectedIndex)
      const end = Math.max(currentIndex, lastSelectedIndex)
      const rangeIds = allPhotos.slice(start, end + 1).map((p) => p.id)
      selectedIds = Array.from(new Set([...selectedIds, ...rangeIds]))
      lastSelectedIndex = currentIndex
      return
    }

    openViewer(photoId)
  }

  async function deleteSelected() {
    const ids = [...selectedIds]
    for (const id of ids) {
      await photosStore.deletePhoto(id)
    }
    selectedIds = []
  }

  function openAddToAlbum() {
    if (selectedIds.length === 0) return
    const firstAlbum = $albums[0]
    selectedAlbumId = firstAlbum ? firstAlbum.id : null
    newAlbumName = ''
    addToAlbumOpen = true
  }

  function confirmAddToAlbum() {
    let targetId = selectedAlbumId

    if (!targetId && newAlbumName.trim()) {
      const created = albums.update((prev) => {
        const now = new Date().toISOString()
        const newAlbum: Album = {
          id: `album_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          name: newAlbumName.trim(),
          description: null,
          cover_photo_id: null,
          is_shared: false,
          created_at: now,
          updated_at: now,
          user_id: 'local_user',
        }
        return [newAlbum, ...prev]
      })
      // albums.update doesn't return value; recompute from $albums
      targetId = $albums[0]?.id ?? null
    }

    if (!targetId) return

    addPhotosToAlbum(targetId, selectedIds)
    addToAlbumOpen = false
  }
</script>

<RequireAuth>
  <div class="h-full flex flex-col bg-immich-bg dark:bg-immich-dark-bg">
    <div class="flex-1 overflow-auto px-4 py-4 md:px-6 md:py-6 space-y-6">
      {#if allPhotos.length === 0}
        <div class="flex items-center justify-center h-full">
          <div class="auth-card max-w-lg w-full text-center space-y-4">
            <h2 class="text-2xl font-semibold text-immich-fg dark:text-immich-dark-fg">No photos yet</h2>
            <p class="text-muted-foreground">Use the Upload button in the sidebar to add your first photos.</p>
          </div>
        </div>
      {:else}
        {#each Object.entries(grouped) as [date, photos]}
          <section class="space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-immich-fg dark:text-immich-dark-fg sticky top-0 bg-immich-bg dark:bg-immich-dark-bg py-2">
                {date}
              </h2>
            </div>

            <div class="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-1">
              {#each photos as photo}
                <button
                  type="button"
                  class="relative group cursor-pointer overflow-hidden text-left"
                  on:click={(e) => handleTileClick(photo.id, e)}
                  aria-label={`Open ${photo.alt}`}
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    class="w-full h-40 sm:h-44 md:h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />

                  <div
                    class={`absolute inset-0 transition-all duration-200 ${
                      isSelected(photo.id) ? 'bg-immich-primary/30 ring-2 ring-immich-primary ring-inset' : 'bg-black/0 group-hover:bg-black/20'
                    }`}
                    aria-hidden="true"
                  ></div>

                  <div
                    class={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 transition-all duration-200 flex items-center justify-center z-10 ${
                      isSelected(photo.id) ? 'bg-immich-primary border-immich-primary' : 'border-white/70 opacity-0 group-hover:opacity-100'
                    }`}
                    role="button"
                    tabindex="0"
                    aria-label={isSelected(photo.id) ? 'Deselect photo' : 'Select photo'}
                    aria-pressed={isSelected(photo.id)}
                    on:click|stopPropagation={() => toggleSelect(photo.id)}
                    on:keydown|stopPropagation={(e) => {
                      const ev = e as KeyboardEvent
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault()
                        toggleSelect(photo.id)
                      }
                    }}
                  >
                    {#if isSelected(photo.id)}
                      <span class="text-white text-sm leading-none">✓</span>
                    {/if}
                  </div>
                </button>
              {/each}
            </div>
          </section>
        {/each}
      {/if}
    </div>
  </div>

{#if selectedIds.length > 0}
  <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-immich-card dark:bg-immich-dark-gray rounded-full px-6 py-3 shadow-lg border border-border">
    <div class="flex items-center gap-4">
      <span class="text-sm font-medium text-immich-fg dark:text-immich-dark-fg">
        {selectedIds.length} selected
      </span>
      <div class="flex gap-2">
        <button type="button" class="px-3 py-1.5    bg-secondary text-foreground hover:bg-accent text-sm" on:click={() => (selectedIds = [])}>
          Clear
        </button>
        <button
          type="button"
          class="px-3 py-1.5    bg-secondary text-foreground hover:bg-accent text-sm"
          on:click={openAddToAlbum}
        >
          Add to album
        </button>
        <button
          type="button"
          class="px-3 py-1.5    bg-destructive text-destructive-foreground text-sm"
          on:click={deleteSelected}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
  {/if}

  <PhotoViewer
    photos={allPhotos}
    isOpen={viewerOpen}
    currentIndex={currentPhotoIndex}
    onClose={() => {
      viewerOpen = false
      localStorage.removeItem('photo-viewer-state')
    }}
    onNavigate={(idx) => {
      currentPhotoIndex = idx
      localStorage.setItem('photo-viewer-state', JSON.stringify({ open: true, index: idx }))
    }}
    onDelete={async (photoId) => {
      try {
        await photosStore.deletePhoto(photoId)
        // If we deleted the current photo, keep viewer open but clamp index
        const nextLen = allPhotos.length - 1
        if (nextLen <= 0) {
          viewerOpen = false
          localStorage.removeItem('photo-viewer-state')
        } else if (currentPhotoIndex >= nextLen) {
          currentPhotoIndex = nextLen - 1
          localStorage.setItem('photo-viewer-state', JSON.stringify({ open: true, index: currentPhotoIndex }))
        }
      } catch (e) {
        console.error('Failed to delete photo', e)
      }
    }}
  />

  {#if addToAlbumOpen}
    <div class="fixed inset-0 z-40">
      <div class="absolute inset-0 bg-black/50" on:click={() => (addToAlbumOpen = false)} aria-hidden="true"></div>
      <div class="absolute inset-0 flex items-center justify-center p-4">
        <div class="auth-card max-w-lg w-full space-y-4">
          <h2 class="text-xl font-semibold text-immich-fg dark:text-immich-dark-fg">Add to album</h2>
          {#if $albums.length > 0}
            <div class="space-y-2">
              <label class="immich-form-label" for="existing-album">Choose existing album</label>
              <select
                id="existing-album"
                class="immich-form-input"
                bind:value={selectedAlbumId}
              >
                {#each $albums as a}
                  <option value={a.id}>{a.name}</option>
                {/each}
              </select>
            </div>
          {/if}

          <div class="space-y-2">
            <label class="immich-form-label" for="new-album">Or create new album</label>
            <input
              id="new-album"
              class="immich-form-input"
              bind:value={newAlbumName}
              placeholder="New album name"
            />
          </div>

          <div class="mt-4 flex justify-end gap-2">
            <button
              type="button"
              class="px-4 py-2    bg-secondary"
              on:click={() => (addToAlbumOpen = false)}
            >
              Cancel
            </button>
            <button
              type="button"
              class="px-4 py-2    bg-immich-primary text-primary-foreground"
              on:click={confirmAddToAlbum}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}
</RequireAuth>


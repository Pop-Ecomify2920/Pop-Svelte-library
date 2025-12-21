<script lang="ts">
  import { onMount } from 'svelte'
  import { albums, type Album, updateAlbum } from '@/lib/stores/albumsLocal'
  import { uploadedPhotos } from '@/lib/stores/photos'
  import type { Photo } from '@/lib/stores/photos'
  import { addPhotosToAlbum, getAlbumPhotos, removePhotoFromAlbum } from '@/lib/stores/albumPhotos'
  import RequireAuth from '@/lib/components/RequireAuth.svelte'

  export let params: { albumId: string }

  let album: Album | undefined
  let albumPhotoIds: number[] = []
  let addOpen = false
  let selectedToAdd: number[] = []

  $: albumId = params?.albumId

  function refreshAlbumPhotos() {
    albumPhotoIds = getAlbumPhotos(albumId)
  }

  $: albumPhotos = ($uploadedPhotos as Photo[]).filter((p) => albumPhotoIds.includes(p.id))

  onMount(() => {
    const unsubscribe = albums.subscribe((list) => {
      album = list.find((a) => a.id === albumId)
    })
    refreshAlbumPhotos()
    return () => unsubscribe()
  })

  function openAdd() {
    selectedToAdd = [...albumPhotoIds]
    addOpen = true
  }

  function togglePick(id: number) {
    if (selectedToAdd.includes(id)) selectedToAdd = selectedToAdd.filter((x) => x !== id)
    else selectedToAdd = [...selectedToAdd, id]
  }

  function saveAdd() {
    addPhotosToAlbum(albumId, selectedToAdd)
    addOpen = false
    refreshAlbumPhotos()
  }
</script>

<RequireAuth>
  <div class="h-full bg-immich-bg dark:bg-immich-dark-bg">
    <div class="px-4 py-4 md:px-6 md:py-6 space-y-6">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold text-immich-fg dark:text-immich-dark-fg truncate">{album?.name ?? 'Album'}</h1>
        {#if album?.description}
          <p class="text-muted-foreground">{album.description}</p>
        {/if}
        <p class="text-xs text-muted-foreground mt-2">{albumPhotoIds.length} photos</p>
      </div>

      <button type="button" class="px-4 py-2    bg-immich-primary text-primary-foreground" on:click={openAdd}>
        Manage photos
      </button>
    </div>

    {#if albumPhotoIds.length === 0}
      <div class="auth-card max-w-xl">
        <p class="text-muted-foreground">No photos in this album yet. Click “Manage photos” to add some.</p>
      </div>
    {:else}
      <div class="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-1">
        {#each albumPhotos as photo (photo.id)}
          <div class="relative group overflow-hidden   ">
            <img src={photo.src} alt={photo.alt} class="w-full h-40 sm:h-44 md:h-48 object-cover" loading="lazy" />
            <button
              type="button"
              class="absolute top-2 left-2 px-2 py-1    bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              on:click={() => {
                if (album) {
                  updateAlbum(albumId, {
                    coverPhotoId: String(photo.id),
                  })
                }
              }}
            >
              Set cover
            </button>
            <button
              type="button"
              class="absolute top-2 right-2 px-2 py-1    bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              on:click={() => {
                removePhotoFromAlbum(albumId, photo.id)
                refreshAlbumPhotos()
              }}
            >
              Remove
            </button>
          </div>
        {/each}
      </div>
    {/if}
    </div>

    {#if addOpen}
    <div class="fixed inset-0 z-40">
      <div class="absolute inset-0 bg-black/50" on:click={() => (addOpen = false)} aria-hidden="true"></div>
      <div class="absolute inset-0 flex items-center justify-center p-4">
        <div class="auth-card max-w-3xl w-full">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold text-immich-fg dark:text-immich-dark-fg">Select photos</h2>
            <button type="button" class="px-3 py-1.5    bg-secondary" on:click={() => (addOpen = false)}>Close</button>
          </div>

          <p class="text-sm text-muted-foreground mt-2">Pick from uploaded photos (IndexedDB).</p>

          <div class="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1 max-h-[55vh] overflow-auto">
            {#each $uploadedPhotos as p (p.id)}
              <button
                type="button"
                class={`relative overflow-hidden    ${selectedToAdd.includes(p.id) ? 'ring-2 ring-immich-primary' : 'ring-0'}`}
                on:click={() => togglePick(p.id)}
                aria-label="Toggle photo"
              >
                <img src={p.src} alt={p.alt} class="w-full h-24 object-cover" loading="lazy" />
              </button>
            {/each}
          </div>

          <div class="mt-6 flex justify-end gap-2">
            <button type="button" class="px-4 py-2    bg-secondary" on:click={() => (addOpen = false)}>Cancel</button>
            <button type="button" class="px-4 py-2    bg-immich-primary text-primary-foreground" on:click={saveAdd}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
    {/if}
  </div>
</RequireAuth>


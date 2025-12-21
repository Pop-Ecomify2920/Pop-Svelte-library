<script lang="ts">
  import { albums, createAlbum, deleteAlbum, updateAlbum, type Album } from '@/lib/stores/albumsLocal'
  import { getAlbumPhotos, getPhotoCount } from '@/lib/stores/albumPhotos'
  import { uploadedPhotos } from '@/lib/stores/photos'
  import { push } from 'svelte-spa-router'
  import RequireAuth from '@/lib/components/RequireAuth.svelte'

  let createOpen = false
  let editOpen = false
  let editAlbum: Album | null = null
  let name = ''
  let description = ''
  const nameId = 'album-name'
  const descId = 'album-description'

  function getCoverPhoto(albumId: string) {
    const photoIds = getAlbumPhotos(albumId)
    const firstId = photoIds[0]
    if (!firstId) return null
    return $uploadedPhotos.find((p) => p.id === firstId) ?? null
  }

  function openCreate() {
    name = ''
    description = ''
    createOpen = true
  }

  function submitCreate() {
    if (!name.trim()) return
    createAlbum({ name: name.trim(), description: description.trim() || null })
    createOpen = false
  }

  function openEdit(a: Album) {
    editAlbum = a
    name = a.name
    description = a.description ?? ''
    editOpen = true
  }

  function submitEdit() {
    if (!editAlbum) return
    if (!name.trim()) return
    updateAlbum(editAlbum.id, { name: name.trim(), description: description.trim() || null })
    editOpen = false
    editAlbum = null
  }
</script>

<RequireAuth>
  <div class="h-full bg-immich-bg dark:bg-immich-dark-bg">
    <div class="px-4 py-4 md:px-6 md:py-6 space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-semibold text-immich-fg dark:text-immich-dark-fg">Albums</h1>
        <button type="button" class="px-4 py-2    bg-immich-primary text-primary-foreground" on:click={openCreate}>
          Create album
        </button>
      </div>

    {#if $albums.length === 0}
      <div class="auth-card max-w-xl">
        <p class="text-muted-foreground">No albums yet. Create your first album.</p>
      </div>
    {:else}
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {#each $albums as a (a.id)}
          {@const cover = getCoverPhoto(a.id)}
          <div class="bg-immich-card dark:bg-immich-dark-gray rounded-2xl border border-border overflow-hidden">
            {#if cover}
              <button
                type="button"
                class="block w-full h-40 overflow-hidden"
                on:click={() => push(`/albums/${a.id}`)}
                aria-label={`Open album ${a.name}`}
              >
                <img src={cover.src} alt={cover.alt} class="w-full h-full object-cover" loading="lazy" />
              </button>
            {/if}
            <div class="p-4 flex items-start justify-between gap-3">
              <div class="min-w-0">
                <button
                  type="button"
                  class="text-left w-full"
                  on:click={() => push(`/albums/${a.id}`)}
                  aria-label={`Open album ${a.name}`}
                >
                  <h2 class="font-semibold text-immich-fg dark:text-immich-dark-fg truncate">{a.name}</h2>
                  {#if a.description}
                    <p class="text-sm text-muted-foreground line-clamp-2">{a.description}</p>
                  {/if}
                </button>
                <p class="text-xs text-muted-foreground mt-2">{getPhotoCount(a.id)} photos</p>
              </div>

              <div class="flex gap-2">
                <button type="button" class="px-3 py-1.5    bg-secondary text-foreground text-sm" on:click={() => openEdit(a)}>
                  Edit
                </button>
                <button
                  type="button"
                  class="px-3 py-1.5    bg-destructive text-destructive-foreground text-sm"
                  on:click={() => deleteAlbum(a.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
    </div>

  {#if createOpen}
    <div class="fixed inset-0 z-40">
      <div class="absolute inset-0 bg-black/50" on:click={() => (createOpen = false)} aria-hidden="true"></div>
      <div class="absolute inset-0 flex items-center justify-center p-4">
        <div class="auth-card max-w-lg w-full">
          <h2 class="text-xl font-semibold text-immich-fg dark:text-immich-dark-fg mb-4">Create album</h2>
          <div class="space-y-3">
            <div>
              <label class="immich-form-label" for={nameId}>Name</label>
              <input id={nameId} class="immich-form-input" bind:value={name} placeholder="Album name" />
            </div>
            <div>
              <label class="immich-form-label" for={descId}>Description</label>
              <input id={descId} class="immich-form-input" bind:value={description} placeholder="Optional description" />
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button type="button" class="px-4 py-2    bg-secondary" on:click={() => (createOpen = false)}>Cancel</button>
            <button type="button" class="px-4 py-2    bg-immich-primary text-primary-foreground" on:click={submitCreate}>
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

    {#if editOpen && editAlbum}
    <div class="fixed inset-0 z-40">
      <div class="absolute inset-0 bg-black/50" on:click={() => (editOpen = false)} aria-hidden="true"></div>
      <div class="absolute inset-0 flex items-center justify-center p-4">
        <div class="auth-card max-w-lg w-full">
          <h2 class="text-xl font-semibold text-immich-fg dark:text-immich-dark-fg mb-4">Edit album</h2>
          <div class="space-y-3">
            <div>
              <label class="immich-form-label" for={nameId}>Name</label>
              <input id={nameId} class="immich-form-input" bind:value={name} />
            </div>
            <div>
              <label class="immich-form-label" for={descId}>Description</label>
              <input id={descId} class="immich-form-input" bind:value={description} />
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button type="button" class="px-4 py-2    bg-secondary" on:click={() => (editOpen = false)}>Cancel</button>
            <button type="button" class="px-4 py-2    bg-immich-primary text-primary-foreground" on:click={submitEdit}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
    {/if}
  </div>
</RequireAuth>


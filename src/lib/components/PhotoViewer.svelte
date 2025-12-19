<script lang="ts">
  import type { Photo } from '@/lib/stores/photos'

  export let photos: Photo[] = []
  export let isOpen = false
  export let currentIndex = 0
  export let onClose: () => void = () => {}
  export let onDelete: (photoId: number) => void | Promise<void> = () => {}
  export let onNavigate: (nextIndex: number) => void = () => {}

  $: current = photos[currentIndex]

  function prev() {
    if (!photos.length) return
    onNavigate((currentIndex - 1 + photos.length) % photos.length)
  }

  function next() {
    if (!photos.length) return
    onNavigate((currentIndex + 1) % photos.length)
  }

  async function handleDelete() {
    if (!current) return
    await onDelete(current.id)
  }

  function handleDownload() {
    if (typeof window === 'undefined' || !current) return
    const link = document.createElement('a')
    link.href = current.src
    link.download = (current.alt || 'photo') + '.jpg'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50">
    <div class="absolute inset-0 bg-black/70" on:click={onClose} aria-hidden="true"></div>

    <div class="absolute inset-0 flex items-center justify-center p-4">
      <div
        class="relative w-full max-w-5xl max-h-[90vh] bg-immich-bg dark:bg-immich-dark-bg rounded-2xl overflow-hidden border border-border shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-center justify-between px-4 py-3 border-b border-border">
          <div class="min-w-0">
            <p class="font-semibold text-immich-fg dark:text-immich-dark-fg truncate">
              {current?.alt ?? 'Photo'}
            </p>
            <p class="text-xs text-muted-foreground">
              {currentIndex + 1} / {photos.length}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-accent text-sm"
              on:click={handleDownload}
              disabled={!current}
            >
              Download
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-accent text-sm"
              on:click={handleDelete}
              disabled={!current}
            >
              Delete
            </button>
            <button
              type="button"
              class="px-3 py-1.5 rounded-lg bg-secondary text-foreground hover:bg-accent text-sm"
              on:click={onClose}
            >
              Close
            </button>
          </div>
        </div>

        <div class="relative bg-black flex items-center justify-center">
          {#if current}
            <img
              src={current.src}
              alt={current.alt}
              class="max-h-[calc(90vh-56px)] w-full object-contain"
              loading="eager"
            />
          {/if}

          <button
            type="button"
            class="absolute left-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg bg-black/40 text-white hover:bg-black/60"
            on:click={prev}
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg bg-black/40 text-white hover:bg-black/60"
            on:click={next}
            aria-label="Next photo"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}



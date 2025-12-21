<script lang="ts">
  import type { Photo } from '@/lib/stores/photos'
  import { Download, Trash2, ChevronLeft, FileSlidersIcon, ChevronRight, Heart, MoreVertical, Info } from 'lucide-svelte'
  import { onDestroy } from 'svelte';

  export let photos: Photo[] = []
  export let isOpen = false
  export let currentIndex = 0
  export let onClose: () => void = () => {}
  export let onDelete: (photoId: number) => void | Promise<void> = () => {}
  export let onNavigate: (nextIndex: number) => void = () => {}

  $: current = photos[currentIndex]

  // Helper to get image type from src
  $: imageType = (() => {
    if (!current?.src) return '';
    const match = current.src.match(/\.([a-zA-Z0-9]+)$/);
    if (match) return match[1].toUpperCase();
    // fallback for data URLs
    if (current.src.startsWith('data:image/')) {
      const type = current.src.split(';')[0].split('/')[1];
      return type ? type.toUpperCase() : '';
    }
    return '';
  })();

  let isFavorite = false;
  let showInfo = false;
  let isSlideshow = false;
  let slideshowInterval: ReturnType<typeof setInterval> | null = null;

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

  function handleInfo() {
    showInfo = !showInfo;
  }

  function handleFavorite() {
    isFavorite = !isFavorite;
    // Optionally, persist favorite state (e.g., localStorage or store)
  }

  function handleSlider() {
    if (!isSlideshow) {
      enterFullscreen();
      startSlideshow();
    } else {
      exitFullscreen();
      stopSlideshow();
    }
    isSlideshow = !isSlideshow;
  }

  function startSlideshow() {
    if (slideshowInterval) return;
    slideshowInterval = setInterval(() => {
      next();
    }, 2000); // 2 seconds per slide
  }

  function stopSlideshow() {
    if (slideshowInterval) {
      clearInterval(slideshowInterval);
      slideshowInterval = null;
    }
  }

  function enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).msRequestFullscreen) {
      (elem as any).msRequestFullscreen();
    }
  }

  function exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  }

  // Clean up slideshow on close or component destroy
  $: if (!isOpen) {
    stopSlideshow();
    if (isSlideshow) {
      exitFullscreen();
      isSlideshow = false;
    }
  }

  onDestroy(() => {
    stopSlideshow();
    if (isSlideshow) exitFullscreen();
  });
</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 bg-black flex flex-col">
    <div class="flex items-center justify-between px-6 py-4 w-full absolute top-0 left-0 z-10">
      <div class="flex items-center gap-2">
        <button type="button" class="p-2 rounded-full hover:bg-black/30" on:click={onClose} aria-label="Close">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="flex items-center gap-2">
        <button type="button" class="p-2 rounded-full hover:bg-black/30" aria-label="Info" on:click={handleInfo}>
          <Info size={22} />
        </button>
        <button type="button" class="p-2 rounded-full hover:bg-black/30" aria-label="Favorite" on:click={handleFavorite}>
          <Heart size={22} style="color: {isFavorite ? 'red' : 'inherit'}" />
        </button>
        <button type="button" class="p-2 rounded-full hover:bg-black/30" on:click={handleDownload} aria-label="Download" disabled={!current}>
          <Download size={22} />
        </button>
        <button type="button" class="p-2 rounded-full hover:bg-black/30" on:click={handleDelete} aria-label="Delete" disabled={!current}>
          <Trash2 size={22} />
        </button>
        <button type="button" class="p-2 rounded-full hover:bg-black/30" on:click={handleSlider} aria-label="Slideshow">
          <FileSlidersIcon size={22} style="color: {isSlideshow ? '#3b82f6' : 'inherit'}" />
        </button>
      </div>
    </div>
    <div class="flex-1 flex items-center justify-center relative h-full">
      <button type="button" class="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-black/30 z-10" style="transform: translateY(-50%);" on:click={prev} aria-label="Previous photo">
        <ChevronLeft size={32} />
      </button>
      {#if current}
        <img
          src={current.src}
          alt={current.alt}
          class="max-h-full max-w-full object-contain mx-auto"
          loading="eager"
        />
      {/if}
      <button type="button" class="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-black/30 z-10" style="transform: translateY(-50%);" on:click={next} aria-label="Next photo">
        <ChevronRight size={32} />
      </button>
    </div>
    <div class="w-full flex justify-center items-center py-2 bg-black/40 absolute bottom-0 left-0 z-10">
      <span class="text-white text-sm px-2 truncate max-w-[60vw]">{current?.alt ?? 'Photo'} ({currentIndex + 1} / {photos.length}) {#if imageType}· Type: {imageType}{/if}</span>
    </div>
    {#if showInfo && current}
      <div class="absolute top-20 right-8 bg-white/90 text-black rounded shadow-lg p-4 z-50 min-w-[220px]">
        <div class="font-bold mb-2">Photo Info</div>
        <div><b>Name:</b> {current.alt}</div>
        <div><b>Size:</b> {current.fileSize ? (current.fileSize / 1024).toFixed(1) + ' KB' : 'N/A'}</div>
        <div><b>Dimensions:</b> {current.width} x {current.height}</div>
        <div><b>Date:</b> {current.date}</div>
        <button class="mt-2 px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" on:click={handleInfo}>Close</button>
      </div>
    {/if}
  </div>
{/if}



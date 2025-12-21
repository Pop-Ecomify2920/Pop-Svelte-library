<script lang="ts">
  import { get } from 'svelte/store'
  import { push, location } from 'svelte-spa-router'
  import { theme } from '@/lib/stores/theme'
  import { photosStore, uploadedPhotos } from '@/lib/stores/photos'
  import { albums } from '@/lib/stores/albumsLocal'
  import { LogOut, Upload, Image, Folder, ChevronLeft, ChevronRight, Sun, Moon } from 'lucide-svelte'
  import { onMount } from 'svelte';

  let sidebarOpen = true
  let fileInput: HTMLInputElement | null = null
  let isMobileSidebar = false;
  let mobileSidebarOpen = false;

  const navItems = [
    { path: '/photos', label: 'Photos', color: 'bg-blue-500' },
    { path: '/albums', label: 'Albums', color: 'bg-purple-500' }
  ] as const

  type UserData = {
    name?: string
    phone?: string
    plan?: string
    diskSpace?: { used?: number; total?: number }
    files?: { used?: number; total?: number }
  }

  const fallbackUser: UserData = {
    name: 'User',
    phone: '+1234567890',
    plan: 'Free Plan',
    diskSpace: { used: 0, total: 10240 },
    files: { used: 0, total: 100 }
  }

  $: rawUser = (() => {
    try {
      const r = localStorage.getItem('user')
      return r ? JSON.parse(r) : fallbackUser
    } catch {
      return fallbackUser
    }
  })()

  $: user = { ...fallbackUser, ...rawUser }

  $: usedBytes = ($uploadedPhotos || []).reduce((s, p) => s + (p.fileSize ?? 0), 0)
  $: usedMiB = usedBytes / (1024 * 1024)
  $: totalMiB = user.diskSpace?.total ?? 10240
  $: diskPct = totalMiB > 0 ? Math.min(100, (usedMiB / totalMiB) * 100) : 0
  $: fileCount = ($uploadedPhotos || []).length
  $: uploadPct = get(photosStore.uploadProgress)

  // current route-driven values
  $: currentPath = $location.split('?')[0]
  $: isPhotosRoute = currentPath === '/photos'
  $: isAlbumsRoute = currentPath === '/albums'

  function handleNav(path: string) {
    push(path)
  }

  function handleSignOut() {
    localStorage.removeItem('user')
    push('/auth')
  }

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen
  }

  function handleMenuClick() {
    mobileSidebarOpen = !mobileSidebarOpen;
  }

  function handleResize() {
    isMobileSidebar = window.innerWidth <= 425;
    if (!isMobileSidebar) mobileSidebarOpen = false;
  }

  onMount(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  });

  function getAvatarColor(name?: string) {
    const colors = ['bg-pink-500', 'bg-purple-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-orange-500']
    const index = name && name.length ? name.charCodeAt(0) % colors.length : 0
    return colors[index]
  }

  function getAlbumCoverSrc(album: any) {
    if (!album?.cover_photo_id) return null
    const id = Number(album.cover_photo_id)
    const found = ($uploadedPhotos || []).find((p) => p.id === id || String(p.id) === String(album.cover_photo_id))
    return found ? found.src : null
  }
</script>

{#if isMobileSidebar}
  <button class="absolute top-4 left-4 z-30 bg-[#232428] p-2    text-white" on:click={handleMenuClick} aria-label="Open sidebar">
    <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
  </button>
  {#if mobileSidebarOpen}
    <div
      class="fixed inset-0 z-40 bg-black/60"
      role="button"
      tabindex="0"
      aria-label="Close sidebar overlay"
      on:click={() => mobileSidebarOpen = false}
      on:keydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          mobileSidebarOpen = false;
        }
      }}
    ></div>
    <aside class="fixed top-0 left-0 z-50 h-full w-64 bg-[#18191c] flex flex-col border-r border-[#232428] transition-all duration-300 shadow-xl">
      <!-- Sidebar content -->
      {#if sidebarOpen}
        <div class="p-4 border-b border-[#232428]">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class={isPhotosRoute ? 'w-10 h-10 bg-blue-500    flex items-center justify-center' : isAlbumsRoute ? 'w-10 h-10 bg-purple-500    flex items-center justify-center' : 'w-10 h-10 bg-gray-700    flex items-center justify-center'}>
                {#if isPhotosRoute}
                  <Image class="w-6 h-6 text-white" />
                {:else if isAlbumsRoute}
                  <Folder class="w-6 h-6 text-white" />
                {:else}
                  <Image class="w-6 h-6 text-white" />
                {/if}
              </div>
              <h1 class="text-lg font-semibold text-white">{isPhotosRoute ? 'Photos' : isAlbumsRoute ? 'Albums' : 'Photos'}</h1>
            </div>
            <button type="button" on:click={() => mobileSidebarOpen = false} class="p-2    hover:bg-[#232428] transition-colors border border-[#35363a] text-white" aria-label="Close sidebar">
              <ChevronLeft class="w-5 h-5" />
            </button>
          </div>
          <!-- Thumbnails preview -->
          {#if isPhotosRoute}
            <div class="mt-3 flex gap-2">
              {#each ($uploadedPhotos || []).slice(0, 3) as p}
                <img src={p.src} alt={p.alt} class="w-16 h-10 object-cover rounded-md border border-[#2b2b2d]" />
              {/each}
              {#if ($uploadedPhotos || []).length === 0}
                <div class="text-sm text-white/60">No photos</div>
              {/if}
            </div>
          {:else if isAlbumsRoute}
            <div class="mt-3 flex gap-2">
              {#each ($albums || []).slice(0, 3) as a}
                {#if getAlbumCoverSrc(a)}
                  <img src={getAlbumCoverSrc(a)} alt={a.name} class="w-16 h-10 object-cover rounded-md border border-[#2b2b2d]" />
                {:else}
                  <div class="w-16 h-10 bg-[#232428] rounded-md flex items-center justify-center border border-[#2b2b2d]">
                    <Folder class="w-5 h-5 text-white/70" />
                  </div>
                {/if}
              {/each}
              {#if ($albums || []).length === 0}
                <div class="text-sm text-white/60">No albums</div>
              {/if}
            </div>
          {/if}
        </div>
      {/if}
      <!-- ...rest of sidebar content (upload, nav, user, etc) ... -->
      <div class={sidebarOpen ? 'transition-all duration-300 p-4' : 'transition-all duration-300 p-2 mt-2'}>
        <button type="button" class={sidebarOpen ? 'bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300 flex items-center justify-center rounded-xl w-full gap-2 py-2' : 'bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300 flex items-center justify-center rounded-xl w-full h-12'} on:click={() => fileInput && fileInput.click()} aria-label="Upload photos" title={!sidebarOpen ? 'Upload' : undefined}>
          <Upload class="w-5 h-5 flex-shrink-0" />
          {#if sidebarOpen}<span class="font-semibold">Upload</span>{/if}
        </button>
        {#if uploadPct > 0}
          <div class="mt-3">
            <div class="flex justify-between text-xs text-white/60 mb-1"><span>Uploading…</span><span>{Math.round(uploadPct)}%</span></div>
            <div class="w-full h-2 bg-[#232428] rounded overflow-hidden"><div class="h-2 bg-blue-500 rounded transition-all" style="width: {Math.min(100, uploadPct)}%"></div></div>
          </div>
        {/if}
        <input bind:this={fileInput} type="file" class="hidden" accept="image/*" multiple on:change={async (e) => {
          const files = (e.currentTarget as HTMLInputElement).files
          if (!files) return
          const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
          if (!imageFiles.length) return
          try { await photosStore.uploadMultiplePhotos(imageFiles) } catch (err) { console.error('Upload failed', err) }
          e.currentTarget.value = ''
        }} />
      </div>
      <nav class="p-4 flex flex-col gap-3" aria-label="Primary navigation">
        {#each navItems as item}
          <button type="button" on:click={() => { handleNav(item.path); mobileSidebarOpen = false; }} aria-label={`Navigate to ${item.label}`} aria-current={$location.split('?')[0] === item.path ? 'page' : undefined} class={$location.split('?')[0] === item.path ? `flex items-center w-full px-3 py-2 rounded-xl text-base font-semibold gap-2 transition-all ${item.color} text-white` : 'flex items-center w-full px-3 py-2 rounded-xl text-base font-semibold gap-2 transition-all bg-[#232428] text-white/80 hover:bg-[#232428]/80'}>
            {#if item.path === '/photos'}<Image class="w-5 h-5 flex-shrink-0" />{:else}<Folder class="w-5 h-5 flex-shrink-0" />{/if}
            {#if sidebarOpen}
              <span class="font-semibold">{item.label}</span>
            {/if}
          </button>
        {/each}
      </nav>
      <div class="flex-1"></div>
      {#if sidebarOpen}
        <div class="p-4 border-t border-[#232428] space-y-4">
          <div class="flex items-center gap-3">
            <div class={`${getAvatarColor(user.name)} rounded-full w-12 h-12 flex items-center justify-center text-white font-semibold`}>{user.name?.charAt(0)?.toUpperCase() || 'U'}</div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-white truncate">{user.name || 'User'}</p>
              <p class="text-sm text-white/60 truncate">{user.phone || '+1234567890'}</p>
            </div>
          </div>
          <p class="text-blue-400 font-medium">{user.plan || 'Free Plan'}</p>
          <div class="space-y-2">
            <div class="flex justify-between text-sm"><span class="text-white/60">Disk Space:</span><span class="text-white">{usedMiB.toFixed(1)} MiB / {(totalMiB / 1024).toFixed(0)} GiB</span></div>
            <div class="w-full h-2 bg-[#232428] rounded overflow-hidden" role="progressbar" aria-valuenow={Math.min(diskPct,100)} aria-valuemin={0} aria-valuemax={100}><div class="h-2 bg-blue-500 rounded" style="width: {diskPct}%"></div></div>
            <div class="flex justify-between text-sm"><span class="text-white/60">Files:</span><span class="text-white">{fileCount} / {user.files?.total ?? 100}</span></div>
          </div>
        </div>
      {/if}
      <div class={sidebarOpen ? 'transition-all duration-300 p-4 border-t border-[#232428] space-y-2' : 'transition-all duration-300 p-2 space-y-1'}>
        <button type="button" on:click={() => theme.toggleTheme()} class={sidebarOpen ? 'transition-all flex items-center justify-center rounded-xl bg-[#232428] text-white/90 hover:bg-[#232428]/80 w-full gap-3 py-2' : 'transition-all flex items-center justify-center rounded-xl bg-[#232428] text-white/90 hover:bg-[#232428]/80 w-full h-12'} aria-label="Toggle theme">
          {#if $theme === 'dark'}<Sun class="w-5 h-5" />{#if sidebarOpen}<span>Light Mode</span>{/if}{:else}<Moon class="w-5 h-5" />{#if sidebarOpen}<span>Dark Mode</span>{/if}{/if}
        </button>
        <button type="button" on:click={handleSignOut} class={sidebarOpen ? 'transition-all flex items-center justify-center rounded-xl bg-red-600 text-white hover:bg-red-700 w-full gap-3 py-2' : 'transition-all flex items-center justify-center rounded-xl bg-red-600 text-white hover:bg-red-700 w-full h-12'} aria-label="Sign out">
          <LogOut class="w-5 h-5" />
          {#if sidebarOpen}<span>Sign Out</span>{/if}
        </button>
      </div>
    </aside>
  {/if}
{:else}
  <aside class={sidebarOpen ? 'h-screen bg-[#18191c] flex flex-col border-r border-[#232428] transition-all duration-300 w-72' : 'h-screen bg-[#18191c] flex flex-col border-r border-[#232428] transition-all duration-300 w-20'} aria-label="Main navigation">
    {#if sidebarOpen}
      <div class="p-4 border-b border-[#232428]">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class={isPhotosRoute ? 'w-10 h-10 bg-blue-500    flex items-center justify-center' : isAlbumsRoute ? 'w-10 h-10 bg-purple-500    flex items-center justify-center' : 'w-10 h-10 bg-gray-700    flex items-center justify-center'}>
              {#if isPhotosRoute}
                <Image class="w-6 h-6 text-white" />
              {:else if isAlbumsRoute}
                <Folder class="w-6 h-6 text-white" />
              {:else}
                <Image class="w-6 h-6 text-white" />
              {/if}
            </div>
            <h1 class="text-lg font-semibold text-white">{isPhotosRoute ? 'Photos' : isAlbumsRoute ? 'Albums' : 'Photos'}</h1>
          </div>

          <button type="button" on:click={toggleSidebar} class="p-2    hover:bg-[#232428] transition-colors border border-[#35363a] text-white" aria-label="Toggle sidebar">
            <ChevronLeft class="w-5 h-5" />
          </button>
        </div>

        <!-- Thumbnails preview -->
        {#if isPhotosRoute}
          <div class="mt-3 flex gap-2">
            {#each ($uploadedPhotos || []).slice(0, 3) as p}
              <img src={p.src} alt={p.alt} class="w-16 h-10 object-cover rounded-md border border-[#2b2b2d]" />
            {/each}
            {#if ($uploadedPhotos || []).length === 0}
              <div class="text-sm text-white/60">No photos</div>
            {/if}
          </div>
        {:else if isAlbumsRoute}
          <div class="mt-3 flex gap-2">
            {#each ($albums || []).slice(0, 3) as a}
              {#if getAlbumCoverSrc(a)}
                <img src={getAlbumCoverSrc(a)} alt={a.name} class="w-16 h-10 object-cover rounded-md border border-[#2b2b2d]" />
              {:else}
                <div class="w-16 h-10 bg-[#232428] rounded-md flex items-center justify-center border border-[#2b2b2d]">
                  <Folder class="w-5 h-5 text-white/70" />
                </div>
              {/if}
            {/each}
            {#if ($albums || []).length === 0}
              <div class="text-sm text-white/60">No albums</div>
            {/if}
          </div>
        {/if}
      </div>
    {:else}
      <div class="p-2 flex items-center justify-center border-b border-[#232428]">
        <button type="button" on:click={toggleSidebar} class="p-2    hover:bg-[#232428] transition-colors border border-[#35363a] text-white" aria-label="Toggle sidebar">
          <ChevronRight class="w-5 h-5" />
        </button>
      </div>
    {/if}

    <!-- Upload -->
    <div class={sidebarOpen ? 'transition-all duration-300 p-4' : 'transition-all duration-300 p-2 mt-2'}>
      <button type="button" class={sidebarOpen ? 'bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300 flex items-center justify-center rounded-xl w-full gap-2 py-2' : 'bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300 flex items-center justify-center rounded-xl w-full h-12'} on:click={() => fileInput && fileInput.click()} aria-label="Upload photos" title={!sidebarOpen ? 'Upload' : undefined}>
        <Upload class="w-5 h-5 flex-shrink-0" />
        {#if sidebarOpen}<span class="font-semibold">Upload</span>{/if}
      </button>

      {#if uploadPct > 0}
        <div class="mt-3">
          <div class="flex justify-between text-xs text-white/60 mb-1"><span>Uploading…</span><span>{Math.round(uploadPct)}%</span></div>
          <div class="w-full h-2 bg-[#232428] rounded overflow-hidden"><div class="h-2 bg-blue-500 rounded transition-all" style="width: {Math.min(100, uploadPct)}%"></div></div>
        </div>
      {/if}

      <input bind:this={fileInput} type="file" class="hidden" accept="image/*" multiple on:change={async (e) => {
        const files = (e.currentTarget as HTMLInputElement).files
        if (!files) return
        const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
        if (!imageFiles.length) return
        try { await photosStore.uploadMultiplePhotos(imageFiles) } catch (err) { console.error('Upload failed', err) }
        e.currentTarget.value = ''
      }} />
    </div>

    <!-- Navigation -->
    <nav class="p-4 flex flex-col gap-3" aria-label="Primary navigation">
      {#each navItems as item}
        <button type="button" on:click={() => handleNav(item.path)} aria-label={`Navigate to ${item.label}`} aria-current={$location.split('?')[0] === item.path ? 'page' : undefined} class={$location.split('?')[0] === item.path ? `flex items-center w-full px-3 py-2 rounded-xl text-base font-semibold gap-2 transition-all ${item.color} text-white` : 'flex items-center w-full px-3 py-2 rounded-xl text-base font-semibold gap-2 transition-all bg-[#232428] text-white/80 hover:bg-[#232428]/80'}>
          {#if item.path === '/photos'}<Image class="w-5 h-5 flex-shrink-0" />{:else}<Folder class="w-5 h-5 flex-shrink-0" />{/if}
          {#if sidebarOpen}
            <span class="font-semibold">{item.label}</span>
          {/if}
        </button>
      {/each}
    </nav>

    <div class="flex-1"></div>

    {#if sidebarOpen}
      <div class="p-4 border-t border-[#232428] space-y-4">
        <div class="flex items-center gap-3">
          <div class={`${getAvatarColor(user.name)} rounded-full w-12 h-12 flex items-center justify-center text-white font-semibold`}>{user.name?.charAt(0)?.toUpperCase() || 'U'}</div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-white truncate">{user.name || 'User'}</p>
            <p class="text-sm text-white/60 truncate">{user.phone || '+1234567890'}</p>
          </div>
        </div>
        <p class="text-blue-400 font-medium">{user.plan || 'Free Plan'}</p>
        <div class="space-y-2">
          <div class="flex justify-between text-sm"><span class="text-white/60">Disk Space:</span><span class="text-white">{usedMiB.toFixed(1)} MiB / {(totalMiB / 1024).toFixed(0)} GiB</span></div>
          <div class="w-full h-2 bg-[#232428] rounded overflow-hidden" role="progressbar" aria-valuenow={Math.min(diskPct,100)} aria-valuemin={0} aria-valuemax={100}><div class="h-2 bg-blue-500 rounded" style="width: {diskPct}%"></div></div>
          <div class="flex justify-between text-sm"><span class="text-white/60">Files:</span><span class="text-white">{fileCount} / {user.files?.total ?? 100}</span></div>
        </div>
      </div>
    {/if}

    <div class={sidebarOpen ? 'transition-all duration-300 p-4 border-t border-[#232428] space-y-2' : 'transition-all duration-300 p-2 space-y-1'}>
      <button type="button" on:click={() => theme.toggleTheme()} class={sidebarOpen ? 'transition-all flex items-center justify-center rounded-xl bg-[#232428] text-white/90 hover:bg-[#232428]/80 w-full gap-3 py-2' : 'transition-all flex items-center justify-center rounded-xl bg-[#232428] text-white/90 hover:bg-[#232428]/80 w-full h-12'} aria-label="Toggle theme">
        {#if $theme === 'dark'}<Sun class="w-5 h-5" />{#if sidebarOpen}<span>Light Mode</span>{/if}{:else}<Moon class="w-5 h-5" />{#if sidebarOpen}<span>Dark Mode</span>{/if}{/if}
      </button>

      <button type="button" on:click={handleSignOut} class={sidebarOpen ? 'transition-all flex items-center justify-center rounded-xl bg-red-600 text-white hover:bg-red-700 w-full gap-3 py-2' : 'transition-all flex items-center justify-center rounded-xl bg-red-600 text-white hover:bg-red-700 w-full h-12'} aria-label="Sign out">
        <LogOut class="w-5 h-5" />
        {#if sidebarOpen}<span>Sign Out</span>{/if}
      </button>
    </div>
  </aside>
{/if}

<script lang="ts">
  import { writable } from 'svelte/store'
  import { get } from 'svelte/store'
  import { push, link, location } from 'svelte-spa-router'
  import { theme } from '@/lib/stores/theme'
  import { photosStore, uploadedPhotos } from '@/lib/stores/photos'
  import { LogOut, Upload, Image, Folder } from 'lucide-svelte'

  const isOpen = writable(true)
  let fileInput: HTMLInputElement

  const navItems = [
    { path: '/photos', label: 'Photos' },
    { path: '/albums', label: 'Albums' },
  ] as const

  type UserData = {
    name: string
    phone: string
    plan: string
    diskSpace: { used: number; total: number }
    files: { used: number; total: number }
  }

  const fallbackUser: UserData = {
    name: 'User',
    phone: '+1234567890',
    plan: 'Free Plan',
    diskSpace: { used: 0, total: 10240 },
    files: { used: 0, total: 100 },
  }

  $: user = (() => {
    try {
      const raw = localStorage.getItem('user')
      return raw ? (JSON.parse(raw) as UserData) : fallbackUser
    } catch {
      return fallbackUser
    }
  })()

  $: usedBytes = ($uploadedPhotos || []).reduce((sum, p) => sum + (p.fileSize ?? 0), 0)
  $: usedMiB = usedBytes / (1024 * 1024)
  $: totalMiB = user.diskSpace?.total ?? 10240
  $: diskPct = totalMiB > 0 ? Math.min(100, (usedMiB / totalMiB) * 100) : 0
  $: fileCount = ($uploadedPhotos || []).length
  $: uploadPct = get(photosStore.uploadProgress)

  function handleNav(path: string) {
    push(path)
  }

  function handleSignOut() {
    localStorage.removeItem('user')
    push('/')
  }
</script>

<aside class="h-screen bg-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300 w-64" aria-label="Main navigation">
  <div class="p-8 border-b border-sidebar-border flex items-center justify-between">
    <h1 class="text-xl font-semibold text-sidebar-foreground flex items-center gap-3">
      <div class="size-16 p-1 rounded-md bg-immich-primary flex items-center justify-center flex-shrink-0">
        <img src="/main-icon.svg" alt="Library icon" class="w-full h-full" />
      </div>
      <!-- <span>Library</span> -->
    </h1>
  </div>

  <div class="p-4">
    <button
      class="bg-blue-500 hover:bg-blue-600 text-white transition-all duration-300 flex items-center justify-center rounded-lg w-full gap-2 py-2"
      type="button"
      on:click={() => fileInput && fileInput.click()}
    >
      <Upload class="w-6 h-7" />
      <span>Upload</span>
    </button>

    {#if uploadPct > 0}
      <div class="mt-3">
        <div class="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Uploading…</span>
          <span>{Math.round(uploadPct)}%</span>
        </div>
        <div class="storage-bar">
          <div
            class="storage-fill bg-gradient-to-r from-blue-500 to-blue-400"
            style={`width:${Math.min(100, uploadPct)}%`}
          ></div>
        </div>
      </div>
    {/if}

    <input
      bind:this={fileInput}
      type="file"
      class="hidden"
      accept="image/*"
      multiple
      on:change={async (event) => {
        const target = event.currentTarget as HTMLInputElement
        const files = target.files
        if (!files || files.length === 0) return
        const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
        if (imageFiles.length === 0) return
        try {
          await photosStore.uploadMultiplePhotos(imageFiles)
        } catch (err) {
          console.error('Upload failed', err)
        } finally {
          target.value = ''
        }
      }}
    />
  </div>

    <nav class="p-4 space-y-2" aria-label="Primary navigation">
    {#each navItems as item}
      {@const isActive = $location.split('?')[0] === item.path}
      <button
        type="button"
        class={`nav-button flex items-center justify-start gap-3 w-full px-3 py-2 rounded-lg transition-all ${
          isActive ? 'bg-immich-primary text-primary-foreground' : 'nav-button-inactive'
        }`}
        on:click={() => handleNav(item.path)}
        aria-label={`Navigate to ${item.label}`}
        aria-current={isActive ? 'page' : undefined}
      >
        {#if item.path === '/photos'}
          <Image class="w-6 h-6 flex-shrink-0" />
        {:else if item.path === '/albums'}
          <Folder class="w-5 h-5 flex-shrink-0" />
        {/if}

        <span>{item.label}</span>
      </button>
    {/each}
  </nav>

  <div class="flex-1"></div>

  <div class="p-4 border-t border-sidebar-border space-y-3">
    <div class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="text-sidebar-foreground font-semibold truncate">{user.name}</span>
        <span class="text-xs text-muted-foreground">{user.plan}</span>
      </div>
      <div class="text-xs text-muted-foreground truncate">{user.phone}</div>

      <div class="space-y-1">
        <div class="flex justify-between text-xs text-muted-foreground">
          <span>Disk</span>
          <span>{usedMiB.toFixed(1)} MiB / {(totalMiB / 1024).toFixed(0)} GiB</span>
        </div>
        <div class="storage-bar" role="progressbar" aria-valuenow={diskPct} aria-valuemin={0} aria-valuemax={100}>
          <div class="storage-fill bg-gradient-to-r from-green-500 to-green-400" style={`width:${diskPct}%`}></div>
        </div>
        <div class="flex justify-between text-xs text-muted-foreground">
          <span>Files</span>
          <span>{fileCount} / {user.files?.total ?? 100}</span>
        </div>
      </div>
    </div>

    <button
      type="button"
      class="w-full rounded-lg py-2 px-3 bg-secondary text-foreground hover:bg-accent text-sm flex items-center gap-3"
      on:click={() => theme.toggleTheme()}
    >
      <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span>Light Mode</span>
    </button>

    <button
      type="button"
      class="w-full rounded-lg py-2 px-3 bg-destructive text-destructive-foreground text-sm flex items-center gap-3"
      on:click={handleSignOut}
    >
      <LogOut size={18} />
      <span>Sign out</span>
    </button>
  </div>
</aside>



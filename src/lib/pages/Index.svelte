<script lang="ts">
  import { onMount } from 'svelte'
  import { push } from 'svelte-spa-router'
  import Logo from '@/lib/components/Logo.svelte'
  import bgUrl from '/background.jpg'

  let hasUser = false

  onMount(() => {
    hasUser = Boolean(localStorage.getItem('user'))
    if (hasUser) {
      push('/photos')
    }
  })
</script>

<div  
  class="relative min-h-screen overflow-hidden bg-immich-bg dark:bg-immich-dark-bg"
  style={`background-image: url('${bgUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat;`}
>
  <div class="absolute inset-0"></div>

  <main class="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
    <div class="max-w-5xl w-full grid md:grid-cols-2 gap-10 items-center">
      <section class="space-y-6">
        <div class="flex items-center gap-3">
          <Logo size="" />
          <div>
            <h1 class="text-3xl md:text-4xl font-semibold text-white tracking-tight" style="font-size: 1.9rem;">
              Your photos, beautifully organized.
            </h1>
            <p class="text-sm text-muted-foreground mt-1">
              Immersive gallery experience inspired by Immich, reimagined in a fast local-first app.
            </p>
          </div>
        </div>

        <div class="space-y-3 text-sm text-muted-foreground">
          <p>
            Upload, browse, and relive your memories with an elegant, distraction-free interface.
          </p>
          <ul class="space-y-2">
            <li class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-immich-primary"></span>
              <span>Blazing-fast local browsing with smart grouping.</span>
            </li>
            <li class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-immich-primary"></span>
              <span>Albums that stay in sync across sessions.</span>
            </li>
            <li class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full bg-immich-primary"></span>
              <span>Dark mode and refined typography for long viewing sessions.</span>
            </li>
          </ul>
        </div>

        <div class="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="button"
            class="auth-button px-6 py-3 rounded-xl"
            on:click={() => push('/auth')}
          >
            Get started
          </button>
          <span class="text-xs text-muted-foreground">
            No password. Just your phone number for quick access.
          </span>
        </div>
      </section>

      <section class="hidden md:block">
        <div class="relative rounded-3xl border border-white/10 bg-white/5 dark:bg-black/20 p-4 backdrop-blur-xl shadow-2xl">
          <div class="grid grid-cols-3 gap-2">
            {#each Array(9) as _, i}
              <div
                class={`aspect-[4/5] rounded-2xl bg-gradient-to-br from-immich-primary/30 via-sky-500/20 to-emerald-400/20
                  animate-float`}
                style={`animation-delay:${i * 0.15}s`}
              ></div>
            {/each}
          </div>
          <div class="absolute -inset-1 rounded-3xl border border-white/10 pointer-events-none"></div>
        </div>
      </section>
    </div>
  </main>
</div>


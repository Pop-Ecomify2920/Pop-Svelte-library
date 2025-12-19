<script lang="ts">
  import { onMount } from 'svelte'
  import { push } from 'svelte-spa-router'
  import { isAuthed } from '@/lib/utils/auth'

  export let redirectTo = '/auth'

  onMount(() => {
    if (!isAuthed()) {
      push(redirectTo)
    }
  })
</script>

{#if typeof window !== 'undefined' && isAuthed()}
  <slot />
{:else}
  <div class="flex items-center justify-center h-full text-muted-foreground">Checking session…</div>
{/if}



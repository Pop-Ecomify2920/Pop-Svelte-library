<script lang="ts">
  import Router, { type routes } from 'svelte-spa-router'
  import Layout from '@/lib/Layout.svelte'
  import Index from '@/lib/pages/Index.svelte'
  import Auth from '@/lib/pages/Auth.svelte'
  import Photos from '@/lib/pages/Photos.svelte'
  import Albums from '@/lib/pages/Albums.svelte'
  import AlbumDetail from '@/lib/pages/AlbumDetail.svelte'
  import NotFound from '@/lib/pages/NotFound.svelte'

  const routesMap: routes = {
    '/': Index,
    '/auth': Auth,
    '/photos': Photos,
    '/albums': Albums,
    '/albums/:albumId': AlbumDetail,
    '*': NotFound,
  } satisfies routes
</script>

<Layout>
  <Router routes={routesMap} />
</Layout>

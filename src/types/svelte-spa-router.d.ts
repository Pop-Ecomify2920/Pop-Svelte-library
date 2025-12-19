declare module 'svelte-spa-router' {
  import type { SvelteComponentTyped } from 'svelte'
  import type { Readable } from 'svelte/store'

  export type RouteDefinition = Record<string, typeof SvelteComponentTyped | any>

  export type routes = RouteDefinition

  export interface RouterProps {
    routes: RouteDefinition
  }

  const Router: typeof SvelteComponentTyped<RouterProps>

  export default Router

  export function push(path: string): void
  export function replace(path: string): void
  export function pop(): void

  /**
   * Action to use on anchor tags: <a use:link href="/path">
   */
  export function link(node: HTMLElement): { destroy(): void }

  // Current location as a readable store (e.g. "/photos?q=test")
  export const location: Readable<string>

  // Current route params as a readable store (e.g. { albumId: "..." })
  export const params: Readable<Record<string, string>>
}



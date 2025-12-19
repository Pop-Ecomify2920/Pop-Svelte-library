<script lang="ts">
  export let size: 'sm' | 'md' | 'lg' = 'md'
  export let className = ''

  const sizeClasses: Record<typeof size, string> = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  }
</script>

<img
  src="/logo.png"
  alt="it's you"
  class={`${sizeClasses[size]} ${className}`}
/>



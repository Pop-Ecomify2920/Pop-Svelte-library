<script lang="ts">
  import { onMount } from 'svelte'

  type Particle = {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    color: string
    rotation: number
    rotationSpeed: number
    shape: 'circle' | 'triangle'
  }

  export let className = ''

  let canvas: HTMLCanvasElement
  let animationFrame: number
  let particles: Particle[] = []
  let prefersReducedMotion = false

  onMount(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion = mediaQuery.matches
    const handleChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches
    }
    mediaQuery.addEventListener('change', handleChange)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    initParticles(canvas)

    const connectionDistance = 150
    const maxLineOpacity = 0.15

    let lastTime = 0
    let gradientOffset = 0
    const targetFPS = 60
    const frameInterval = 1000 / targetFPS

    const animate = (currentTime: number) => {
      if (prefersReducedMotion) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        drawGradient(ctx, canvas.width, canvas.height, 0)
        drawStaticConnections(ctx, particles, connectionDistance, maxLineOpacity)
        drawParticles(ctx, particles)
        return
      }

      const deltaTime = currentTime - lastTime

      if (deltaTime >= frameInterval) {
        lastTime = currentTime - (deltaTime % frameInterval)

        gradientOffset += 0.001
        if (gradientOffset > Math.PI * 2) gradientOffset = 0

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        drawGradient(ctx, canvas.width, canvas.height, gradientOffset)
        updateParticles(particles, canvas.width, canvas.height)
        drawConnectionsOptimized(ctx, particles, connectionDistance, maxLineOpacity)
        drawParticles(ctx, particles)
      }

      animationFrame = requestAnimationFrame(animate)
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      mediaQuery.removeEventListener('change', handleChange)
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
  })

  function initParticles(canvas: HTMLCanvasElement) {
    const particleCount = 80
    const colors = [
      'rgba(20, 184, 166, 0.4)',
      'rgba(6, 182, 212, 0.4)',
      'rgba(34, 197, 94, 0.3)',
      'rgba(59, 130, 246, 0.3)',
    ]

    particles = []
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
        shape: Math.random() > 0.85 ? 'triangle' : 'circle',
      })
    }
  }

  function drawGradient(ctx: CanvasRenderingContext2D, width: number, height: number, offset: number) {
    const centerX = width / 2
    const centerY = height / 2
    const angle = offset
    const length = Math.sqrt(width * width + height * height)

    const x1 = centerX + Math.cos(angle) * length * 0.5
    const y1 = centerY + Math.sin(angle) * length * 0.5
    const x2 = centerX - Math.cos(angle) * length * 0.5
    const y2 = centerY - Math.sin(angle) * length * 0.5

    const gradient = ctx.createLinearGradient(x1, y1, x2, y2)
    gradient.addColorStop(0, 'hsl(212, 86.40%, 8.60%)')
    gradient.addColorStop(0.5, 'hsl(199, 63.90%, 16.30%)')
    gradient.addColorStop(1, 'hsl(211, 90.30%, 12.20%)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  function updateParticles(particles: Particle[], width: number, height: number) {
    particles.forEach((p) => {
      p.x += p.vx
      p.y += p.vy
      if (p.shape === 'triangle') p.rotation += p.rotationSpeed

      if (p.x < 0) p.x = width
      if (p.x > width) p.x = 0
      if (p.y < 0) p.y = height
      if (p.y > height) p.y = 0
    })
  }

  function drawConnectionsOptimized(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    maxDistance: number,
    maxOpacity: number,
  ) {
    ctx.lineWidth = 3
    const maxDistanceSquared = maxDistance * maxDistance

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const distanceSquared = dx * dx + dy * dy
        if (distanceSquared > maxDistanceSquared) continue
        const distance = Math.sqrt(distanceSquared)
        const opacity = (1 - distance / maxDistance) * maxOpacity
        ctx.strokeStyle = `rgba(20, 184, 166, ${opacity * 0.8})`
        ctx.beginPath()
        ctx.moveTo(particles[i].x, particles[i].y)
        ctx.lineTo(particles[j].x, particles[j].y)
        ctx.stroke()
      }
    }
  }

  function drawStaticConnections(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    maxDistance: number,
    maxOpacity: number,
  ) {
    ctx.lineWidth = 5
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x
        const dy = particles[i].y - particles[j].y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance < maxDistance) {
          const opacity = (1 - distance / maxDistance) * maxOpacity * 0.5
          ctx.strokeStyle = `rgba(20, 184, 166, ${opacity})`
          ctx.beginPath()
          ctx.moveTo(particles[i].x, particles[i].y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.stroke()
        }
      }
    }
  }

  function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    particles.forEach((p) => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.shadowBlur = 6
      ctx.shadowColor = p.color

      if (p.shape === 'triangle') {
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        ctx.beginPath()
        const size = p.size * 2
        ctx.moveTo(0, -size)
        ctx.lineTo(-size * 0.866, size * 0.5)
        ctx.lineTo(size * 0.866, size * 0.5)
        ctx.closePath()
        ctx.fill()
      } else {
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(0, 0, p.size, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    })
  }
</script>

<canvas
  bind:this={canvas}
  class={`fixed inset-0 -z-10 pointer-events-none ${className}`}
  aria-hidden="true"
></canvas>



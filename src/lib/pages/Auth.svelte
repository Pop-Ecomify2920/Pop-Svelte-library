<script lang="ts">
  import { onMount } from 'svelte'
  import { push } from 'svelte-spa-router'
  import CanvasBackground from '@/lib/components/CanvasBackground.svelte'
  import Logo from '@/lib/components/Logo.svelte'
    import bgUrl from '/background.jpg'

  type AuthMode = 'signin' | 'signup'
  type AuthStep = 'phone' | 'otp'

  let mode: AuthMode = 'signin'
  let step: AuthStep = 'phone'
  let countryCode = '+1'
  let phoneNumber = ''
  let name = ''
  let otp: string[] = ['', '', '', '', '', '']
  let isLoading = false
  let isMounted = false
  let isModeTransitioning = false

  onMount(() => {
    isMounted = true
  })

  function handleModeToggle() {
    isModeTransitioning = true
    setTimeout(() => {
      mode = mode === 'signin' ? 'signup' : 'signin'
      setTimeout(() => {
        isModeTransitioning = false
      }, 150)
    }, 150)
  }

  async function handleSendOtp(event: SubmitEvent) {
    event.preventDefault()
    if (!phoneNumber.trim()) return
    if (mode === 'signup' && !name.trim()) return

    isLoading = true
    await new Promise((resolve) => setTimeout(resolve, 1500))
    isLoading = false
    step = 'otp'
  }

  async function handleVerifyOtp(event: SubmitEvent) {
    event.preventDefault()
    const otpValue = otp.join('')
    if (otpValue.length !== 6) return

    isLoading = true
    await new Promise((resolve) => setTimeout(resolve, 1500))
    isLoading = false

    const user = {
      name: name.trim() || 'User',
      phone: `${countryCode}${phoneNumber}`,
      plan: 'Free Plan',
      diskSpace: { used: 45.7, total: 10240 },
      files: { used: 15, total: 100 },
    }
    localStorage.setItem('user', JSON.stringify(user))
    push('/photos')
  }

  function handleOtpChange(index: number, value: string) {
    if (value.length > 1) return
    otp[index] = value
    otp = [...otp]

    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`) as HTMLInputElement | null
      next?.focus()
    }
  }

  function handleOtpKeyDown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`) as HTMLInputElement | null
      prev?.focus()
    }
  }
</script>

<div class="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden"
style={`background-image: url('${bgUrl}'); background-size: cover; background-position: center; background-repeat: no-repeat;`}

>
  <CanvasBackground />

  <div class={`relative z-10 w-full max-w-[420px] transition-all duration-500 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
    <div class="auth-card auth-card-premium p-8 sm:p-10">
      <div class="flex justify-center mb-8 transition-transform duration-300 hover:scale-105">
        <Logo size="lg" />
      </div>

      <div class={`text-center mb-8 transition-opacity duration-200 ${isModeTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <h1 class="text-3xl sm:text-4xl font-semibold text-foreground mb-2 tracking-tight">
          {step === 'otp' ? 'Enter verification code' : mode === 'signin' ? 'Welcome back' : 'Create account'}
        </h1>
        <p class="text-sm sm:text-base text-muted-foreground">
          {step === 'otp'
            ? `We sent a code to ${countryCode} ${phoneNumber}`
            : mode === 'signin'
              ? 'Sign in to continue to your account'
              : 'Get started with your free account'}
        </p>
      </div>

      <div class={`transition-all duration-200 ${isModeTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        {#if step === 'phone'}
          <form on:submit={handleSendOtp} class="space-y-5">
            <div class="space-y-2">
              <label for="phone" class="text-sm font-medium text-foreground/80">
                Phone number
              </label>
              <div class="flex gap-3">
                <input
                  id="country-code"
                  type="text"
                  bind:value={countryCode}
                  class="w-20 p-2 text-center font-medium auth-input"
                  placeholder="+1"
                  aria-label="Country code"
                />
                <input
                  id="phone"
                  type="tel"
                  bind:value={phoneNumber}
                  on:input={(e) => (phoneNumber = (e.currentTarget as HTMLInputElement).value.replace(/\D/g, ''))}
                  class="flex-1 auth-input text-center"
                  placeholder="Enter your phone number"
                  aria-label="Phone number"
                  autocomplete="tel"
                />
              </div>
            </div>

            {#if mode === 'signup'}
              <div class="space-y-2 animate-fade-in">
                <label for="name" class="text-sm font-medium text-foreground/80 mr-2">
                  Full name : 
                </label>
                <input
                  id="name"
                  type="text"
                  bind:value={name}
                  class="auth-input p-2 text-center"
                  placeholder="Enter your full name"
                  aria-label="Full name"
                  autocomplete="name"
                />
              </div>
            {/if}

            <button
              type="submit"
              class="auth-button w-full mt-6 py-3 rounded-xl"
              disabled={isLoading}
            >
              {#if isLoading}
                <span class="flex items-center justify-center gap-2">
                  <span class="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></span>
                  <span>Sending code...</span>
                </span>
              {:else}
                Continue
              {/if}
            </button>
          </form>
        {:else}
          <form on:submit={handleVerifyOtp} class="space-y-6">
            <div class="space-y-3">
              <label for="otp-0" class="text-sm font-medium text-foreground/80 block text-center">
                Enter 6-digit code
              </label>
              <div class="flex justify-center gap-2 sm:gap-2">
                {#each otp as digit, index}
                  <input
                    id={`otp-${index}`}
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    maxlength="1"
                    value={digit}
                    on:input={(e) => handleOtpChange(index, (e.currentTarget as HTMLInputElement).value)}
                    on:keydown={(e) => handleOtpKeyDown(index, e)}
                    class="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-semibold auth-input-otp"
                    aria-label={`Digit ${index + 1}`}
                  />
                {/each}
              </div>
            </div>

            <button
              type="submit"
              class="auth-button w-full py-3 rounded-xl"
              disabled={isLoading}
            >
              {#if isLoading}
                <span class="flex items-center justify-center gap-2">
                  <span class="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></span>
                  <span>Verifying...</span>
                </span>
              {:else}
                Verify and continue
              {/if}
            </button>

            <button
              type="button"
              class="w-full mt-2 text-muted-foreground hover:text-foreground text-sm"
              on:click={() => {
                step = 'phone'
                otp = ['', '', '', '', '', '']
              }}
            >
              ← Change phone number
            </button>
          </form>
        {/if}
      </div>

      {#if step === 'phone'}
        <div class={`mt-8 pt-6 border-t border-border/50 transition-opacity duration-200 ${isModeTransitioning ? 'opacity-0' : 'opacity-100'}`}>
          <p class="text-center text-sm text-muted-foreground">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              on:click={handleModeToggle}
              class="text-primary font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 rounded-sm transition-all duration-200"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      {/if}
    </div>
  </div>
</div>



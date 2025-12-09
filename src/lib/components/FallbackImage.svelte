<script lang="ts">
  interface Props {
    src: string | undefined;
    alt: string;
    class?: string;
    fallbackType?: 'item' | 'avatar';
  }

  let { src, alt, class: className = '', fallbackType = 'item' }: Props = $props();

  let hasError = $state(false);
  let isLoading = $state(true);

  function handleError() {
    hasError = true;
    isLoading = false;
  }

  function handleLoad() {
    isLoading = false;
  }

  // Reset error state when src changes
  $effect(() => {
    if (src) {
      hasError = false;
      isLoading = true;
    }
  });
</script>

<div class="fallback-image-container {className}" class:loading={isLoading} class:error={hasError}>
  {#if !hasError && src}
    <img
      {src}
      {alt}
      onerror={handleError}
      onload={handleLoad}
      class="fallback-image"
      class:hidden={isLoading}
    />
  {/if}

  {#if isLoading && !hasError}
    <div class="placeholder loading-placeholder" role="status" aria-live="polite" aria-label="Loading image">
      <div class="shimmer"></div>
      <span class="sr-only">Loading image...</span>
    </div>
  {/if}

  {#if hasError || !src}
    <div class="placeholder error-placeholder" role="img" aria-label={alt}>
      {#if fallbackType === 'avatar'}
        <span class="placeholder-icon">👤</span>
      {:else}
        <span class="placeholder-icon">📦</span>
        <span class="placeholder-text">No image</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .fallback-image-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: var(--surface);
  }

  .fallback-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.2s ease;
  }

  .fallback-image.hidden {
    opacity: 0;
  }

  .placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    background-color: var(--surface);
  }

  .loading-placeholder {
    overflow: hidden;
  }

  .shimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.4) 50%,
      transparent 100%
    );
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .error-placeholder {
    color: var(--text-muted);
  }

  .placeholder-icon {
    font-size: 2rem;
    opacity: 0.5;
  }

  .placeholder-text {
    font-size: 0.75rem;
    opacity: 0.6;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Avatar-specific styles */
  :global(.avatar) .placeholder-icon {
    font-size: 1rem;
  }

  :global(.avatar) .placeholder-text {
    display: none;
  }
</style>

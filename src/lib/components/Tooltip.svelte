<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    children: Snippet;
  }

  let { content, position = 'top', children }: Props = $props();

  let showTooltip = $state(false);
</script>

<span
  class="tooltip-wrapper"
  role="none"
  onmouseenter={() => showTooltip = true}
  onmouseleave={() => showTooltip = false}
  onfocus={() => showTooltip = true}
  onblur={() => showTooltip = false}
>
  {@render children()}
  {#if showTooltip}
    <span class="tooltip tooltip-{position}" role="tooltip">
      {content}
    </span>
  {/if}
</span>

<style>
  .tooltip-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
  }

  .tooltip {
    position: absolute;
    z-index: 100;
    padding: 0.5rem 0.75rem;
    background-color: var(--text-primary);
    color: var(--background);
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1.4;
    border-radius: var(--radius);
    white-space: nowrap;
    pointer-events: none;
    animation: fadeIn 0.15s ease-out;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(2px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .tooltip-top {
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
  }

  .tooltip-bottom {
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
  }

  .tooltip-left {
    right: calc(100% + 8px);
    top: 50%;
    transform: translateY(-50%);
  }

  .tooltip-right {
    left: calc(100% + 8px);
    top: 50%;
    transform: translateY(-50%);
  }

  /* Arrow */
  .tooltip::after {
    content: '';
    position: absolute;
    border: 6px solid transparent;
  }

  .tooltip-top::after {
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-top-color: var(--text-primary);
  }

  .tooltip-bottom::after {
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-bottom-color: var(--text-primary);
  }

  .tooltip-left::after {
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    border-left-color: var(--text-primary);
  }

  .tooltip-right::after {
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    border-right-color: var(--text-primary);
  }
</style>

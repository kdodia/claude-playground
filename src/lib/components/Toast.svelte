<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';

  interface Props {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    onClose?: () => void;
  }

  let { message, type = 'info', duration = 3000, onClose }: Props = $props();

  let visible = $state(true);

  onMount(() => {
    const timer = setTimeout(() => {
      visible = false;
      setTimeout(() => onClose?.(), 300);
    }, duration);

    return () => clearTimeout(timer);
  });

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };
</script>

{#if visible}
  <div class="toast toast-{type}" transition:fly={{ y: -20, duration: 300 }}>
    <span class="toast-icon">{icons[type]}</span>
    <span class="toast-message">{message}</span>
    <button class="toast-close" onclick={() => (visible = false)}>×</button>
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    top: 5rem;
    right: 1rem;
    min-width: 250px;
    max-width: 400px;
    padding: 1rem 1.25rem;
    background-color: var(--background);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    display: flex;
    align-items: center;
    gap: 0.75rem;
    z-index: 1000;
    border: 1px solid var(--border);
  }

  .toast-success {
    border-left: 4px solid var(--success);
  }

  .toast-error {
    border-left: 4px solid var(--error);
  }

  .toast-warning {
    border-left: 4px solid var(--warning);
  }

  .toast-info {
    border-left: 4px solid var(--secondary);
  }

  .toast-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .toast-message {
    flex: 1;
    font-size: 0.875rem;
    color: var(--text-primary);
  }

  .toast-close {
    font-size: 1.5rem;
    color: var(--text-muted);
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    line-height: 1;
    transition: color var(--transition);
  }

  .toast-close:hover {
    color: var(--text-primary);
  }

  @media (max-width: 640px) {
    .toast {
      right: 0.5rem;
      left: 0.5rem;
      min-width: auto;
    }
  }
</style>

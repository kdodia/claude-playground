<script lang="ts">
  interface Props {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'default';
    onConfirm: () => void;
    onCancel: () => void;
  }

  let {
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    onConfirm,
    onCancel
  }: Props = $props();

  let dialogElement = $state<HTMLDivElement | undefined>();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onCancel();
    }
  }

  function handleOverlayClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  }

  // Focus dialog when it opens
  $effect(() => {
    if (open && dialogElement) {
      dialogElement.focus();
    }
  });
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="dialog-overlay"
    onclick={handleOverlayClick}
    onkeydown={handleKeydown}
    role="presentation"
  >
    <div
      class="dialog-content"
      bind:this={dialogElement}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-message"
      tabindex="-1"
    >
      <h2 id="dialog-title" class="dialog-title">{title}</h2>
      <p id="dialog-message" class="dialog-message">{message}</p>
      <div class="dialog-actions">
        <button class="btn btn-secondary" onclick={onCancel}>
          {cancelLabel}
        </button>
        <button
          class="btn"
          class:btn-danger={variant === 'danger'}
          class:btn-warning={variant === 'warning'}
          class:btn-primary={variant === 'default'}
          onclick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .dialog-content {
    background: var(--background);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    max-width: 400px;
    width: 100%;
    padding: 1.5rem;
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .dialog-title {
    margin: 0 0 0.75rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .dialog-message {
    margin: 0 0 1.5rem 0;
    font-size: 0.9375rem;
    line-height: 1.6;
    color: var(--text-secondary);
  }

  .dialog-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
  }

  .btn-danger {
    background-color: var(--error);
    color: white;
    border-color: var(--error);
  }

  .btn-danger:hover {
    background-color: #dc2626;
    border-color: #dc2626;
  }

  .btn-warning {
    background-color: var(--warning);
    color: white;
    border-color: var(--warning);
  }

  .btn-warning:hover {
    background-color: #d97706;
    border-color: #d97706;
  }
</style>

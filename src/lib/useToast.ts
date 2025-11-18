import { TOAST_DURATION_MS } from './constants';

export type ToastType = 'success' | 'error';
export type ToastMessage = { message: string; type: ToastType } | null;

/**
 * Reusable toast notification utility
 * Provides state and helper to show auto-dismissing toast messages
 *
 * Usage:
 * ```ts
 * const { toast, showToast } = useToast();
 *
 * function handleAction() {
 *   showToast('Action completed!', 'success');
 * }
 * ```
 */
export function useToast() {
  let toast = $state<ToastMessage>(null);
  let timeoutId: number | undefined;

  function showToast(message: string, type: ToastType = 'success', duration = TOAST_DURATION_MS) {
    // Clear any existing timeout
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    // Set new toast message
    toast = { message, type };

    // Auto-clear after duration
    timeoutId = window.setTimeout(() => {
      toast = null;
      timeoutId = undefined;
    }, duration);
  }

  function clearToast() {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    toast = null;
  }

  return {
    get toast() {
      return toast;
    },
    showToast,
    clearToast
  };
}

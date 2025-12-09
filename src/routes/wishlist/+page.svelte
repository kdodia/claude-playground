<script lang="ts">
  import { appStore, currentUserWishlistItems } from '$lib/store';
  import ItemCard from '$lib/components/ItemCard.svelte';
  import Toast from '$lib/components/Toast.svelte';
  import { TOAST_DURATION_MS } from '$lib/constants';

  // Pagination
  const ITEMS_PER_PAGE = 12;
  let currentPage = $state(1);

  let toast = $state<{ message: string; type: 'success' | 'error' } | null>(null);

  // Pagination calculations
  let totalPages = $derived(Math.ceil($currentUserWishlistItems.length / ITEMS_PER_PAGE));

  let paginatedItems = $derived(
    $currentUserWishlistItems.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    )
  );

  let pageNumbers = $derived.by(() => {
    const pages: (number | 'ellipsis')[] = [];
    const total = totalPages;
    const current = currentPage;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('ellipsis');
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push('ellipsis');
      if (total > 1) pages.push(total);
    }
    return pages;
  });

  function goToPage(page: number) {
    if (page >= 1 && page <= totalPages) {
      currentPage = page;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function removeFromWishlist(itemId: string) {
    appStore.removeFromWishlist(itemId);
    toast = { message: 'Removed from wishlist', type: 'success' };
    setTimeout(() => (toast = null), TOAST_DURATION_MS);
    // Reset page if we removed the last item on this page
    if (paginatedItems.length === 1 && currentPage > 1) {
      currentPage = currentPage - 1;
    }
  }

  function toggleNotification(itemId: string, currentState: boolean) {
    appStore.toggleWishlistNotification(itemId);
    toast = {
      message: currentState ? 'Notifications disabled' : 'Notifications enabled',
      type: 'success'
    };
    setTimeout(() => (toast = null), TOAST_DURATION_MS);
  }
</script>

<div class="wishlist-page fade-in">
  <div class="container">
    <header class="page-header">
      <div>
        <h1 class="page-title">My Wishlist</h1>
        <p class="page-subtitle">Items you've saved for later</p>
      </div>
    </header>

    {#if $currentUserWishlistItems.length > 0}
      <div class="wishlist-stats">
        <span class="stat">
          <span class="stat-value">{$currentUserWishlistItems.length}</span>
          <span class="stat-label">{$currentUserWishlistItems.length === 1 ? 'item' : 'items'} saved</span>
        </span>
        <span class="stat">
          <span class="stat-value">{$currentUserWishlistItems.filter(w => w.item.available).length}</span>
          <span class="stat-label">available now</span>
        </span>
        <span class="stat">
          <span class="stat-value">{$currentUserWishlistItems.filter(w => w.notifyOnAvailable).length}</span>
          <span class="stat-label">with notifications</span>
        </span>
        {#if totalPages > 1}
          <span class="stat">
            <span class="stat-label">Page {currentPage} of {totalPages}</span>
          </span>
        {/if}
      </div>

      <div class="wishlist-grid">
        {#each paginatedItems as entry (entry.id)}
          <div class="wishlist-item-wrapper">
            <ItemCard item={entry.item} navContext="wishlist" />
            <div class="wishlist-actions">
              <div class="notification-control">
                <label class="toggle-label">
                  <input
                    type="checkbox"
                    checked={entry.notifyOnAvailable}
                    onchange={() => toggleNotification(entry.itemId, entry.notifyOnAvailable)}
                    class="toggle-checkbox"
                  />
                  <span class="toggle-switch"></span>
                  <span class="toggle-text">
                    {#if entry.item.available}
                      Available now
                    {:else}
                      Notify when available
                    {/if}
                  </span>
                </label>
              </div>
              <button
                class="remove-btn"
                onclick={() => removeFromWishlist(entry.itemId)}
                aria-label="Remove from wishlist"
              >
                Remove
              </button>
            </div>
          </div>
        {/each}
      </div>

      {#if totalPages > 1}
        <nav class="pagination" aria-label="Wishlist pagination">
          <button
            class="pagination-btn"
            onclick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
          >
            ← Previous
          </button>

          <div class="pagination-pages">
            {#each pageNumbers as page}
              {#if page === 'ellipsis'}
                <span class="pagination-ellipsis" aria-hidden="true">…</span>
              {:else}
                <button
                  class="pagination-page"
                  class:active={page === currentPage}
                  onclick={() => goToPage(page)}
                  aria-label="Go to page {page}"
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </button>
              {/if}
            {/each}
          </div>

          <button
            class="pagination-btn"
            onclick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
          >
            Next →
          </button>
        </nav>
      {/if}
    {:else}
      <div class="empty-state">
        <span class="empty-icon" aria-hidden="true">💝</span>
        <h2>Your wishlist is empty</h2>
        <p>Save items you're interested in by clicking the heart button on any item page.</p>
        <a href="/" class="btn btn-primary">Browse Items</a>
      </div>
    {/if}
  </div>
</div>

{#if toast}
  <Toast message={toast.message} type={toast.type} onClose={() => (toast = null)} />
{/if}

<style>
  .wishlist-page {
    min-height: calc(100vh - 200px);
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 0.5rem 0;
  }

  .page-subtitle {
    font-size: 1rem;
    color: var(--text-secondary);
    margin: 0;
  }

  .wishlist-stats {
    display: flex;
    gap: 2rem;
    padding: 1.25rem 1.5rem;
    background-color: var(--surface);
    border-radius: var(--radius-lg);
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  .stat {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--primary);
  }

  .stat-label {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .wishlist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .wishlist-item-wrapper {
    display: flex;
    flex-direction: column;
  }

  .wishlist-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background-color: var(--surface);
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    border: 1px solid var(--border);
    border-top: none;
    margin-top: -0.5rem;
  }

  .notification-control {
    flex: 1;
  }

  .toggle-label {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    user-select: none;
  }

  .toggle-checkbox {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-switch {
    position: relative;
    width: 2rem;
    height: 1.125rem;
    background-color: var(--border);
    border-radius: 999px;
    transition: background-color var(--transition);
    flex-shrink: 0;
  }

  .toggle-switch::after {
    content: '';
    position: absolute;
    top: 0.125rem;
    left: 0.125rem;
    width: 0.875rem;
    height: 0.875rem;
    background-color: white;
    border-radius: 50%;
    transition: transform var(--transition);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  .toggle-checkbox:checked + .toggle-switch {
    background-color: var(--primary);
  }

  .toggle-checkbox:checked + .toggle-switch::after {
    transform: translateX(0.875rem);
  }

  .toggle-checkbox:focus-visible + .toggle-switch {
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
  }

  .toggle-text {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .remove-btn {
    font-size: 0.75rem;
    color: var(--text-muted);
    padding: 0.375rem 0.75rem;
    border-radius: var(--radius);
    transition: all var(--transition);
  }

  .remove-btn:hover {
    background-color: rgba(239, 68, 68, 0.1);
    color: var(--error);
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background-color: var(--surface);
    border-radius: var(--radius-lg);
  }

  .empty-icon {
    font-size: 4rem;
    display: block;
    margin-bottom: 1.5rem;
  }

  .empty-state h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 0.75rem 0;
  }

  .empty-state p {
    color: var(--text-secondary);
    margin: 0 0 1.5rem 0;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }

  /* Pagination */
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border);
  }

  .pagination-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-primary);
    background-color: var(--background);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    transition: all var(--transition);
  }

  .pagination-btn:hover:not(:disabled) {
    background-color: var(--surface);
    border-color: var(--primary);
    color: var(--primary);
  }

  .pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .pagination-pages {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .pagination-page {
    min-width: 2.25rem;
    height: 2.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
    background-color: transparent;
    border-radius: var(--radius);
    transition: all var(--transition);
  }

  .pagination-page:hover {
    background-color: var(--surface);
    color: var(--text-primary);
  }

  .pagination-page.active {
    background-color: var(--primary);
    color: white;
  }

  .pagination-ellipsis {
    min-width: 2.25rem;
    text-align: center;
    color: var(--text-muted);
  }

  @media (max-width: 768px) {
    .page-title {
      font-size: 1.5rem;
    }

    .wishlist-stats {
      gap: 1rem;
    }

    .stat-value {
      font-size: 1.25rem;
    }

    .wishlist-grid {
      grid-template-columns: 1fr;
    }

    .pagination {
      flex-wrap: wrap;
    }

    .pagination-btn {
      padding: 0.5rem 0.75rem;
      font-size: 0.8125rem;
    }

    .pagination-pages {
      order: 3;
      width: 100%;
      justify-content: center;
      margin-top: 0.5rem;
    }
  }
</style>

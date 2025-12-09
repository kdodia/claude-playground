<script lang="ts">
  import { appStore, currentUserItems } from '$lib/store';
  import ItemCard from '$lib/components/ItemCard.svelte';
  import { goto } from '$app/navigation';

  // Pagination
  const ITEMS_PER_PAGE = 12;
  let currentPage = $state(1);

  let view = $state<'grid' | 'list'>('grid');
  let filterStatus = $state<'all' | 'available' | 'borrowed'>('all');

  // Reset page when filter changes
  $effect(() => {
    filterStatus;
    currentPage = 1;
  });

  let filteredItems = $derived.by(() => {
    let items = $currentUserItems;

    if (filterStatus === 'available') {
      items = items.filter((item) => item.available);
    } else if (filterStatus === 'borrowed') {
      items = items.filter((item) => !item.available);
    }

    return items;
  });

  // Pagination calculations
  let totalPages = $derived(Math.ceil(filteredItems.length / ITEMS_PER_PAGE));

  let paginatedItems = $derived(
    filteredItems.slice(
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
</script>

<div class="my-items-page fade-in">
  <div class="container">
    <header class="page-header">
      <div>
        <h1 class="page-title">My Library</h1>
        <p class="page-subtitle">Manage the things you're sharing with your community</p>
      </div>
      <button class="btn btn-primary" onclick={() => goto('/add-item')}>
        <span>+</span>
        <span>Add Item</span>
      </button>
    </header>

    <div class="filters-bar">
      <div class="filter-group">
        <button
          class="filter-btn"
          class:active={filterStatus === 'all'}
          onclick={() => (filterStatus = 'all')}
        >
          All ({$currentUserItems.length})
        </button>
        <button
          class="filter-btn"
          class:active={filterStatus === 'available'}
          onclick={() => (filterStatus = 'available')}
        >
          Available ({$currentUserItems.filter((i) => i.available).length})
        </button>
        <button
          class="filter-btn"
          class:active={filterStatus === 'borrowed'}
          onclick={() => (filterStatus = 'borrowed')}
        >
          Borrowed ({$currentUserItems.filter((i) => !i.available).length})
        </button>
      </div>

      <div class="view-toggle">
        <button
          class="view-btn"
          class:active={view === 'grid'}
          onclick={() => (view = 'grid')}
          aria-label="Grid view"
          aria-pressed={view === 'grid'}
        >
          ▦
        </button>
        <button
          class="view-btn"
          class:active={view === 'list'}
          onclick={() => (view = 'list')}
          aria-label="List view"
          aria-pressed={view === 'list'}
        >
          ☰
        </button>
      </div>
    </div>

    {#if filteredItems.length === 0}
      <div class="empty-state">
        <span class="empty-icon" aria-hidden="true">📦</span>
        <h3>
          {filterStatus === 'all'
            ? 'No items yet'
            : filterStatus === 'available'
              ? 'No available items'
              : 'No borrowed items'}
        </h3>
        <p>
          {filterStatus === 'all'
            ? 'Start sharing by adding items to your library'
            : 'Try changing the filter'}
        </p>
        {#if filterStatus === 'all'}
          <button class="btn btn-primary" onclick={() => goto('/add-item')}> Add Your First Item </button>
        {/if}
      </div>
    {:else}
      <p class="results-count">
        {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
        {#if totalPages > 1}
          <span class="results-detail">· Page {currentPage} of {totalPages}</span>
        {/if}
      </p>

      <div class="items-grid" class:list-mode={view === 'list'}>
        {#each paginatedItems as item (item.id)}
          <ItemCard {item} navContext="my-items" />
        {/each}
      </div>

      {#if totalPages > 1}
        <nav class="pagination" aria-label="My items pagination">
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
    {/if}
  </div>
</div>

<style>
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    gap: 1rem;
  }

  .page-title {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
  }

  .page-subtitle {
    font-size: 1rem;
    color: var(--text-secondary);
    margin: 0;
  }

  .filters-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding: 1rem;
    background-color: var(--background);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border);
    gap: 1rem;
  }

  .filter-group {
    display: flex;
    gap: 0.5rem;
  }

  .filter-btn {
    padding: 0.5rem 1rem;
    border-radius: var(--radius);
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
    background-color: transparent;
    transition: all var(--transition);
  }

  .filter-btn:hover {
    background-color: var(--surface);
    color: var(--text-primary);
  }

  .filter-btn.active {
    background-color: var(--primary);
    color: white;
  }

  .view-toggle {
    display: flex;
    gap: 0.25rem;
    background-color: var(--surface);
    padding: 0.25rem;
    border-radius: var(--radius);
  }

  .view-btn {
    padding: 0.5rem 0.875rem;
    font-size: 1.25rem;
    border-radius: var(--radius);
    color: var(--text-secondary);
    transition: all var(--transition);
  }

  .view-btn:hover {
    background-color: var(--surface-hover);
    color: var(--text-primary);
  }

  .view-btn.active {
    background-color: var(--primary);
    color: white;
  }

  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .items-grid.list-mode {
    grid-template-columns: 1fr;
  }

  .empty-state {
    text-align: center;
    padding: 4rem 2rem;
  }

  .empty-icon {
    font-size: 4rem;
    display: block;
    margin-bottom: 1rem;
  }

  .empty-state h3 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  .empty-state p {
    color: var(--text-secondary);
    margin: 0 0 1.5rem 0;
  }

  .results-count {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
    margin-bottom: 1rem;
  }

  .results-detail {
    color: var(--text-muted);
    font-weight: 400;
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
    .page-header {
      flex-direction: column;
      align-items: stretch;
    }

    .filters-bar {
      flex-direction: column;
      align-items: stretch;
    }

    .filter-group {
      flex-wrap: wrap;
    }

    .view-toggle {
      align-self: flex-end;
    }

    .items-grid {
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

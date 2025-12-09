<script lang="ts">
  import { appStore, currentUserItems } from '$lib/store';
  import ItemCard from '$lib/components/ItemCard.svelte';
  import { goto } from '$app/navigation';

  let view = $state<'grid' | 'list'>('grid');
  let filterStatus = $state<'all' | 'available' | 'borrowed'>('all');

  let filteredItems = $derived.by(() => {
    let items = $currentUserItems;

    if (filterStatus === 'available') {
      items = items.filter((item) => item.available);
    } else if (filterStatus === 'borrowed') {
      items = items.filter((item) => !item.available);
    }

    return items;
  });
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
      <div class="items-grid" class:list-mode={view === 'list'}>
        {#each filteredItems as item (item.id)}
          <ItemCard {item} navContext="my-items" />
        {/each}
      </div>
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
  }
</style>

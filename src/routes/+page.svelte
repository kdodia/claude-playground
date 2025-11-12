<script lang="ts">
  import { appStore, canUserViewItem } from '$lib/store';
  import ItemCard from '$lib/components/ItemCard.svelte';
  import type { Item } from '$lib/types';

  let searchQuery = $state('');
  let selectedCategory = $state('all');
  let selectedTag = $state('all');
  let viewMode = $state<'grid' | 'list'>('grid');

  // Derived filtered items
  let filteredItems = $derived.by(() => {
    let items = $appStore.items.filter((item) =>
      canUserViewItem(item, $appStore.currentUserId, $appStore)
    );

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      items = items.filter((item) => {
        const category = $appStore.categories.find((c) => c.id === item.categoryId);
        return (
          item.categoryId === selectedCategory ||
          category?.parentId === selectedCategory
        );
      });
    }

    // Tag filter
    if (selectedTag !== 'all') {
      const tag = $appStore.tags.find((t) => t.id === selectedTag);
      items = items.filter((item) => tag?.itemIds.includes(item.id));
    }

    return items;
  });

  // Get top-level categories
  let topCategories = $derived(
    $appStore.categories.filter((c) => !c.parentId)
  );
</script>

<div class="browse-page fade-in">
  <div class="container">
    <header class="page-header">
      <div>
        <h1 class="page-title">Browse Items</h1>
        <p class="page-subtitle">Discover what your community is sharing</p>
      </div>
    </header>

    <div class="filters-section">
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search items..."
          bind:value={searchQuery}
          class="search-input"
        />
      </div>

      <div class="filter-row">
        <div class="filter-group">
          <label for="category-filter">Category:</label>
          <select id="category-filter" bind:value={selectedCategory}>
            <option value="all">All Categories</option>
            {#each topCategories as category}
              <option value={category.id}>
                {category.icon} {category.name}
              </option>
            {/each}
          </select>
        </div>

        <div class="filter-group">
          <label for="tag-filter">Tag:</label>
          <select id="tag-filter" bind:value={selectedTag}>
            <option value="all">All Tags</option>
            {#each $appStore.tags as tag}
              <option value={tag.id}>{tag.name}</option>
            {/each}
          </select>
        </div>

        <div class="view-toggle">
          <button
            class="view-btn"
            class:active={viewMode === 'grid'}
            onclick={() => (viewMode = 'grid')}
            title="Grid view"
          >
            ▦
          </button>
          <button
            class="view-btn"
            class:active={viewMode === 'list'}
            onclick={() => (viewMode = 'list')}
            title="List view"
          >
            ☰
          </button>
        </div>
      </div>
    </div>

    <div class="results-header">
      <p class="results-count">
        {filteredItems.length}
        {filteredItems.length === 1 ? 'item' : 'items'} found
      </p>
    </div>

    {#if filteredItems.length > 0}
      <div class="items-grid" class:list-mode={viewMode === 'list'}>
        {#each filteredItems as item (item.id)}
          <ItemCard {item} />
        {/each}
      </div>
    {:else}
      <div class="no-results">
        <span class="no-results-icon">📦</span>
        <h3>No items found</h3>
        <p>Try adjusting your filters or search query</p>
      </div>
    {/if}
  </div>
</div>

<style>
  .browse-page {
    min-height: calc(100vh - 200px);
  }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
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

  .filters-section {
    background-color: var(--background);
    padding: 1.5rem;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    margin-bottom: 2rem;
    border: 1px solid var(--border);
  }

  .search-bar {
    position: relative;
    margin-bottom: 1rem;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1.25rem;
  }

  .search-input {
    width: 100%;
    padding: 0.875rem 1rem 0.875rem 3rem;
    font-size: 1rem;
    border: 2px solid var(--border);
    border-radius: var(--radius-lg);
    transition: all var(--transition);
  }

  .search-input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }

  .filter-row {
    display: flex;
    gap: 1rem;
    align-items: flex-end;
    flex-wrap: wrap;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
    min-width: 200px;
  }

  .filter-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text-secondary);
  }

  .filter-group select {
    padding: 0.625rem 0.875rem;
    font-size: 0.875rem;
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

  .results-header {
    margin-bottom: 1.5rem;
  }

  .results-count {
    font-size: 0.875rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .items-grid.list-mode {
    grid-template-columns: 1fr;
  }

  .no-results {
    text-align: center;
    padding: 4rem 2rem;
  }

  .no-results-icon {
    font-size: 4rem;
    display: block;
    margin-bottom: 1rem;
  }

  .no-results h3 {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 0.5rem 0;
  }

  .no-results p {
    color: var(--text-secondary);
    margin: 0;
  }

  @media (max-width: 768px) {
    .page-title {
      font-size: 1.5rem;
    }

    .filter-row {
      flex-direction: column;
      align-items: stretch;
    }

    .filter-group {
      min-width: auto;
    }

    .view-toggle {
      align-self: flex-end;
    }

    .items-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

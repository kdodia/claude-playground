<script lang="ts">
  import type { Item, User } from '$lib/types';
  import { appStore } from '$lib/store';
  import { derived } from 'svelte/store';

  interface Props {
    item: Item;
  }

  let { item }: Props = $props();

  const lender = derived(appStore, ($state) =>
    $state.users.find((u) => u.id === item.lenderId)
  );
</script>

<a href="/items/{item.id}" class="item-card card">
  <div class="item-image">
    <img src={item.imageUrl} alt={item.name} />
    {#if !item.available}
      <div class="unavailable-badge">Currently Borrowed</div>
    {/if}
  </div>

  <div class="item-content">
    <h3 class="item-name">{item.name}</h3>

    <div class="item-meta">
      <span class="badge">{item.condition}</span>

      <div class="rating">
        <span>⭐</span>
        <span>{item.rating.toFixed(1)}</span>
      </div>
    </div>

    <p class="item-description">{item.description.slice(0, 80)}...</p>

    <div class="item-footer">
      <a
        href="/profile/{$lender?.id}"
        class="lender-info"
        onclick={(e) => e.stopPropagation()}
      >
        <img src={$lender?.profilePic} alt={$lender?.name} class="lender-avatar" />
        <span class="lender-name">{$lender?.name}</span>
      </a>
      <span class="borrows-count">{item.totalBorrows} borrows</span>
    </div>
  </div>
</a>

<style>
  .item-card {
    display: flex;
    flex-direction: column;
    cursor: pointer;
    text-decoration: none;
    color: inherit;
  }

  .item-image {
    position: relative;
    width: 100%;
    height: 200px;
    overflow: hidden;
    background-color: var(--surface);
  }

  .item-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--transition);
  }

  .item-card:hover .item-image img {
    transform: scale(1.05);
  }

  .unavailable-badge {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    background-color: rgba(239, 68, 68, 0.95);
    color: white;
    padding: 0.375rem 0.75rem;
    border-radius: var(--radius);
    font-size: 0.75rem;
    font-weight: 600;
  }

  .item-content {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
  }

  .item-name {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .item-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .lender-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    color: inherit;
    transition: all var(--transition);
    border-radius: var(--radius);
    padding: 0.25rem 0.5rem;
    margin: -0.25rem -0.5rem;
  }

  .lender-info:hover {
    background-color: rgba(16, 185, 129, 0.1);
  }

  .lender-info:hover .lender-name {
    color: var(--primary);
  }

  .lender-avatar {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    object-fit: cover;
  }

  .lender-name {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .item-description {
    font-size: 0.875rem;
    color: var(--text-secondary);
    line-height: 1.5;
    flex: 1;
  }

  .item-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border);
  }

  .borrows-count {
    font-size: 0.75rem;
    color: var(--text-muted);
  }
</style>

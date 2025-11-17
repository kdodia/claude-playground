<script lang="ts">
  import { page } from '$app/stores';
  import { appStore } from '$lib/store';
  import ItemCard from '$lib/components/ItemCard.svelte';

  let userId = $derived($page.params.id);
  let user = $derived($appStore.users.find((u) => u.id === userId));
  let currentUser = $derived($appStore.users.find((u) => u.id === $appStore.currentUserId));

  let userItems = $derived(
    $appStore.items.filter((item) => item.ownerId === userId && item.available)
  );

  let borrowHistory = $derived(
    $appStore.borrowHistory.filter((h) => h.borrowerId === userId || h.ownerId === userId)
  );

  // Get active borrows for this user
  let activeBorrows = $derived(
    $appStore.borrowRequests.filter(
      (r) => (r.borrowerId === userId || r.ownerId === userId) && (r.status === 'active' || r.status === 'approved')
    )
  );

  // Combine active and completed for activity history
  let allActivity = $derived([...activeBorrows, ...borrowHistory]);

  let isCurrentUser = $derived(userId === $appStore.currentUserId);
  let isFriend = $derived(currentUser?.friendIds.includes(userId || '') || false);
  let isCloseFriend = $derived(currentUser?.closeFriendIds.includes(userId || '') || false);
</script>

{#if !user}
  <div class="container">
    <div class="error-state">
      <h2>User not found</h2>
      <p>This user doesn't exist or has been removed.</p>
      <a href="/" class="btn btn-primary">Back to Browse</a>
    </div>
  </div>
{:else}
  <div class="profile-page fade-in">
    <div class="container">
      <div class="profile-header card">
        <img src={user.profilePic} alt={user.name} class="profile-avatar" />
        <div class="profile-info">
          <h1 class="profile-name">{user.name}</h1>
          <p class="profile-bio">{user.bio}</p>

          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-value">⭐ {user.rating.toFixed(1)}</span>
              <span class="stat-label">Rating</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{user.totalLends}</span>
              <span class="stat-label">Items Lent</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{user.totalBorrows}</span>
              <span class="stat-label">Items Borrowed</span>
            </div>
          </div>

          <div class="profile-badges">
            {#if isCurrentUser}
              <span class="badge badge-primary">Your Profile</span>
            {/if}
            {#if isCloseFriend}
              <span class="badge badge-success">Close Friend</span>
            {:else if isFriend}
              <span class="badge badge-primary">Friend</span>
            {/if}
          </div>
        </div>
      </div>

      <div class="profile-content">
        <section class="items-section">
          <h2 class="section-title">Available Items ({userItems.length})</h2>
          {#if userItems.length === 0}
            <div class="empty-state">
              <span class="empty-icon">📦</span>
              <p>
                {isCurrentUser
                  ? "You haven't added any items yet"
                  : `${user.name} hasn't added any items yet`}
              </p>
            </div>
          {:else}
            <div class="items-grid">
              {#each userItems as item (item.id)}
                <ItemCard {item} />
              {/each}
            </div>
          {/if}
        </section>

        {#if allActivity.length > 0}
          <section class="history-section">
            <h2 class="section-title">Activity History</h2>
            <div class="history-list">
              {#each allActivity.slice(0, 10) as activity}
                {@const item = $appStore.items.find((i) => i.id === activity.itemId)}
                {@const otherUser = $appStore.users.find(
                  (u) => u.id === (activity.borrowerId === userId ? activity.ownerId : activity.borrowerId)
                )}
                {@const wasBorrower = activity.borrowerId === userId}
                {@const isActive = 'status' in activity && (activity.status === 'active' || activity.status === 'approved')}
                <div class="history-item" class:active-item={isActive}>
                  <a href="/items/{item?.id}" class="history-item-image-link">
                    <img src={item?.imageUrl} alt={item?.name} class="history-item-image" />
                  </a>
                  <div class="history-details">
                    <div class="history-action">
                      <span>{wasBorrower ? '📤 Borrowed' : '📥 Lent'}</span>
                      <a href="/items/{item?.id}" class="history-link"><strong>{item?.name}</strong></a>
                      <span>{wasBorrower ? 'from' : 'to'}</span>
                      <a href="/profile/{otherUser?.id}" class="history-link"><strong>{otherUser?.name}</strong></a>
                      {#if isActive}
                        <span class="badge badge-success">Active</span>
                      {/if}
                    </div>
                    <div class="history-date">
                      {#if isActive}
                        Return by: {new Date(activity.endDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      {:else}
                        {new Date(activity.endDate).toLocaleDateString('en-US', {
                          month: 'short',
                          year: 'numeric'
                        })}
                      {/if}
                    </div>
                    {#if 'rating' in activity && activity.rating}
                      <div class="history-rating">
                        {#each Array(activity.rating) as _}
                          <span>⭐</span>
                        {/each}
                      </div>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </section>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .profile-header {
    display: flex;
    gap: 2rem;
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .profile-avatar {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    object-fit: cover;
    border: 4px solid var(--primary);
    flex-shrink: 0;
  }

  .profile-info {
    flex: 1;
  }

  .profile-name {
    font-size: 2rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
  }

  .profile-bio {
    color: var(--text-secondary);
    margin: 0 0 1.5rem 0;
    line-height: 1.6;
  }

  .profile-stats {
    display: flex;
    gap: 2rem;
    margin-bottom: 1.5rem;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
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

  .profile-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .section-title {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 1.5rem 0;
  }

  .items-section {
    margin-bottom: 3rem;
  }

  .items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 2rem;
  }

  .empty-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 1rem;
  }

  .empty-state p {
    color: var(--text-secondary);
    margin: 0;
  }

  .history-section {
    margin-top: 3rem;
  }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .history-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background-color: var(--surface);
    border-radius: var(--radius);
    align-items: center;
  }

  .history-item.active-item {
    background-color: rgba(16, 185, 129, 0.05);
    border-left: 3px solid var(--primary);
  }

  .history-item-image-link {
    display: block;
    flex-shrink: 0;
    transition: opacity var(--transition);
  }

  .history-item-image-link:hover {
    opacity: 0.8;
  }

  .history-item-image {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: var(--radius);
    flex-shrink: 0;
    display: block;
  }

  .history-details {
    flex: 1;
  }

  .history-action {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .history-action strong {
    color: var(--text-primary);
  }

  .history-link {
    text-decoration: none;
    color: inherit;
    transition: color var(--transition);
  }

  .history-link:hover {
    color: var(--primary);
  }

  .history-date {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .history-rating {
    margin-top: 0.25rem;
    font-size: 0.875rem;
  }

  .error-state {
    text-align: center;
    padding: 4rem 2rem;
  }

  @media (max-width: 768px) {
    .profile-header {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .profile-stats {
      justify-content: center;
    }

    .items-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

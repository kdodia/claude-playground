<script lang="ts">
  import { appStore } from '$lib/store';

  let currentUser = $derived($appStore.users.find((u) => u.id === $appStore.currentUserId));

  // Get users in each tier
  let closeFriends = $derived(
    currentUser ? $appStore.users.filter((u) => currentUser.closeFriendIds.includes(u.id)) : []
  );

  let friends = $derived(
    currentUser
      ? $appStore.users.filter(
          (u) => currentUser.friendIds.includes(u.id) && !currentUser.closeFriendIds.includes(u.id)
        )
      : []
  );

  let friendsOfFriends = $derived(
    currentUser
      ? $appStore.users.filter((u) => {
          if (u.id === currentUser.id) return false;
          if (currentUser.friendIds.includes(u.id)) return false;
          // Check if any of current user's friends are friends with this user
          return currentUser.friendIds.some((friendId) => u.friendIds.includes(friendId));
        })
      : []
  );

  let neighbors = $derived(
    currentUser
      ? $appStore.users.filter((u) => {
          if (u.id === currentUser.id) return false;
          if (currentUser.friendIds.includes(u.id)) return false;
          // Same city = neighbors
          return u.address?.city === currentUser.address?.city;
        })
      : []
  );

  let networkTab = $state<'close-friends' | 'friends' | 'friends-of-friends' | 'neighbors'>(
    'close-friends'
  );
</script>

<div class="network-page fade-in">
  <div class="container">
    <header class="page-header">
      <div>
        <h1 class="page-title">My Network</h1>
        <p class="page-subtitle">Manage your connections and sharing circles</p>
      </div>
    </header>

    <div class="stats-grid">
      <div class="stat-card card">
        <div class="stat-icon">💚</div>
        <div class="stat-info">
          <div class="stat-value">{closeFriends.length}</div>
          <div class="stat-label">Close Friends</div>
          <div class="stat-desc">Your most trusted circle</div>
        </div>
      </div>

      <div class="stat-card card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-value">{friends.length}</div>
          <div class="stat-label">Friends</div>
          <div class="stat-desc">Direct connections</div>
        </div>
      </div>

      <div class="stat-card card">
        <div class="stat-icon">🔗</div>
        <div class="stat-info">
          <div class="stat-value">{friendsOfFriends.length}</div>
          <div class="stat-label">Friends of Friends</div>
          <div class="stat-desc">Extended network</div>
        </div>
      </div>

      <div class="stat-card card">
        <div class="stat-icon">🏘️</div>
        <div class="stat-info">
          <div class="stat-value">{neighbors.length}</div>
          <div class="stat-label">Neighbors</div>
          <div class="stat-desc">People in {currentUser?.address?.city}</div>
        </div>
      </div>
    </div>

    <div class="network-section">
      <div class="network-tabs">
        <button
          class="network-tab"
          class:active={networkTab === 'close-friends'}
          onclick={() => (networkTab = 'close-friends')}
        >
          <span>💚</span>
          <span>Close Friends</span>
          {#if closeFriends.length > 0}
            <span class="tab-badge">{closeFriends.length}</span>
          {/if}
        </button>

        <button
          class="network-tab"
          class:active={networkTab === 'friends'}
          onclick={() => (networkTab = 'friends')}
        >
          <span>👥</span>
          <span>Friends</span>
          {#if friends.length > 0}
            <span class="tab-badge">{friends.length}</span>
          {/if}
        </button>

        <button
          class="network-tab"
          class:active={networkTab === 'friends-of-friends'}
          onclick={() => (networkTab = 'friends-of-friends')}
        >
          <span>🔗</span>
          <span>Friends of Friends</span>
          {#if friendsOfFriends.length > 0}
            <span class="tab-badge">{friendsOfFriends.length}</span>
          {/if}
        </button>

        <button
          class="network-tab"
          class:active={networkTab === 'neighbors'}
          onclick={() => (networkTab = 'neighbors')}
        >
          <span>🏘️</span>
          <span>Neighbors</span>
          {#if neighbors.length > 0}
            <span class="tab-badge">{neighbors.length}</span>
          {/if}
        </button>
      </div>

      <div class="tab-content">
        {#if networkTab === 'close-friends'}
          <div class="users-grid">
            {#if closeFriends.length === 0}
              <div class="empty-state">
                <span class="empty-icon">💚</span>
                <h3>No close friends yet</h3>
                <p>Promote friends to your inner circle to share special items with them</p>
              </div>
            {:else}
              {#each closeFriends as user}
                <div class="user-card card">
                  <a href="/profile/{user.id}" class="user-card-link">
                    <img src={user.profilePic} alt={user.name} class="user-avatar" />
                    <div class="user-info">
                      <h3 class="user-name">{user.name}</h3>
                      <p class="user-location">{user.address?.city}</p>
                      <div class="user-stats">
                        <span>⭐ {user.rating.toFixed(1)}</span>
                        <span>•</span>
                        <span>{user.totalLends} lends</span>
                      </div>
                    </div>
                  </a>
                  <div class="user-actions">
                    <span class="badge badge-success">Close Friend</span>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        {:else if networkTab === 'friends'}
          <div class="users-grid">
            {#if friends.length === 0}
              <div class="empty-state">
                <span class="empty-icon">👥</span>
                <h3>No friends yet</h3>
                <p>Connect with friends-of-friends and neighbors to grow your network</p>
              </div>
            {:else}
              {#each friends as user}
                <div class="user-card card">
                  <a href="/profile/{user.id}" class="user-card-link">
                    <img src={user.profilePic} alt={user.name} class="user-avatar" />
                    <div class="user-info">
                      <h3 class="user-name">{user.name}</h3>
                      <p class="user-location">{user.address?.city}</p>
                      <div class="user-stats">
                        <span>⭐ {user.rating.toFixed(1)}</span>
                        <span>•</span>
                        <span>{user.totalLends} lends</span>
                      </div>
                    </div>
                  </a>
                  <div class="user-actions">
                    <button class="btn btn-sm btn-primary">Promote to Close Friend</button>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        {:else if networkTab === 'friends-of-friends'}
          <div class="users-grid">
            {#if friendsOfFriends.length === 0}
              <div class="empty-state">
                <span class="empty-icon">🔗</span>
                <h3>No friends-of-friends</h3>
                <p>Your friends don't have any other connections yet</p>
              </div>
            {:else}
              {#each friendsOfFriends as user}
                <div class="user-card card">
                  <a href="/profile/{user.id}" class="user-card-link">
                    <img src={user.profilePic} alt={user.name} class="user-avatar" />
                    <div class="user-info">
                      <h3 class="user-name">{user.name}</h3>
                      <p class="user-location">{user.address?.city}</p>
                      <div class="user-stats">
                        <span>⭐ {user.rating.toFixed(1)}</span>
                        <span>•</span>
                        <span>{user.totalLends} lends</span>
                      </div>
                    </div>
                  </a>
                  <div class="user-actions">
                    <button class="btn btn-sm btn-primary">Send Friend Request</button>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        {:else if networkTab === 'neighbors'}
          <div class="users-grid">
            {#if neighbors.length === 0}
              <div class="empty-state">
                <span class="empty-icon">🏘️</span>
                <h3>No neighbors found</h3>
                <p>No other users in {currentUser?.address?.city} yet</p>
              </div>
            {:else}
              {#each neighbors as user}
                <div class="user-card card">
                  <a href="/profile/{user.id}" class="user-card-link">
                    <img src={user.profilePic} alt={user.name} class="user-avatar" />
                    <div class="user-info">
                      <h3 class="user-name">{user.name}</h3>
                      <p class="user-location">{user.address?.city}</p>
                      <div class="user-stats">
                        <span>⭐ {user.rating.toFixed(1)}</span>
                        <span>•</span>
                        <span>{user.totalLends} lends</span>
                      </div>
                    </div>
                  </a>
                  <div class="user-actions">
                    <button class="btn btn-sm btn-primary">Send Friend Request</button>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .page-header {
    margin-bottom: 2rem;
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

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 3rem;
  }

  .stat-card {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .stat-icon {
    font-size: 3rem;
    flex-shrink: 0;
  }

  .stat-info {
    flex: 1;
  }

  .stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--primary);
    line-height: 1;
    margin-bottom: 0.5rem;
  }

  .stat-label {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }

  .stat-desc {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .network-section {
    margin-top: 2rem;
  }

  .network-tabs {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid var(--border);
    overflow-x: auto;
  }

  .network-tab {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem 1.5rem;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -2px;
    cursor: pointer;
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--text-secondary);
    transition: all var(--transition);
    white-space: nowrap;
  }

  .network-tab:hover {
    color: var(--text-primary);
    background-color: var(--surface);
  }

  .network-tab.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
  }

  .network-tab .tab-badge {
    background-color: var(--primary);
    color: white;
    padding: 0.125rem 0.5rem;
    border-radius: 10px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .users-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }

  .user-card {
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
  }

  .user-card-link {
    display: flex;
    gap: 1rem;
    text-decoration: none;
    color: inherit;
    margin-bottom: 1rem;
  }

  .user-avatar {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--primary);
    flex-shrink: 0;
  }

  .user-info {
    flex: 1;
    min-width: 0;
  }

  .user-name {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 0.25rem 0;
    color: var(--text-primary);
  }

  .user-location {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0 0 0.5rem 0;
  }

  .user-stats {
    display: flex;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .user-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .empty-state {
    grid-column: 1 / -1;
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
    margin: 0;
  }

  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }

    .users-grid {
      grid-template-columns: 1fr;
    }

    .network-tab span:nth-child(2) {
      display: none;
    }

    .network-tab {
      padding: 1rem;
    }
  }
</style>

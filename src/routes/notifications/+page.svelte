<script lang="ts">
  import { appStore, currentUserNotifications } from '$lib/store';
  import { goto } from '$app/navigation';

  function markAsRead(notificationId: string) {
    appStore.markNotificationAsRead(notificationId);
  }

  function markAllAsRead() {
    appStore.markAllNotificationsAsRead($appStore.currentUserId);
  }

  function handleNotificationClick(notification: any) {
    markAsRead(notification.id);
    if (notification.relatedId) {
      if (notification.type === 'borrow-request') {
        goto('/dashboard');
      } else {
        goto('/dashboard');
      }
    }
  }

  let unreadCount = $derived($currentUserNotifications.filter((n) => !n.read).length);
</script>

<div class="notifications-page fade-in">
  <div class="container">
    <header class="page-header">
      <div>
        <h1 class="page-title">Notifications</h1>
        <p class="page-subtitle">
          {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
        </p>
      </div>
      {#if unreadCount > 0}
        <button class="btn btn-secondary" onclick={markAllAsRead}> Mark All as Read </button>
      {/if}
    </header>

    {#if $currentUserNotifications.length === 0}
      <div class="empty-state">
        <span class="empty-icon">🔔</span>
        <h3>No notifications yet</h3>
        <p>When people request your items or respond to your requests, you'll see it here</p>
      </div>
    {:else}
      <div class="notifications-list">
        {#each $currentUserNotifications as notification (notification.id)}
          <button
            class="notification-item card"
            class:unread={!notification.read}
            onclick={() => handleNotificationClick(notification)}
          >
            <div class="notification-icon">
              {#if notification.type === 'borrow-request'}
                📥
              {:else if notification.type === 'request-approved'}
                ✅
              {:else if notification.type === 'request-denied'}
                ❌
              {:else if notification.type === 'return-reminder'}
                ⏰
              {:else if notification.type === 'item-returned'}
                📦
              {:else}
                ℹ️
              {/if}
            </div>

            <div class="notification-content">
              <h3 class="notification-title">{notification.title}</h3>
              <p class="notification-message">{notification.message}</p>
              <span class="notification-time">
                {new Date(notification.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </span>
            </div>

            {#if !notification.read}
              <div class="unread-indicator"></div>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
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

  .notifications-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .notification-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
    text-align: left;
    cursor: pointer;
    position: relative;
    transition: all var(--transition);
    width: 100%;
  }

  .notification-item:hover {
    transform: translateX(4px);
  }

  .notification-item.unread {
    background-color: rgba(16, 185, 129, 0.05);
    border-left: 4px solid var(--primary);
  }

  .notification-icon {
    font-size: 2rem;
    flex-shrink: 0;
  }

  .notification-content {
    flex: 1;
  }

  .notification-title {
    font-size: 1rem;
    font-weight: 600;
    margin: 0 0 0.25rem 0;
    color: var(--text-primary);
  }

  .notification-message {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0 0 0.5rem 0;
    line-height: 1.5;
  }

  .notification-time {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .unread-indicator {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: var(--primary);
    flex-shrink: 0;
    margin-top: 0.5rem;
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
    margin: 0;
  }

  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .notification-item {
      gap: 0.75rem;
      padding: 1rem;
    }

    .notification-icon {
      font-size: 1.5rem;
    }
  }
</style>

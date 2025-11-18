<script lang="ts">
  import { page } from '$app/stores';
  import { appStore, getCategoryPath, getPermissionLevelInfo } from '$lib/store';
  import { goto } from '$app/navigation';
  import Toast from '$lib/components/Toast.svelte';
  import type { BorrowRequest } from '$lib/types';

  let itemId = $derived($page.params.id);
  let item = $derived($appStore.items.find((i) => i.id === itemId));
  let lender = $derived($appStore.users.find((u) => u.id === item?.lenderId));
  let currentUser = $derived($appStore.users.find((u) => u.id === $appStore.currentUserId));
  let categoryPath = $derived(item ? getCategoryPath(item.categoryId, $appStore) : []);
  let permissionInfo = $derived(item ? getPermissionLevelInfo(item.permissionLevel) : null);

  // Get borrowing history for this item
  let history = $derived(
    $appStore.borrowHistory
      .filter((h) => h.itemId === itemId)
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
  );

  // Get active borrows for calendar
  let activeBorrows = $derived(
    $appStore.borrowRequests.filter(
      (r) => r.itemId === itemId && (r.status === 'approved' || r.status === 'active')
    )
  );

  // Request form state
  let showRequestForm = $state(false);
  let startDate = $state('');
  let endDate = $state('');
  let requestMessage = $state('');
  let toast = $state<{ message: string; type: 'success' | 'error' } | null>(null);

  // Check if current user has already requested this item
  let existingRequest = $derived(
    $appStore.borrowRequests.find(
      (req) =>
        req.itemId === itemId &&
        req.borrowerId === $appStore.currentUserId &&
        req.status === 'pending'
    )
  );

  // Check if current user can request this item
  let canRequest = $derived(
    item && currentUser && item.lenderId !== $appStore.currentUserId && item.available && !existingRequest
  );

  // Check if nudge button should be shown (3+ days after request, not already nudged)
  let canNudge = $derived.by(() => {
    if (!existingRequest) return false;
    if (existingRequest.lastNudgedAt) return false; // Already nudged

    const requestDate = new Date(existingRequest.createdAt);
    const now = new Date();
    const daysSinceRequest = Math.floor((now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));

    return daysSinceRequest >= 3;
  });

  // Calculate days remaining until nudge is available
  let daysUntilNudge = $derived.by(() => {
    if (!existingRequest || existingRequest.lastNudgedAt || canNudge) return null;

    const requestDate = new Date(existingRequest.createdAt);
    const now = new Date();
    const daysSinceRequest = Math.floor((now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24));

    return 3 - daysSinceRequest;
  });

  // Calculate the date when nudge becomes available
  let nudgeAvailableDate = $derived.by(() => {
    if (!existingRequest || existingRequest.lastNudgedAt || canNudge) return null;

    const requestDate = new Date(existingRequest.createdAt);
    const availableDate = new Date(requestDate);
    availableDate.setDate(availableDate.getDate() + 3);

    return availableDate;
  });

  function openRequestForm() {
    showRequestForm = true;
    // Set min date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    startDate = tomorrow.toISOString().split('T')[0];
  }

  function nudgeLender() {
    if (!existingRequest) return;
    appStore.nudgeRequest(existingRequest.id);
    toast = { message: 'Reminder sent!', type: 'success' };
    setTimeout(() => (toast = null), 3000);
  }

  function submitRequest() {
    if (!item || !startDate || !endDate) return;

    // Validate that end date is after start date
    if (new Date(endDate) <= new Date(startDate)) {
      toast = { message: 'End date must be after start date', type: 'error' };
      setTimeout(() => (toast = null), 3000);
      return;
    }

    const request: BorrowRequest = {
      id: `req-${Date.now()}`,
      itemId: item.id,
      borrowerId: $appStore.currentUserId,
      lenderId: item.lenderId,
      startDate,
      endDate,
      status: 'pending',
      message: requestMessage,
      createdAt: new Date().toISOString()
    };

    appStore.createBorrowRequest(request);
    toast = { message: 'Borrow request sent!', type: 'success' };
    showRequestForm = false;
    startDate = '';
    endDate = '';
    requestMessage = '';

    setTimeout(() => {
      toast = null;
    }, 3000);
  }

  function isDateBooked(date: string): boolean {
    return activeBorrows.some((borrow) => {
      return date >= borrow.startDate && date <= borrow.endDate;
    });
  }

  function isDateBlocked(date: string): boolean {
    if (!item?.blockedDates) return false;
    return item.blockedDates.some((block) => {
      return date >= block.startDate && date <= block.endDate;
    });
  }

  // Generate next 90 days for calendar
  let calendarDates = $derived.by(() => {
    const dates: Array<{ date: string; booked: boolean; blocked: boolean; borrow?: BorrowRequest }> = [];
    const today = new Date();

    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const borrow = activeBorrows.find((b) => dateStr >= b.startDate && dateStr <= b.endDate);
      const blocked = isDateBlocked(dateStr);

      dates.push({
        date: dateStr,
        booked: !!borrow,
        blocked,
        borrow
      });
    }

    return dates;
  });
</script>

{#if !item}
  <div class="container">
    <div class="error-state">
      <h2>Item not found</h2>
      <p>The item you're looking for doesn't exist or has been removed.</p>
      <a href="/" class="btn btn-primary">Back to Browse</a>
    </div>
  </div>
{:else}
  <div class="item-detail-page fade-in">
    <div class="container">
      <div class="breadcrumbs">
        <a href="/">Browse</a>
        {#each categoryPath as cat}
          <span class="breadcrumb-sep">›</span>
          <span>{cat}</span>
        {/each}
      </div>

      <div class="item-detail-grid">
        <div class="item-main">
          <div class="item-image-large">
            <img src={item.imageUrl} alt={item.name} />
            {#if !item.available}
              <div class="status-badge unavailable">Currently Borrowed</div>
            {:else}
              <div class="status-badge available">Available</div>
            {/if}
          </div>

          <div class="item-info">
            <div class="item-title-row">
              <h1 class="item-title">{item.name}</h1>
              {#if item.lenderId === $appStore.currentUserId}
                <a href="/items/{item.id}/edit" class="btn btn-secondary">Edit Item</a>
              {/if}
            </div>

            <div class="item-meta-row">
              <div class="rating-large">
                <span>⭐</span>
                <span class="rating-value">{item.rating.toFixed(1)}</span>
                <span class="rating-count">({item.totalBorrows} borrows)</span>
              </div>
              <span class="badge badge-primary">{item.condition}</span>
            </div>

            <div class="lender-card">
              <img src={lender?.profilePic} alt={lender?.name} class="lender-avatar-large" />
              <div class="lender-info">
                <span class="lender-label">Lent by</span>
                <a href="/profile/{lender?.id}" class="lender-name-large">{lender?.name}</a>
                <div class="lender-stats">
                  <span>⭐ {lender?.rating.toFixed(1)}</span>
                  <span>•</span>
                  <span>{lender?.totalLends} items lent</span>
                </div>
              </div>
            </div>

            {#if permissionInfo}
              <div class="permission-card">
                <div class="permission-header">
                  <span class="permission-icon">{permissionInfo.icon}</span>
                  <div>
                    <h4>Who Can Borrow This</h4>
                    <p class="permission-level">{permissionInfo.label}</p>
                  </div>
                </div>
                <p class="permission-description">
                  {#if item.permissionLevel === 'close-friends'}
                    This item is available only to {lender?.name}'s close friends
                  {:else if item.permissionLevel === 'friends'}
                    This item is available to all of {lender?.name}'s friends
                  {:else if item.permissionLevel === 'friends-of-friends'}
                    This item is available to friends and their extended network
                  {:else if item.permissionLevel === 'neighbors'}
                    This item is available to anyone in {lender?.address?.city}
                  {/if}
                </p>
              </div>
            {/if}

            <div class="item-description">
              <h3>Description</h3>
              <p>{item.description}</p>
            </div>

            {#if item.tagIds.length > 0}
              <div class="item-tags">
                <h3>Collections</h3>
                <div class="tags-list">
                  {#each $appStore.tags.filter((t) => item.tagIds.includes(t.id)) as tag}
                    <span class="badge badge-primary">🏷️ {tag.name}</span>
                  {/each}
                </div>
              </div>
            {/if}

            {#if existingRequest}
              <div class="action-section">
                <div class="request-status-card">
                  <div class="request-status-header">
                    <span class="status-icon">⏳</span>
                    <div>
                      <h4>Request Sent</h4>
                      <p class="request-status-date">
                        Sent {new Date(existingRequest.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  {#if existingRequest.message}
                    <p class="request-status-message">"{existingRequest.message}"</p>
                  {/if}
                  <div class="request-status-dates">
                    <span>📅 {new Date(existingRequest.startDate).toLocaleDateString()} - {new Date(existingRequest.endDate).toLocaleDateString()}</span>
                  </div>
                  <p class="request-status-info">Waiting for {lender?.name} to respond to your request</p>

                  {#if canNudge}
                    <div class="nudge-section">
                      <button class="btn btn-secondary btn-sm" onclick={nudgeLender}>
                        👋 Send Friendly Reminder
                      </button>
                      <p class="nudge-hint">Send a gentle nudge to remind {lender?.name} about your request</p>
                    </div>
                  {:else if existingRequest.lastNudgedAt}
                    <div class="nudge-sent">
                      <span>✓ Reminder sent {new Date(existingRequest.lastNudgedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}</span>
                    </div>
                  {:else if daysUntilNudge !== null && nudgeAvailableDate}
                    <div class="nudge-waiting">
                      <span class="nudge-waiting-icon">⏳</span>
                      <p class="nudge-waiting-text">
                        {#if daysUntilNudge === 1}
                          Friendly reminder available tomorrow
                        {:else}
                          Friendly reminder available in {daysUntilNudge} days ({nudgeAvailableDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })})
                        {/if}
                      </p>
                    </div>
                  {/if}
                </div>
              </div>
            {:else if canRequest}
              <div class="action-section">
                {#if !showRequestForm}
                  <button class="btn btn-primary btn-lg" onclick={openRequestForm}>
                    Request to Borrow
                  </button>
                {:else}
                  <div class="request-form">
                    <h3>Request to Borrow</h3>
                    <div class="form-row">
                      <div class="form-group">
                        <label for="start-date">Start Date</label>
                        <input
                          type="date"
                          id="start-date"
                          bind:value={startDate}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div class="form-group">
                        <label for="end-date">End Date</label>
                        <input
                          type="date"
                          id="end-date"
                          bind:value={endDate}
                          min={startDate}
                        />
                      </div>
                    </div>
                    <div class="form-group">
                      <label for="message">Message (optional)</label>
                      <textarea
                        id="message"
                        bind:value={requestMessage}
                        placeholder="Let the lender know why you need this item..."
                        rows="3"
                      ></textarea>
                    </div>
                    <div class="form-actions">
                      <button
                        class="btn btn-primary"
                        onclick={submitRequest}
                        disabled={!startDate || !endDate}
                      >
                        Send Request
                      </button>
                      <button class="btn btn-secondary" onclick={() => (showRequestForm = false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>

        <div class="item-sidebar">
          <div class="calendar-section card">
            <h3>Availability Calendar</h3>
            <div class="calendar-legend">
              <div class="legend-item">
                <span class="legend-dot available"></span>
                <span>Available</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot booked"></span>
                <span>Booked</span>
              </div>
              <div class="legend-item">
                <span class="legend-dot blocked"></span>
                <span>Blocked</span>
              </div>
            </div>
            <div class="calendar-grid">
              {#each calendarDates.slice(0, 30) as dateInfo}
                {@const date = new Date(dateInfo.date)}
                <div
                  class="calendar-day"
                  class:booked={dateInfo.booked}
                  class:blocked={dateInfo.blocked}
                  title={dateInfo.blocked
                    ? `Blocked ${dateInfo.date}`
                    : dateInfo.booked
                    ? `Booked ${dateInfo.date}`
                    : `Available ${dateInfo.date}`}
                >
                  <div class="day-number">{date.getDate()}</div>
                  <div class="day-label">
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>
              {/each}
            </div>
          </div>

          {#if history.length > 0}
            <div class="reviews-section card">
              <h3>Reviews ({history.filter((h) => h.review).length})</h3>
              <div class="reviews-list">
                {#each history.filter((h) => h.review) as hist}
                  {@const borrower = $appStore.users.find((u) => u.id === hist.borrowerId)}
                  <div class="review-item">
                    <div class="review-header">
                      <img src={borrower?.profilePic} alt={borrower?.name} class="reviewer-avatar" />
                      <div>
                        <div class="reviewer-name">{borrower?.name}</div>
                        <div class="review-rating">
                          {#each Array(hist.rating || 0) as _, i}
                            <span>⭐</span>
                          {/each}
                        </div>
                      </div>
                    </div>
                    <p class="review-text">{hist.review}</p>
                    <div class="review-date">
                      {new Date(hist.endDate).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

{#if toast}
  <Toast message={toast.message} type={toast.type} onClose={() => (toast = null)} />
{/if}

<style>
  .breadcrumbs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 2rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .breadcrumb-sep {
    color: var(--text-muted);
  }

  .item-detail-grid {
    display: grid;
    grid-template-columns: 1fr 400px;
    gap: 2rem;
  }

  .item-image-large {
    position: relative;
    width: 100%;
    height: 400px;
    border-radius: var(--radius-lg);
    overflow: hidden;
    background-color: var(--surface);
    box-shadow: var(--shadow-md);
  }

  .item-image-large img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .status-badge {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.5rem 1rem;
    border-radius: var(--radius);
    font-weight: 600;
    font-size: 0.875rem;
  }

  .status-badge.available {
    background-color: var(--success);
    color: white;
  }

  .status-badge.unavailable {
    background-color: var(--error);
    color: white;
  }

  .item-info {
    margin-top: 2rem;
  }

  .item-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .item-title {
    font-size: 2rem;
    font-weight: 700;
    margin: 0;
  }

  .item-meta-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .rating-large {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.25rem;
  }

  .rating-value {
    font-weight: 700;
    color: var(--text-primary);
  }

  .rating-count {
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .lender-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background-color: var(--surface);
    border-radius: var(--radius-lg);
    margin-bottom: 1.5rem;
  }

  .lender-avatar-large {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--primary);
  }

  .permission-card {
    padding: 1.5rem;
    background-color: var(--surface);
    border-radius: var(--radius-lg);
    margin-bottom: 2rem;
    border: 2px solid var(--border);
  }

  .permission-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .permission-icon {
    font-size: 2.5rem;
    flex-shrink: 0;
  }

  .permission-card h4 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .permission-level {
    margin: 0.25rem 0 0 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--primary);
  }

  .permission-description {
    margin: 0;
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--text-secondary);
  }

  .lender-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .lender-name-large {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--primary);
    display: block;
    margin: 0.25rem 0;
  }

  .lender-stats {
    display: flex;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .item-description {
    margin-bottom: 2rem;
  }

  .item-description h3,
  .item-tags h3 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
  }

  .item-description p {
    line-height: 1.7;
    color: var(--text-secondary);
  }

  .item-tags {
    margin-bottom: 2rem;
  }

  .tags-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .action-section {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border);
  }

  .request-form {
    background-color: var(--surface);
    padding: 1.5rem;
    border-radius: var(--radius-lg);
  }

  .request-form h3 {
    margin: 0 0 1.5rem 0;
    font-size: 1.25rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .form-group input,
  .form-group textarea {
    width: 100%;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }

  .request-status-card {
    background-color: var(--surface);
    padding: 1.5rem;
    border-radius: var(--radius-lg);
    border: 2px solid var(--border);
  }

  .request-status-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .status-icon {
    font-size: 2.5rem;
    flex-shrink: 0;
  }

  .request-status-card h4 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .request-status-date {
    margin: 0.25rem 0 0 0;
    font-size: 0.875rem;
    color: var(--text-secondary);
  }

  .request-status-message {
    font-style: italic;
    color: var(--text-secondary);
    margin: 0 0 1rem 0;
    padding: 0.75rem;
    background-color: var(--background);
    border-radius: var(--radius);
    border-left: 3px solid var(--primary);
  }

  .request-status-dates {
    padding: 0.75rem;
    background-color: var(--background);
    border-radius: var(--radius);
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 1rem;
  }

  .request-status-info {
    margin: 0;
    font-size: 0.875rem;
    color: var(--text-muted);
    text-align: center;
  }

  .nudge-section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .nudge-hint {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--text-muted);
    text-align: center;
  }

  .nudge-sent {
    margin-top: 1rem;
    padding: 0.75rem;
    background-color: rgba(16, 185, 129, 0.1);
    border-radius: var(--radius);
    text-align: center;
    font-size: 0.875rem;
    color: var(--success);
    font-weight: 500;
  }

  .nudge-waiting {
    margin-top: 1rem;
    padding: 0.75rem;
    background-color: rgba(59, 130, 246, 0.1);
    border-radius: var(--radius);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
  }

  .nudge-waiting-icon {
    font-size: 1.25rem;
  }

  .nudge-waiting-text {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--text-muted);
    line-height: 1.4;
  }

  .calendar-section,
  .reviews-section {
    padding: 1.5rem;
  }

  .calendar-section h3,
  .reviews-section h3 {
    margin: 0 0 1rem 0;
    font-size: 1.125rem;
    font-weight: 600;
  }

  .calendar-legend {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .legend-dot {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
  }

  .legend-dot.available {
    background-color: var(--success);
  }

  .legend-dot.booked {
    background-color: var(--error);
  }

  .legend-dot.blocked {
    background-color: #6b7280;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;
  }

  .calendar-day {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius);
    background-color: rgba(16, 185, 129, 0.1);
    cursor: pointer;
    transition: all var(--transition);
  }

  .calendar-day:hover {
    transform: scale(1.05);
  }

  .calendar-day.booked {
    background-color: rgba(239, 68, 68, 0.1);
  }

  .calendar-day.blocked {
    background-color: rgba(107, 114, 128, 0.1);
    cursor: not-allowed;
  }

  .day-number {
    font-weight: 600;
    font-size: 0.875rem;
  }

  .day-label {
    font-size: 0.625rem;
    color: var(--text-muted);
  }

  .reviews-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .review-item {
    padding: 1rem;
    background-color: var(--surface);
    border-radius: var(--radius);
  }

  .review-header {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .reviewer-avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    object-fit: cover;
  }

  .reviewer-name {
    font-weight: 600;
    font-size: 0.875rem;
  }

  .review-rating {
    font-size: 0.75rem;
  }

  .review-text {
    font-size: 0.875rem;
    line-height: 1.6;
    color: var(--text-secondary);
    margin: 0 0 0.5rem 0;
  }

  .review-date {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .error-state {
    text-align: center;
    padding: 4rem 2rem;
  }

  @media (max-width: 768px) {
    .item-detail-grid {
      grid-template-columns: 1fr;
    }

    .form-row {
      grid-template-columns: 1fr;
    }

    .calendar-grid {
      grid-template-columns: repeat(7, 1fr);
      gap: 0.25rem;
    }

    .day-label {
      display: none;
    }
  }
</style>

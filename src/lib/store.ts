import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { AppState, Item, User, BorrowRequest, Notification, BorrowHistory, Tag } from './types';
import { initialAppState } from './mockData';

const STORAGE_KEY = 'distributed-library-app-state';

// Load state from localStorage or use initial state
function loadState(): AppState {
  if (browser) {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse stored state:', e);
      }
    }
  }
  return initialAppState;
}

// Save state to localStorage
function saveState(state: AppState) {
  if (browser) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

// Create the main app store
function createAppStore() {
  const { subscribe, set, update } = writable<AppState>(loadState());

  // Subscribe to changes and save to localStorage
  if (browser) {
    subscribe((state) => {
      saveState(state);
    });
  }

  return {
    subscribe,
    set,
    update,

    // Reset to initial state
    reset: () => set(initialAppState),

    // User actions
    setCurrentUser: (userId: string) => {
      update((state) => ({ ...state, currentUserId: userId }));
    },

    // Item actions
    addItem: (item: Item) => {
      update((state) => ({
        ...state,
        items: [...state.items, item]
      }));
    },

    updateItem: (itemId: string, updates: Partial<Item>) => {
      update((state) => ({
        ...state,
        items: state.items.map((item) => (item.id === itemId ? { ...item, ...updates } : item))
      }));
    },

    deleteItem: (itemId: string) => {
      update((state) => ({
        ...state,
        items: state.items.filter((item) => item.id !== itemId)
      }));
    },

    // Borrow request actions
    createBorrowRequest: (request: BorrowRequest) => {
      update((state) => {
        // Create notification for owner
        const item = state.items.find((i) => i.id === request.itemId);
        const borrower = state.users.find((u) => u.id === request.borrowerId);

        const notification: Notification = {
          id: `notif-${Date.now()}`,
          userId: request.ownerId,
          type: 'borrow-request',
          title: 'New Borrow Request',
          message: `${borrower?.name} wants to borrow your ${item?.name}`,
          read: false,
          createdAt: new Date().toISOString(),
          relatedId: request.id
        };

        return {
          ...state,
          borrowRequests: [...state.borrowRequests, request],
          notifications: [...state.notifications, notification]
        };
      });
    },

    updateBorrowRequest: (requestId: string, updates: Partial<BorrowRequest>) => {
      update((state) => {
        const request = state.borrowRequests.find((r) => r.id === requestId);
        if (!request) return state;

        const updatedRequest = { ...request, ...updates };
        const item = state.items.find((i) => i.id === request.itemId);
        const owner = state.users.find((u) => u.id === request.ownerId);

        let notification: Notification | null = null;

        // Create appropriate notification based on status
        if (updates.status === 'approved') {
          notification = {
            id: `notif-${Date.now()}`,
            userId: request.borrowerId,
            type: 'request-approved',
            title: 'Request Approved!',
            message: `${owner?.name} approved your request to borrow ${item?.name}`,
            read: false,
            createdAt: new Date().toISOString(),
            relatedId: requestId
          };
        } else if (updates.status === 'denied') {
          notification = {
            id: `notif-${Date.now()}`,
            userId: request.borrowerId,
            type: 'request-denied',
            title: 'Request Denied',
            message: `${owner?.name} denied your request to borrow ${item?.name}`,
            read: false,
            createdAt: new Date().toISOString(),
            relatedId: requestId
          };
        }

        return {
          ...state,
          borrowRequests: state.borrowRequests.map((r) =>
            r.id === requestId ? updatedRequest : r
          ),
          notifications: notification
            ? [...state.notifications, notification]
            : state.notifications
        };
      });
    },

    // Complete a borrow and move to history
    completeBorrow: (requestId: string, rating: number, review: string) => {
      update((state) => {
        const request = state.borrowRequests.find((r) => r.id === requestId);
        if (!request) return state;

        const history: BorrowHistory = {
          id: `hist-${Date.now()}`,
          itemId: request.itemId,
          borrowerId: request.borrowerId,
          ownerId: request.ownerId,
          startDate: request.startDate,
          endDate: request.endDate,
          actualReturnDate: new Date().toISOString().split('T')[0],
          rating,
          review
        };

        // Update item rating
        const item = state.items.find((i) => i.id === request.itemId);
        if (item) {
          const allItemHistory = [...state.borrowHistory, history].filter(
            (h) => h.itemId === item.id && h.rating
          );
          const avgRating =
            allItemHistory.reduce((sum, h) => sum + (h.rating || 0), 0) /
            allItemHistory.length;

          state.items = state.items.map((i) =>
            i.id === item.id
              ? { ...i, rating: Math.round(avgRating * 10) / 10, available: true }
              : i
          );
        }

        return {
          ...state,
          borrowRequests: state.borrowRequests.map((r) =>
            r.id === requestId ? { ...r, status: 'completed' as const } : r
          ),
          borrowHistory: [...state.borrowHistory, history]
        };
      });
    },

    // Tag actions
    createTag: (tag: Tag) => {
      update((state) => ({
        ...state,
        tags: [...state.tags, tag]
      }));
    },

    updateTag: (tagId: string, updates: Partial<Tag>) => {
      update((state) => ({
        ...state,
        tags: state.tags.map((tag) => (tag.id === tagId ? { ...tag, ...updates } : tag))
      }));
    },

    addItemToTag: (tagId: string, itemId: string) => {
      update((state) => ({
        ...state,
        tags: state.tags.map((tag) =>
          tag.id === tagId && !tag.itemIds.includes(itemId)
            ? { ...tag, itemIds: [...tag.itemIds, itemId] }
            : tag
        )
      }));
    },

    removeItemFromTag: (tagId: string, itemId: string) => {
      update((state) => ({
        ...state,
        tags: state.tags.map((tag) =>
          tag.id === tagId
            ? { ...tag, itemIds: tag.itemIds.filter((id) => id !== itemId) }
            : tag
        )
      }));
    },

    // Notification actions
    markNotificationAsRead: (notificationId: string) => {
      update((state) => ({
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      }));
    },

    markAllNotificationsAsRead: (userId: string) => {
      update((state) => ({
        ...state,
        notifications: state.notifications.map((n) =>
          n.userId === userId ? { ...n, read: true } : n
        )
      }));
    }
  };
}

export const appStore = createAppStore();

// Derived stores for convenient access
export const currentUser = derived(appStore, ($state) =>
  $state.users.find((u) => u.id === $state.currentUserId)
);

export const currentUserItems = derived(appStore, ($state) =>
  $state.items.filter((item) => item.ownerId === $state.currentUserId)
);

export const currentUserNotifications = derived(appStore, ($state) =>
  $state.notifications
    .filter((n) => n.userId === $state.currentUserId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
);

export const unreadNotificationsCount = derived(currentUserNotifications, ($notifications) =>
  $notifications.filter((n) => !n.read).length
);

export const incomingRequests = derived(appStore, ($state) =>
  $state.borrowRequests.filter(
    (req) => req.ownerId === $state.currentUserId && req.status === 'pending'
  )
);

export const outgoingRequests = derived(appStore, ($state) =>
  $state.borrowRequests.filter((req) => req.borrowerId === $state.currentUserId)
);

export const activeLoans = derived(appStore, ($state) =>
  $state.borrowRequests.filter(
    (req) => req.ownerId === $state.currentUserId && req.status === 'active'
  )
);

// Helper function to check if a user can view an item
export function canUserViewItem(item: Item, currentUserId: string, state: AppState): boolean {
  if (item.ownerId === currentUserId) return true;

  const owner = state.users.find((u) => u.id === item.ownerId);
  if (!owner) return false;

  switch (item.permissionLevel) {
    case 'specific-users':
      return item.allowedUserIds?.includes(currentUserId) || false;
    case 'close-friends':
      return owner.closeFriendIds.includes(currentUserId);
    case 'friends':
      return owner.friendIds.includes(currentUserId);
    case 'friends-of-friends':
      // Check if any of user's friends are friends with the owner
      const currentUserData = state.users.find((u) => u.id === currentUserId);
      if (!currentUserData) return false;
      return (
        owner.friendIds.includes(currentUserId) ||
        currentUserData.friendIds.some((friendId) => owner.friendIds.includes(friendId))
      );
    case 'neighbors':
      // For simplicity, all users in same city are neighbors
      const currentUserAddress = state.users.find((u) => u.id === currentUserId)?.address;
      return currentUserAddress?.city === owner.address?.city;
    default:
      return false;
  }
}

// Helper to get category path (for breadcrumbs)
export function getCategoryPath(categoryId: string, state: AppState): string[] {
  const path: string[] = [];
  let currentCat = state.categories.find((c) => c.id === categoryId);

  while (currentCat) {
    path.unshift(currentCat.name);
    currentCat = currentCat.parentId
      ? state.categories.find((c) => c.id === currentCat!.parentId)
      : undefined;
  }

  return path;
}

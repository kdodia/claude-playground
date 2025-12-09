import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import {
	appStore,
	canUserViewItem,
	getCategoryPath,
	getPermissionLevelInfo,
	currentUser,
	currentUserItems,
	incomingRequests,
	outgoingRequests,
	activeLoans,
	visibleItems
} from './store';
import type { AppState, Item, User, BorrowRequest } from './types';

// Helper to create a minimal test state
function createTestState(overrides: Partial<AppState> = {}): AppState {
	return {
		currentUserId: 'user1',
		users: [
			{
				id: 'user1',
				name: 'Test User 1',
				email: 'test1@example.com',
				profilePic: 'https://example.com/pic1.jpg',
				bio: 'Test bio 1',
				address: { lat: 37.77, lng: -122.42, city: 'San Francisco' },
				friendIds: ['user2'],
				closeFriendIds: ['user2'],
				rating: 4.5,
				totalBorrows: 10,
				totalLends: 15
			},
			{
				id: 'user2',
				name: 'Test User 2',
				email: 'test2@example.com',
				profilePic: 'https://example.com/pic2.jpg',
				bio: 'Test bio 2',
				address: { lat: 37.78, lng: -122.41, city: 'San Francisco' },
				friendIds: ['user1', 'user3'],
				closeFriendIds: ['user1'],
				rating: 4.8,
				totalBorrows: 5,
				totalLends: 20
			},
			{
				id: 'user3',
				name: 'Test User 3',
				email: 'test3@example.com',
				profilePic: 'https://example.com/pic3.jpg',
				bio: 'Test bio 3',
				address: { lat: 37.79, lng: -122.40, city: 'Oakland' },
				friendIds: ['user2'],
				closeFriendIds: [],
				rating: 4.2,
				totalBorrows: 8,
				totalLends: 12
			}
		],
		items: [],
		categories: [
			{ id: 'cat1', name: 'Kitchen', icon: '🍳' },
			{ id: 'cat1-1', name: 'Small Appliances', parentId: 'cat1', icon: '☕' },
			{ id: 'cat1-1-1', name: 'Coffee Makers', parentId: 'cat1-1', icon: '☕' }
		],
		tags: [],
		borrowRequests: [],
		borrowHistory: [],
		friendRequests: [],
		notifications: [],
		wishlist: [],
		...overrides
	};
}

// Helper to create a test item
function createTestItem(overrides: Partial<Item> = {}): Item {
	return {
		id: 'item1',
		name: 'Test Item',
		description: 'A test item',
		categoryId: 'cat1',
		lenderId: 'user2',
		imageUrl: 'https://example.com/item.jpg',
		condition: 'good',
		permissionLevel: 'friends',
		tagIds: [],
		rating: 4.5,
		totalBorrows: 5,
		available: true,
		createdAt: '2024-01-01T00:00:00Z',
		...overrides
	};
}

describe('getPermissionLevelInfo', () => {
	it('returns correct info for close-friends', () => {
		const info = getPermissionLevelInfo('close-friends');
		expect(info.label).toBe('Close Friends');
		expect(info.icon).toBe('💚');
		expect(info.color).toBe('#10b981');
	});

	it('returns correct info for friends', () => {
		const info = getPermissionLevelInfo('friends');
		expect(info.label).toBe('Friends');
		expect(info.icon).toBe('👥');
		expect(info.color).toBe('#3b82f6');
	});

	it('returns correct info for friends-of-friends', () => {
		const info = getPermissionLevelInfo('friends-of-friends');
		expect(info.label).toBe('Friends of Friends');
		expect(info.icon).toBe('🔗');
		expect(info.color).toBe('#8b5cf6');
	});

	it('returns correct info for neighbors', () => {
		const info = getPermissionLevelInfo('neighbors');
		expect(info.label).toBe('Neighbors');
		expect(info.icon).toBe('🏘️');
		expect(info.color).toBe('#f59e0b');
	});

	it('returns correct info for specific-users', () => {
		const info = getPermissionLevelInfo('specific-users');
		expect(info.label).toBe('Specific People');
		expect(info.icon).toBe('🔒');
		expect(info.color).toBe('#6b7280');
	});

	it('returns default info for unknown permission level', () => {
		const info = getPermissionLevelInfo('unknown');
		expect(info.label).toBe('Unknown');
		expect(info.icon).toBe('❓');
	});
});

describe('getCategoryPath', () => {
	it('returns path for top-level category', () => {
		const state = createTestState();
		const path = getCategoryPath('cat1', state);
		expect(path).toEqual(['Kitchen']);
	});

	it('returns path for nested category', () => {
		const state = createTestState();
		const path = getCategoryPath('cat1-1', state);
		expect(path).toEqual(['Kitchen', 'Small Appliances']);
	});

	it('returns path for deeply nested category', () => {
		const state = createTestState();
		const path = getCategoryPath('cat1-1-1', state);
		expect(path).toEqual(['Kitchen', 'Small Appliances', 'Coffee Makers']);
	});

	it('returns empty array for non-existent category', () => {
		const state = createTestState();
		const path = getCategoryPath('non-existent', state);
		expect(path).toEqual([]);
	});
});

describe('canUserViewItem', () => {
	it('owner can always view their own items', () => {
		const state = createTestState();
		const item = createTestItem({ lenderId: 'user1', permissionLevel: 'close-friends' });
		expect(canUserViewItem(item, 'user1', state)).toBe(true);
	});

	it('close friend can view close-friends items', () => {
		const state = createTestState();
		const item = createTestItem({ lenderId: 'user2', permissionLevel: 'close-friends' });
		// user1 is a close friend of user2
		expect(canUserViewItem(item, 'user1', state)).toBe(true);
	});

	it('regular friend cannot view close-friends items', () => {
		const state = createTestState();
		const item = createTestItem({ lenderId: 'user2', permissionLevel: 'close-friends' });
		// user3 is a friend but not close friend of user2
		expect(canUserViewItem(item, 'user3', state)).toBe(false);
	});

	it('friend can view friends items', () => {
		const state = createTestState();
		const item = createTestItem({ lenderId: 'user2', permissionLevel: 'friends' });
		expect(canUserViewItem(item, 'user1', state)).toBe(true);
		expect(canUserViewItem(item, 'user3', state)).toBe(true);
	});

	it('non-friend cannot view friends items', () => {
		const state = createTestState();
		const item = createTestItem({ lenderId: 'user1', permissionLevel: 'friends' });
		// user3 is not friends with user1
		expect(canUserViewItem(item, 'user3', state)).toBe(false);
	});

	it('friends-of-friends can view items', () => {
		const state = createTestState();
		const item = createTestItem({ lenderId: 'user1', permissionLevel: 'friends-of-friends' });
		// user3 is friends with user2, who is friends with user1
		expect(canUserViewItem(item, 'user3', state)).toBe(true);
	});

	it('neighbors can view neighbor items if same city', () => {
		const state = createTestState();
		const item = createTestItem({ lenderId: 'user2', permissionLevel: 'neighbors' });
		// user1 and user2 are both in San Francisco
		expect(canUserViewItem(item, 'user1', state)).toBe(true);
	});

	it('non-neighbors cannot view neighbor items', () => {
		const state = createTestState();
		const item = createTestItem({ lenderId: 'user2', permissionLevel: 'neighbors' });
		// user3 is in Oakland
		expect(canUserViewItem(item, 'user3', state)).toBe(false);
	});

	it('specific users can view specific-users items', () => {
		const state = createTestState();
		const item = createTestItem({
			lenderId: 'user2',
			permissionLevel: 'specific-users',
			allowedUserIds: ['user1']
		});
		expect(canUserViewItem(item, 'user1', state)).toBe(true);
	});

	it('non-allowed users cannot view specific-users items', () => {
		const state = createTestState();
		const item = createTestItem({
			lenderId: 'user2',
			permissionLevel: 'specific-users',
			allowedUserIds: ['user1']
		});
		expect(canUserViewItem(item, 'user3', state)).toBe(false);
	});

	it('returns false if lender not found', () => {
		const state = createTestState();
		const item = createTestItem({ lenderId: 'non-existent' });
		expect(canUserViewItem(item, 'user1', state)).toBe(false);
	});
});

describe('appStore actions', () => {
	beforeEach(() => {
		// Reset store to known state before each test
		appStore.set(createTestState());
	});

	describe('setCurrentUser', () => {
		it('changes the current user', () => {
			appStore.setCurrentUser('user2');
			const state = get(appStore);
			expect(state.currentUserId).toBe('user2');
		});
	});

	describe('addItem', () => {
		it('adds a new item to the store', () => {
			const newItem = createTestItem({ id: 'new-item', name: 'New Item' });
			appStore.addItem(newItem);
			const state = get(appStore);
			expect(state.items).toHaveLength(1);
			expect(state.items[0].name).toBe('New Item');
		});
	});

	describe('updateItem', () => {
		it('updates an existing item', () => {
			const item = createTestItem();
			appStore.set(createTestState({ items: [item] }));

			appStore.updateItem('item1', { name: 'Updated Name', condition: 'excellent' });

			const state = get(appStore);
			expect(state.items[0].name).toBe('Updated Name');
			expect(state.items[0].condition).toBe('excellent');
		});

		it('does not affect other items', () => {
			const item1 = createTestItem({ id: 'item1', name: 'Item 1' });
			const item2 = createTestItem({ id: 'item2', name: 'Item 2' });
			appStore.set(createTestState({ items: [item1, item2] }));

			appStore.updateItem('item1', { name: 'Updated' });

			const state = get(appStore);
			expect(state.items[1].name).toBe('Item 2');
		});
	});

	describe('deleteItem', () => {
		it('removes an item from the store', () => {
			const item = createTestItem();
			appStore.set(createTestState({ items: [item] }));

			appStore.deleteItem('item1');

			const state = get(appStore);
			expect(state.items).toHaveLength(0);
		});
	});

	describe('createBorrowRequest', () => {
		it('creates a borrow request and notification', () => {
			const item = createTestItem({ lenderId: 'user2' });
			appStore.set(createTestState({ items: [item] }));

			const request: BorrowRequest = {
				id: 'req1',
				itemId: 'item1',
				borrowerId: 'user1',
				lenderId: 'user2',
				startDate: '2024-01-15',
				endDate: '2024-01-20',
				status: 'pending',
				createdAt: new Date().toISOString()
			};

			appStore.createBorrowRequest(request);

			const state = get(appStore);
			expect(state.borrowRequests).toHaveLength(1);
			expect(state.notifications).toHaveLength(1);
			expect(state.notifications[0].type).toBe('borrow-request');
			expect(state.notifications[0].userId).toBe('user2');
		});
	});

	describe('updateBorrowRequest', () => {
		it('updates request status and creates notification on approval', () => {
			const item = createTestItem({ lenderId: 'user2' });
			const request: BorrowRequest = {
				id: 'req1',
				itemId: 'item1',
				borrowerId: 'user1',
				lenderId: 'user2',
				startDate: '2024-01-15',
				endDate: '2024-01-20',
				status: 'pending',
				createdAt: new Date().toISOString()
			};
			appStore.set(createTestState({ items: [item], borrowRequests: [request] }));

			appStore.updateBorrowRequest('req1', { status: 'approved' });

			const state = get(appStore);
			expect(state.borrowRequests[0].status).toBe('approved');
			expect(state.notifications).toHaveLength(1);
			expect(state.notifications[0].type).toBe('request-approved');
			expect(state.notifications[0].userId).toBe('user1');
		});

		it('creates notification on denial', () => {
			const item = createTestItem({ lenderId: 'user2' });
			const request: BorrowRequest = {
				id: 'req1',
				itemId: 'item1',
				borrowerId: 'user1',
				lenderId: 'user2',
				startDate: '2024-01-15',
				endDate: '2024-01-20',
				status: 'pending',
				createdAt: new Date().toISOString()
			};
			appStore.set(createTestState({ items: [item], borrowRequests: [request] }));

			appStore.updateBorrowRequest('req1', { status: 'declined' });

			const state = get(appStore);
			expect(state.notifications[0].type).toBe('request-declined');
		});
	});

	describe('completeBorrow', () => {
		it('completes borrow and adds to history', () => {
			const item = createTestItem({ lenderId: 'user2', rating: 4.0 });
			const request: BorrowRequest = {
				id: 'req1',
				itemId: 'item1',
				borrowerId: 'user1',
				lenderId: 'user2',
				startDate: '2024-01-15',
				endDate: '2024-01-20',
				status: 'active',
				createdAt: new Date().toISOString()
			};
			appStore.set(createTestState({ items: [item], borrowRequests: [request] }));

			appStore.completeBorrow('req1', 5, 'Great item!');

			const state = get(appStore);
			expect(state.borrowRequests[0].status).toBe('completed');
			expect(state.borrowHistory).toHaveLength(1);
			expect(state.borrowHistory[0].rating).toBe(5);
			expect(state.borrowHistory[0].review).toBe('Great item!');
			expect(state.items[0].available).toBe(true);
		});

		it('updates item rating based on history', () => {
			const item = createTestItem({ lenderId: 'user2', rating: 4.0 });
			const request: BorrowRequest = {
				id: 'req1',
				itemId: 'item1',
				borrowerId: 'user1',
				lenderId: 'user2',
				startDate: '2024-01-15',
				endDate: '2024-01-20',
				status: 'active',
				createdAt: new Date().toISOString()
			};
			appStore.set(createTestState({ items: [item], borrowRequests: [request] }));

			appStore.completeBorrow('req1', 5, 'Perfect!');

			const state = get(appStore);
			// Rating should be updated (single 5-star rating = 5.0)
			expect(state.items[0].rating).toBe(5);
		});
	});

	describe('nudgeRequest', () => {
		it('sends nudge and creates notification', () => {
			const item = createTestItem({ lenderId: 'user2' });
			const request: BorrowRequest = {
				id: 'req1',
				itemId: 'item1',
				borrowerId: 'user1',
				lenderId: 'user2',
				startDate: '2024-01-15',
				endDate: '2024-01-20',
				status: 'pending',
				createdAt: new Date().toISOString()
			};
			appStore.set(createTestState({ items: [item], borrowRequests: [request] }));

			appStore.nudgeRequest('req1');

			const state = get(appStore);
			expect(state.borrowRequests[0].lastNudgedAt).toBeDefined();
			expect(state.notifications).toHaveLength(1);
			expect(state.notifications[0].type).toBe('request-nudge');
		});
	});

	describe('tag actions', () => {
		it('creates a new tag', () => {
			appStore.createTag({
				id: 'tag1',
				name: 'My Tag',
				createdBy: 'user1',
				itemIds: []
			});

			const state = get(appStore);
			expect(state.tags).toHaveLength(1);
			expect(state.tags[0].name).toBe('My Tag');
		});

		it('adds item to tag', () => {
			appStore.set(createTestState({
				tags: [{ id: 'tag1', name: 'Test Tag', createdBy: 'user1', itemIds: [] }]
			}));

			appStore.addItemToTag('tag1', 'item1');

			const state = get(appStore);
			expect(state.tags[0].itemIds).toContain('item1');
		});

		it('removes item from tag', () => {
			appStore.set(createTestState({
				tags: [{ id: 'tag1', name: 'Test Tag', createdBy: 'user1', itemIds: ['item1', 'item2'] }]
			}));

			appStore.removeItemFromTag('tag1', 'item1');

			const state = get(appStore);
			expect(state.tags[0].itemIds).not.toContain('item1');
			expect(state.tags[0].itemIds).toContain('item2');
		});

		it('does not add duplicate items to tag', () => {
			appStore.set(createTestState({
				tags: [{ id: 'tag1', name: 'Test Tag', createdBy: 'user1', itemIds: ['item1'] }]
			}));

			appStore.addItemToTag('tag1', 'item1');

			const state = get(appStore);
			expect(state.tags[0].itemIds).toHaveLength(1);
		});
	});

	describe('friend actions', () => {
		it('sends friend request and creates notification', () => {
			appStore.sendFriendRequest('user1', 'user3', 'Hi, let\'s connect!');

			const state = get(appStore);
			expect(state.friendRequests).toHaveLength(1);
			expect(state.friendRequests[0].status).toBe('pending');
			expect(state.notifications).toHaveLength(1);
			expect(state.notifications[0].userId).toBe('user3');
		});

		it('accepts friend request and adds to friend lists', () => {
			appStore.set(createTestState({
				friendRequests: [{
					id: 'freq1',
					fromUserId: 'user3',
					toUserId: 'user1',
					status: 'pending',
					createdAt: new Date().toISOString()
				}]
			}));

			appStore.acceptFriendRequest('freq1');

			const state = get(appStore);
			expect(state.friendRequests[0].status).toBe('accepted');

			const user1 = state.users.find(u => u.id === 'user1');
			const user3 = state.users.find(u => u.id === 'user3');
			expect(user1?.friendIds).toContain('user3');
			expect(user3?.friendIds).toContain('user1');
		});

		it('declines friend request', () => {
			appStore.set(createTestState({
				friendRequests: [{
					id: 'freq1',
					fromUserId: 'user3',
					toUserId: 'user1',
					status: 'pending',
					createdAt: new Date().toISOString()
				}]
			}));

			appStore.declineFriendRequest('freq1');

			const state = get(appStore);
			expect(state.friendRequests[0].status).toBe('declined');
		});

		it('promotes friend to close friend', () => {
			appStore.promoteToCloseFriend('user1', 'user2');

			const state = get(appStore);
			const user1 = state.users.find(u => u.id === 'user1');
			expect(user1?.closeFriendIds).toContain('user2');
		});

		it('demotes from close friend', () => {
			appStore.demoteFromCloseFriend('user1', 'user2');

			const state = get(appStore);
			const user1 = state.users.find(u => u.id === 'user1');
			expect(user1?.closeFriendIds).not.toContain('user2');
		});
	});

	describe('notification actions', () => {
		it('marks notification as read', () => {
			appStore.set(createTestState({
				notifications: [{
					id: 'notif1',
					userId: 'user1',
					type: 'borrow-request',
					title: 'Test',
					message: 'Test message',
					read: false,
					createdAt: new Date().toISOString()
				}]
			}));

			appStore.markNotificationAsRead('notif1');

			const state = get(appStore);
			expect(state.notifications[0].read).toBe(true);
		});

		it('marks all notifications as read for user', () => {
			appStore.set(createTestState({
				notifications: [
					{ id: 'notif1', userId: 'user1', type: 'borrow-request', title: 'Test 1', message: 'Msg', read: false, createdAt: new Date().toISOString() },
					{ id: 'notif2', userId: 'user1', type: 'borrow-request', title: 'Test 2', message: 'Msg', read: false, createdAt: new Date().toISOString() },
					{ id: 'notif3', userId: 'user2', type: 'borrow-request', title: 'Test 3', message: 'Msg', read: false, createdAt: new Date().toISOString() }
				]
			}));

			appStore.markAllNotificationsAsRead('user1');

			const state = get(appStore);
			expect(state.notifications[0].read).toBe(true);
			expect(state.notifications[1].read).toBe(true);
			expect(state.notifications[2].read).toBe(false); // Different user
		});
	});
});

describe('derived stores', () => {
	beforeEach(() => {
		const item1 = createTestItem({ id: 'item1', lenderId: 'user1' });
		const item2 = createTestItem({ id: 'item2', lenderId: 'user2', permissionLevel: 'friends' });
		const request1: BorrowRequest = {
			id: 'req1',
			itemId: 'item2',
			borrowerId: 'user1',
			lenderId: 'user2',
			startDate: '2024-01-15',
			endDate: '2024-01-20',
			status: 'pending',
			createdAt: new Date().toISOString()
		};
		const request2: BorrowRequest = {
			id: 'req2',
			itemId: 'item1',
			borrowerId: 'user2',
			lenderId: 'user1',
			startDate: '2024-01-15',
			endDate: '2024-01-20',
			status: 'active',
			createdAt: new Date().toISOString()
		};

		appStore.set(createTestState({
			items: [item1, item2],
			borrowRequests: [request1, request2]
		}));
	});

	it('currentUser returns the logged-in user', () => {
		const user = get(currentUser);
		expect(user?.id).toBe('user1');
		expect(user?.name).toBe('Test User 1');
	});

	it('currentUserItems returns items owned by current user', () => {
		const items = get(currentUserItems);
		expect(items).toHaveLength(1);
		expect(items[0].id).toBe('item1');
	});

	it('incomingRequests returns pending requests to current user', () => {
		// user1 has no pending incoming requests in this setup
		// Let's update with a pending request TO user1
		appStore.set(createTestState({
			items: [createTestItem({ id: 'item1', lenderId: 'user1' })],
			borrowRequests: [{
				id: 'req1',
				itemId: 'item1',
				borrowerId: 'user2',
				lenderId: 'user1',
				startDate: '2024-01-15',
				endDate: '2024-01-20',
				status: 'pending',
				createdAt: new Date().toISOString()
			}]
		}));

		const requests = get(incomingRequests);
		expect(requests).toHaveLength(1);
	});

	it('outgoingRequests returns requests from current user', () => {
		const requests = get(outgoingRequests);
		expect(requests).toHaveLength(1);
		expect(requests[0].id).toBe('req1');
	});

	it('activeLoans returns active loans where user is lender', () => {
		const loans = get(activeLoans);
		expect(loans).toHaveLength(1);
		expect(loans[0].id).toBe('req2');
	});

	it('visibleItems filters based on permissions', () => {
		const items = get(visibleItems);
		// user1 can see both items (owns item1, is friends with user2 for item2)
		expect(items).toHaveLength(2);
	});
});

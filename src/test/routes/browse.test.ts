import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import BrowsePage from '../../routes/+page.svelte';
import { appStore } from '$lib/store';
import type { AppState, Item, User } from '$lib/types';

// Mock window.scrollTo
vi.stubGlobal('scrollTo', vi.fn());

// Helper to create test users
function createTestUser(overrides: Partial<User> = {}): User {
	return {
		id: 'user1',
		name: 'Test User',
		email: 'test@example.com',
		profilePic: 'https://example.com/pic.jpg',
		bio: 'Test bio',
		friendIds: ['user2'],
		closeFriendIds: [],
		rating: 4.5,
		totalBorrows: 10,
		totalLends: 15,
		...overrides
	};
}

// Helper to create test items
function createTestItem(overrides: Partial<Item> = {}): Item {
	return {
		id: 'item1',
		name: 'Test Item',
		description: 'A wonderful test item that is perfect for testing purposes and demonstrations.',
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

// Helper to create test state
function createTestState(overrides: Partial<AppState> = {}): AppState {
	return {
		currentUserId: 'user1',
		users: [
			createTestUser({ id: 'user1', name: 'Current User', friendIds: ['user2'] }),
			createTestUser({ id: 'user2', name: 'Lender User', friendIds: ['user1'] })
		],
		items: [
			createTestItem({ id: 'item1', name: 'Camping Tent', lenderId: 'user2' }),
			createTestItem({ id: 'item2', name: 'Mountain Bike', lenderId: 'user2' }),
			createTestItem({ id: 'item3', name: 'Power Drill', lenderId: 'user2' })
		],
		categories: [
			{ id: 'cat1', name: 'Outdoor', icon: '🏕️' },
			{ id: 'cat2', name: 'Tools', icon: '🔧' }
		],
		tags: [
			{ id: 'tag1', name: 'Summer', itemIds: ['item1'], createdBy: 'user1' }
		],
		borrowRequests: [],
		borrowHistory: [],
		friendRequests: [],
		notifications: [],
		wishlist: [],
		...overrides
	};
}

describe('Browse Page', () => {
	beforeEach(() => {
		appStore.set(createTestState());
	});

	it('renders page title and subtitle', () => {
		render(BrowsePage);

		expect(screen.getByRole('heading', { name: 'Browse Items' })).toBeInTheDocument();
		expect(screen.getByText('Discover what your community is sharing')).toBeInTheDocument();
	});

	it('renders search input', () => {
		render(BrowsePage);

		const searchInput = screen.getByPlaceholderText('Search items, categories, or tags...');
		expect(searchInput).toBeInTheDocument();
		expect(searchInput).toHaveAttribute('type', 'text');
	});

	it('renders category filter dropdown', () => {
		render(BrowsePage);

		const categorySelect = screen.getByLabelText('Category:');
		expect(categorySelect).toBeInTheDocument();
		expect(screen.getByText('All Categories')).toBeInTheDocument();
	});

	it('renders sort by dropdown', () => {
		render(BrowsePage);

		const sortSelect = screen.getByLabelText('Sort by:');
		expect(sortSelect).toBeInTheDocument();
		expect(screen.getByRole('option', { name: 'Most Popular' })).toBeInTheDocument();
		expect(screen.getByRole('option', { name: 'Highest Rated' })).toBeInTheDocument();
	});

	it('renders view toggle buttons', () => {
		render(BrowsePage);

		const gridButton = screen.getByRole('button', { name: 'Grid view' });
		const listButton = screen.getByRole('button', { name: 'List view' });

		expect(gridButton).toBeInTheDocument();
		expect(listButton).toBeInTheDocument();
	});

	it('renders available only toggle', () => {
		render(BrowsePage);

		expect(screen.getByText('Show available only')).toBeInTheDocument();
		const checkbox = screen.getByRole('checkbox');
		expect(checkbox).toBeInTheDocument();
	});

	it('displays items from friends', () => {
		render(BrowsePage);

		expect(screen.getByText('Camping Tent')).toBeInTheDocument();
		expect(screen.getByText('Mountain Bike')).toBeInTheDocument();
		expect(screen.getByText('Power Drill')).toBeInTheDocument();
	});

	it('shows correct item count', () => {
		render(BrowsePage);

		expect(screen.getByText('3 items found')).toBeInTheDocument();
	});

	it('does not show items owned by current user', () => {
		const state = createTestState({
			items: [
				createTestItem({ id: 'item1', name: 'My Own Item', lenderId: 'user1' }),
				createTestItem({ id: 'item2', name: 'Friend Item', lenderId: 'user2' })
			]
		});
		appStore.set(state);
		render(BrowsePage);

		expect(screen.queryByText('My Own Item')).not.toBeInTheDocument();
		expect(screen.getByText('Friend Item')).toBeInTheDocument();
		expect(screen.getByText('1 item found')).toBeInTheDocument();
	});
});

describe('Browse Page - Search', () => {
	beforeEach(() => {
		appStore.set(createTestState());
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('filters items by search query after debounce', async () => {
		render(BrowsePage);

		const searchInput = screen.getByPlaceholderText('Search items, categories, or tags...');
		await fireEvent.input(searchInput, { target: { value: 'Tent' } });

		// Fast-forward debounce timer
		vi.advanceTimersByTime(300);
		await waitFor(() => {
			expect(screen.getByText(/matching "Tent"/)).toBeInTheDocument();
		});
	});

	it('shows clear button when search has value', async () => {
		render(BrowsePage);

		const searchInput = screen.getByPlaceholderText('Search items, categories, or tags...');
		await fireEvent.input(searchInput, { target: { value: 'Test' } });

		const clearButton = screen.getByRole('button', { name: 'Clear search' });
		expect(clearButton).toBeInTheDocument();
	});

	it('clears search when clear button is clicked', async () => {
		render(BrowsePage);

		const searchInput = screen.getByPlaceholderText('Search items, categories, or tags...') as HTMLInputElement;
		await fireEvent.input(searchInput, { target: { value: 'Test' } });

		const clearButton = screen.getByRole('button', { name: 'Clear search' });
		await fireEvent.click(clearButton);

		expect(searchInput.value).toBe('');
	});
});

describe('Browse Page - Filters', () => {
	beforeEach(() => {
		appStore.set(createTestState());
	});

	it('filters by availability when toggle is checked', async () => {
		const state = createTestState({
			items: [
				createTestItem({ id: 'item1', name: 'Available Item', available: true, lenderId: 'user2' }),
				createTestItem({ id: 'item2', name: 'Borrowed Item', available: false, lenderId: 'user2' })
			]
		});
		appStore.set(state);
		render(BrowsePage);

		expect(screen.getByText('Available Item')).toBeInTheDocument();
		expect(screen.getByText('Borrowed Item')).toBeInTheDocument();

		const checkbox = screen.getByRole('checkbox');
		await fireEvent.click(checkbox);

		expect(screen.getByText('Available Item')).toBeInTheDocument();
		expect(screen.queryByText('Borrowed Item')).not.toBeInTheDocument();
	});

	it('shows available count in toggle label', () => {
		const state = createTestState({
			items: [
				createTestItem({ id: 'item1', available: true, lenderId: 'user2' }),
				createTestItem({ id: 'item2', available: true, lenderId: 'user2' }),
				createTestItem({ id: 'item3', available: false, lenderId: 'user2' })
			]
		});
		appStore.set(state);
		render(BrowsePage);

		expect(screen.getByText('(2 items)')).toBeInTheDocument();
	});
});

describe('Browse Page - View Modes', () => {
	beforeEach(() => {
		appStore.set(createTestState());
	});

	it('grid view is active by default', () => {
		render(BrowsePage);

		const gridButton = screen.getByRole('button', { name: 'Grid view' });
		expect(gridButton).toHaveAttribute('aria-pressed', 'true');
	});

	it('switches to list view when list button is clicked', async () => {
		render(BrowsePage);

		const listButton = screen.getByRole('button', { name: 'List view' });
		await fireEvent.click(listButton);

		expect(listButton).toHaveAttribute('aria-pressed', 'true');
	});
});

describe('Browse Page - Empty State', () => {
	it('shows empty state when no items match filters', async () => {
		appStore.set(createTestState({ items: [] }));
		render(BrowsePage);

		expect(screen.getByText('No items found')).toBeInTheDocument();
		expect(screen.getByText('Try adjusting your filters or search query')).toBeInTheDocument();
	});
});

describe('Browse Page - Accessibility', () => {
	beforeEach(() => {
		appStore.set(createTestState());
	});

	it('search input has proper aria attributes', () => {
		render(BrowsePage);

		// Use getByPlaceholderText to find the specific search input
		const searchInput = screen.getByPlaceholderText('Search items, categories, or tags...');
		expect(searchInput).toHaveAttribute('aria-autocomplete', 'list');
		expect(searchInput).toHaveAttribute('aria-controls', 'search-suggestions');
		expect(searchInput).toHaveAttribute('role', 'combobox');
	});

	it('has accessible labels for all controls', () => {
		render(BrowsePage);

		expect(screen.getByLabelText('Category:')).toBeInTheDocument();
		expect(screen.getByLabelText('Tag:')).toBeInTheDocument();
		expect(screen.getByLabelText('Sort by:')).toBeInTheDocument();
	});
});

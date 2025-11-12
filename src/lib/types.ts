// Core data types for the distributed library app

export type PermissionLevel = 'specific-users' | 'close-friends' | 'friends' | 'friends-of-friends' | 'neighbors';

export interface User {
  id: string;
  name: string;
  email: string;
  profilePic: string;
  bio: string;
  address?: {
    lat: number;
    lng: number;
    city: string;
  };
  friendIds: string[];
  closeFriendIds: string[];
  rating: number;
  totalBorrows: number;
  totalLends: number;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  icon?: string;
}

export interface Tag {
  id: string;
  name: string;
  createdBy: string;
  itemIds: string[];
}

export interface BorrowRequest {
  id: string;
  itemId: string;
  borrowerId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'denied' | 'active' | 'completed' | 'cancelled';
  message?: string;
  createdAt: string;
}

export interface BorrowHistory {
  id: string;
  itemId: string;
  borrowerId: string;
  ownerId: string;
  startDate: string;
  endDate: string;
  actualReturnDate?: string;
  rating?: number;
  review?: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  ownerId: string;
  imageUrl: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  permissionLevel: PermissionLevel;
  allowedUserIds?: string[]; // for 'specific-users' permission level
  tagIds: string[];
  rating: number;
  totalBorrows: number;
  available: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'borrow-request' | 'request-approved' | 'request-denied' | 'return-reminder' | 'item-returned';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  relatedId?: string; // request id or item id
}

export interface AppState {
  currentUserId: string;
  users: User[];
  items: Item[];
  categories: Category[];
  tags: Tag[];
  borrowRequests: BorrowRequest[];
  borrowHistory: BorrowHistory[];
  notifications: Notification[];
}

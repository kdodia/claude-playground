# Library of Things

A fully interactive prototype for a distributed library of things - a social platform that helps people share underutilized items with friends, friends-of-friends, and neighbors.

## 🌟 Features

### Browse & Discovery
- **Smart Search & Filters**: Search items by name/description, filter by category, tag, or owner
- **Grid & List Views**: Toggle between different viewing modes
- **Permission-Based Visibility**: See items based on your relationship with the owner
- **15+ Pre-populated Items**: Kitchen appliances, tools, camping gear, entertainment, and more

### Item Management
- **Detailed Item Pages**: View full descriptions, photos, condition, and ratings
- **Availability Calendar**: See booking status for the next 90 days at a glance
- **Borrow Request Flow**: Select dates and send messages to owners
- **Item Permissions**: Set who can see and borrow each item (specific users, close friends, friends, friends-of-friends, neighbors)

### Owner Dashboard
- **Incoming Requests**: Approve or deny borrow requests with one click
- **Outgoing Requests**: Track your own borrow requests and their status
- **Active Loans**: Manage items currently borrowed and mark them as returned
- **Real-time Notifications**: Get notified of requests, approvals, and returns

### Tag Collections
- **Custom Tags**: Create collections like "Camping Essentials" or "Party Must-Haves"
- **Easy Organization**: Add or remove items from tags with simple controls
- **Pre-populated Tags**: Several example collections to demonstrate the feature

### User Profiles
- **Reputation System**: View ratings based on borrowing and lending history
- **Activity History**: See past borrows and lends with reviews
- **Available Items**: Browse what each user is currently sharing
- **Relationship Indicators**: See friend and close friend badges

### UX Polish
- **Emerald Green Theme**: Beautiful, cohesive color scheme (#10b981)
- **Smooth Animations**: Fade-in page transitions, hover effects, and micro-interactions
- **Toast Notifications**: Instant feedback for user actions
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **localStorage Persistence**: All data persists across browser sessions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173`

## 📱 How to Use

### As a Borrower
1. **Browse Items**: Use the search bar and filters to find what you need
2. **View Details**: Click on any item to see full details, calendar, and reviews
3. **Request to Borrow**: Select dates and send a request to the owner
4. **Track Requests**: Check your dashboard to see request status

### As an Owner
1. **Manage Items**: View all your items in "My Items"
2. **Handle Requests**: Go to Dashboard to approve/deny incoming requests
3. **Track Loans**: See active loans and mark items as returned
4. **Organize with Tags**: Create collections in the Tags page

### Managing Permissions
Each item has permission levels:
- **Specific Users**: Only people you choose
- **Close Friends**: Your closest circle
- **Friends**: All your friends
- **Friends of Friends**: Extended network
- **Neighbors**: Anyone in your area (same city)

## 🎨 Tech Stack

- **Framework**: SvelteKit with TypeScript
- **Routing**: SvelteKit file-based routing
- **State Management**: Svelte stores with localStorage persistence
- **Styling**: Scoped CSS with CSS custom properties
- **Data**: In-memory mock data with localStorage sync

## 🗂️ Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── ItemCard.svelte       # Reusable item card component
│   │   └── Toast.svelte          # Toast notification component
│   ├── types.ts                  # TypeScript type definitions
│   ├── mockData.ts               # Pre-populated sample data
│   └── store.ts                  # Svelte stores with localStorage
├── routes/
│   ├── +layout.svelte            # Root layout with navigation
│   ├── +page.svelte              # Browse page (home)
│   ├── dashboard/
│   │   └── +page.svelte          # Owner dashboard
│   ├── items/[id]/
│   │   └── +page.svelte          # Item detail page
│   ├── my-items/
│   │   └── +page.svelte          # User's items
│   ├── tags/
│   │   └── +page.svelte          # Tag management
│   ├── profile/[id]/
│   │   └── +page.svelte          # User profiles
│   └── notifications/
│       └── +page.svelte          # Notifications center
└── app.css                       # Global styles and theme
```

## 👥 Sample Users

The app comes with 4 pre-populated users:

1. **Sarah Chen** (Default logged-in user)
   - Owns: Instant Pot, Bread Maker, Food Processor, Karaoke Machine
   - Rating: 4.8 ⭐

2. **Marcus Johnson**
   - Owns: Drill, Ladder, Pressure Washer, Canopy Tent
   - Rating: 4.9 ⭐

3. **Emily Rodriguez**
   - Owns: Projector, Board Games, Criterion Blu-rays, Studio Ghibli Box Set
   - Rating: 4.7 ⭐

4. **Alex Kim**
   - Owns: Camping Tent, Yeti Cooler, Bike Rack
   - Rating: 4.6 ⭐

## 🎯 Key Features Demonstrated

### Complete User Journeys
- **Borrower Flow**: Browse → View Details → Request → Get Notified → Return
- **Lender Flow**: Receive Request → Review → Approve/Deny → Track Return

### Data Relationships
- Hierarchical categories (Kitchen → Small Appliances → Coffee Makers)
- Many-to-many tag relationships
- Friendship networks (friends and close friends)
- Borrowing history with ratings and reviews

### Interactive Calendar
- Visual representation of availability
- Shows booked dates for the next 90 days
- Color-coded availability status

### Permission System
- Granular control over item visibility
- Relationship-based access (friends, close friends, etc.)
- Privacy-first design

## 🔄 Data Persistence

All user actions persist in localStorage:
- Creating and managing items
- Sending and responding to borrow requests
- Creating and organizing tags
- Marking notifications as read
- Completing borrows with ratings

To reset data, open browser console and run:
```javascript
localStorage.removeItem('distributed-library-app-state')
```
Then refresh the page.

## 🎨 Design Highlights

- **Emerald Green Theme**: Primary color #10b981 throughout
- **Warm & Friendly**: Emojis, rounded corners, soft shadows
- **Consistent Spacing**: Uses CSS custom properties for consistency
- **Accessible**: Proper contrast ratios, semantic HTML
- **Responsive**: Mobile-first design with breakpoints

## 🚀 Future Enhancements

Potential features to add:
- User authentication
- Real-time messaging between users
- Map view for nearby items
- Advanced search with filters
- Item condition tracking
- Late return penalties
- Insurance/deposit system
- Social features (comments, favorites)

## 📝 License

This is a prototype/proof-of-concept project.

---

Built with ❤️ using SvelteKit and TypeScript

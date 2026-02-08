# TechNest - Premium Mobile Phone Store

An AI-powered e-commerce platform for mobile phones built with Next.js, Firebase, and OpenAI.

**INF4027W Mini Project 2026**

## Tech Stack

- **Frontend**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (email/password)
- **Storage**: Firebase Storage (product images)
- **AI Search**: OpenAI GPT-4 (text) + GPT-4 Vision (image)
- **State Management**: Zustand
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

## Features

### Guest Features
- Browse 25 mobile phones across Budget, Mid-Range, and Flagship categories
- AI-powered text search (natural language queries)
- AI-powered image search (upload a photo to find similar phones)
- Advanced filtering by brand, category, price, RAM, storage
- Shopping cart persisted in localStorage
- Product quick view with full specs

### Customer Features
- Email/password authentication with password strength indicator
- Checkout with simulated payments (Card, PayPal, Cash on Delivery)
- Order history with status tracking
- Wishlist synced to Firestore
- Profile management with demographics

### Admin Features
- Product CRUD with multi-image upload
- Category management
- Order management with status updates
- Three reporting dashboards:
  - **Financial Report**: Revenue, costs, profit, margin, payment breakdown
  - **Product Report**: Best sellers, most viewed, category performance
  - **Customer Report**: Top buyers, demographics, average order value

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project
- OpenAI API key (optional, for AI search)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd INF4027W_VSKCAL001_MiniPRJ_2026

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
```

### Environment Variables

Edit `.env.local` with your Firebase and OpenAI credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

OPENAI_API_KEY=your_openai_key
```

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** > Email/Password
3. Create a **Firestore** database
4. Enable **Storage**
5. Deploy security rules:
   - Copy `firestore.rules` to Firebase Console > Firestore > Rules
   - Copy `storage.rules` to Firebase Console > Storage > Rules

### Seed Database

```bash
npx tsx src/scripts/seed.ts
```

This adds 25 mobile phones and 3 categories to Firestore.

### Create Admin Account

1. Sign up normally through the app
2. In Firebase Console > Firestore > users collection
3. Find the user document and change `role` from `"customer"` to `"admin"`

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (auth)/login, signup
│   ├── products/, products/[id]
│   ├── cart/, checkout/, search/
│   ├── profile/, orders/, wishlist/
│   ├── admin/dashboard, products, categories, orders, reports
│   └── api/ai-search/text, image, recommendations
├── components/
│   ├── ui/ (shadcn components)
│   ├── layout/ (TopBar, Navbar, NavLinks, Footer, AuthProvider, AuthGuard)
│   └── products/ (ProductCard, ProductGrid, FilterSidebar, QuickViewModal)
├── lib/
│   ├── firebase/ (config, auth, firestore, storage)
│   └── openai/ (client)
├── store/ (cartStore, authStore, wishlistStore)
├── types/ (TypeScript interfaces)
└── scripts/ (seed.ts)
```

## Deployment

### Vercel

1. Push to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

## Test Accounts

- **Admin**: Create via signup, then change role in Firestore
- **Customer**: Sign up through the app

## License

MIT

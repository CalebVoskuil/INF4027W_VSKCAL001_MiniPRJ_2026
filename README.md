# TechNest - Premium Mobile Phone Store



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
- UNIFY student verification at checkout with a QR code, wallet consent, and an automatic 10% discount
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

Edit `.env.local` with your Firebase, OpenAI, and server-only UNIFY credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

OPENAI_API_KEY=your_openai_key

FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@example.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

UNIFY_ADMIN_PORTAL_BASE_URL=https://voskuils.com
UNIFY_VENDOR_API_KEY=unify_vk_replace_me
UNIFY_VENDOR_WEBHOOK_SECRET=replace_with_webhook_secret
```

The Firebase Admin and UNIFY values are server-only. Never prefix them with
`NEXT_PUBLIC_` or expose them from a browser response.

For production, download a Firebase Admin SDK service-account JSON from
**Firebase Console → Project settings → Service accounts → Generate new private key**.
Keep the JSON outside the repository, then configure the linked Vercel project
without printing or copying the private key:

```powershell
.\scripts\configure-firebase-admin-vercel.ps1 `
  -ServiceAccountPath "$env:USERPROFILE\Downloads\your-service-account.json"
```

The script validates the file type and required fields, writes the three
server-only values directly to Vercel Production, and never stores them in the
repository. Redeploy after it succeeds.

### UNIFY Student Discount

TechNest integrates through the Admin Portal's vendor API rather than calling
the Credo Agent directly. At checkout, TechNest creates a short-lived,
checkout-bound verification session and renders its URL as a QR code. The
student scans it with the UNIFY Wallet, reviews the requested values, and
chooses whether to present the credential. The Agent Service makes the trust
decision and the Admin Portal returns only the minimal checkout result.

Completion reaches TechNest through a signed webhook. The checkout also polls
through its own server route so a delayed or missed callback cannot leave the
screen stuck. `APPROVED` applies 10% to the exact cart snapshot; changing a
product, quantity, or displayed unit price requires a new verification.

To configure a vendor integration:

1. Create and approve the TechNest vendor in the UNIFY Admin Portal.
2. Ensure its default branch has an active Agent service point.
3. Create a checkout API key on the vendor Integrations page.
4. Configure `https://<technest-domain>/api/webhooks/unify/verification` as the webhook URL.
5. Save the one-time webhook signing secret and API key in the TechNest server environment.

The current store uses simulated payments and writes orders from the browser.
The verification decision is backend-authoritative, but production-grade
discount enforcement would also move product pricing and order creation to a
trusted server transaction.

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

### Validation

```bash
npm test
npm run lint
npm run build
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/login, signup
│   ├── products/, products/[id]
│   ├── cart/, checkout/, search/
│   ├── profile/, orders/, wishlist/
│   ├── admin/dashboard, products, categories, orders, reports
│   └── api/ai-search, student-discount, webhooks/unify
├── components/
│   ├── ui/ (shadcn components)
│   ├── layout/ (TopBar, Navbar, NavLinks, Footer, AuthProvider, AuthGuard)
│   ├── checkout/ (student verification and discount state)
│   └── products/ (ProductCard, ProductGrid, FilterSidebar, QuickViewModal)
├── lib/
│   ├── firebase/ (config, auth, firestore, storage)
│   ├── studentDiscount/ (UNIFY client, session persistence, validation)
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

# Inventory Management - Next.js Application

A modern Inventory Management system built with Next.js, TypeScript, and Tailwind CSS, designed to integrate with Java REST API backend.

## Features

- **Authentication**: Login/Logout functionality (client-side only, ready for Java REST API integration)
- **Dashboard**: Overview of products, categories, and brands
- **Product Management**: Full CRUD operations for products
- **Category Management**: Manage product categories
- **Sub Category Management**: Organize products with subcategories
- **Brand Management**: Manage product brands
- **Unit Management**: Define measurement units
- **Variant Management**: Handle product variants and attributes

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **API Integration**: Ready for Java REST API

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository or navigate to the project directory:
   ```bash
   cd inventory-management
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your Java REST API URL:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   ```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
inventory-management/
├── app/                      # Next.js app directory
│   ├── dashboard/           # Dashboard and management pages
│   │   ├── products/       # Product management
│   │   ├── categories/     # Category management
│   │   ├── subcategories/  # Sub category management
│   │   ├── brands/         # Brand management
│   │   ├── units/          # Unit management
│   │   └── variants/       # Variant management
│   ├── login/              # Login page
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/              # Reusable components
│   └── Sidebar.tsx         # Navigation sidebar
├── lib/                     # Utility functions
│   ├── api.ts              # API client and endpoints
│   └── auth-context.tsx    # Authentication context
├── types/                   # TypeScript type definitions
│   └── index.ts            # Global types
└── public/                  # Static assets
```

## API Integration

The application is configured to work with a Java REST API. All API calls are centralized in `lib/api.ts`.

### API Endpoints Expected

- **Auth**: `/api/auth/login`, `/api/auth/logout`
- **Products**: `/api/products`
- **Categories**: `/api/categories`
- **Sub Categories**: `/api/subcategories`
- **Brands**: `/api/brands`
- **Units**: `/api/units`
- **Variants**: `/api/variants`

Each endpoint supports standard CRUD operations (GET, POST, PUT, DELETE).

### Authentication

The app uses JWT token-based authentication:
- Tokens are stored in localStorage
- Automatically included in API requests via Authorization header
- Auto-redirect to login on 401 responses

## Current Status

All pages are created with full CRUD UI. The API calls are ready but commented out in the pages. Once your Java REST API is ready:

1. Update `NEXT_PUBLIC_API_URL` in `.env`
2. Uncomment the API calls in each page
3. Ensure your API endpoints match the expected format
4. Update authentication logic in `lib/api.ts` if needed

## Available Pages

- `/` - Home (redirects to login or dashboard)
- `/login` - Login page
- `/dashboard` - Main dashboard
- `/dashboard/products` - Product management
- `/dashboard/categories` - Category management
- `/dashboard/subcategories` - Sub category management
- `/dashboard/brands` - Brand management
- `/dashboard/units` - Unit management
- `/dashboard/variants` - Variant management

## Development Notes

- All data is currently mocked (empty arrays)
- To connect to real backend, uncomment API calls in each page
- Authentication is simulated - replace with actual API calls when backend is ready
- All forms include validation
- Responsive design using Tailwind CSS

## License

ISC

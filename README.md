# Knowhere

Knowhere is an intelligent web content scraper and knowledge management system powered by AI.

It is a modern full-stack web application that allows you to scrape, save, summarize web content using AI. Built with TanStack Start, it provides a seamless experience for managing your personal knowledge base with AI-generated summaries and automatic tagging.

## Installation

### Prerequisites
- Node.js 18+
- pnpm 
- PostgreSQL database
- Firecrawl API Key 
- OpenRouter API Key 

### Setup Steps

1. Clone the repository

```bash
git clone <your-repo-url>
cd ai-scraper
```

2. Install dependencies

```bash
pnpm install
```

3. Set up environment variables

Create a `.env.local` file in the root directory and take the variables from `.env.example`.

```

4. Set up the database

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# (Optional) Seed the database
pnpm db:seed
```

5. Start the development server

```bash
pnpm dev
```

6. Open your browser

Navigate to http://localhost:3000

## Usage

### Getting Started
1. **Sign Up**: Create an account using email and password
2. **Import Content**:
   - Go to "Import" tab
   - Enter a URL to scrape a single page
   - Or use bulk import to discover multiple pages from a website
3. **View Items**: Navigate to "Items" to see all your saved content
4. **Generate Summaries**: Click on any item and use the "Generate" button to create an AI summary
5. **Search & Filter**: Use the search bar and status filters to find specific content

### Key Features Explained

**Single URL Import**
- Paste any web URL
- System scrapes content, extracts metadata, and saves to your library
- Status updates from PENDING → PROCESSING → COMPLETED

**Bulk Import**
- Enter a website URL and optional search filter
- System discovers up to 20 related pages
- Select which pages to import
- Track progress with real-time progress bar

**AI Summaries**
- Click "Generate" on any saved item
- AI streams a structured summary in real-time
- Summary includes: Overview, Key Points, Notable Details, and Limitations
- Auto-generates 3-5 relevant tags based on content

**Avatar System**
- No avatar storage required
- Random avatars are assigned from a pool of 20 names
- Uses DiceBear API for consistent avatar generation
- Each session gets a different random avatar for fun

## Project Structure

```
ai-scraper/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding
├── public/                    # Static assets
├── src/
│   ├── components/
│   │   ├── ai-elements/       # AI-specific components (MessageResponse)
│   │   ├── ui/                # shadcn/ui components
│   │   └── web/               # App-specific components (Sidebar, Navbar)
│   ├── data/                  # Server functions (items, session)
│   ├── hooks/                 # Custom React hooks
│   ├── lib/
│   │   ├── auth.ts            # Better Auth configuration
│   │   ├── auth-client.ts     # Client-side auth
│   │   ├── firecrawl.ts       # Firecrawl client
│   │   ├── open-router.ts     # OpenRouter AI client
│   │   └── utils.ts           # Utility functions
│   ├── middlewares/
│   │   └── auth.ts            # Authentication middleware
│   ├── routes/
│   │   ├── __root.tsx         # Root layout
│   │   ├── index.tsx          # Landing page
│   │   ├── _auth/             # Auth routes (login, signup)
│   │   ├── api/               # API routes
│   │   │   ├── ai/summary.ts  # AI summary endpoint
│   │   │   └── auth/$.ts      # Better Auth handler
│   │   └── dashboard/         # Protected dashboard routes
│   │       ├── items/         # Items list and detail
│   │       ├── import.tsx     # Import page
│   │       └── discover.tsx   # Discover page
│   ├── schemas/               # Zod validation schemas
│   ├── db.ts                  # Prisma client
│   ├── router.tsx             # Router configuration
│   └── start.ts               # App entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Database Schema

The application uses PostgreSQL with the following main models:

**User**
- Authentication and profile information
- Relationships: sessions, accounts, savedItems

**Session**
- User session management
- Token-based authentication

**Account**
- OAuth and credential storage
- Supports multiple auth providers

**savedItem**
- Scraped web content
- Fields: url, title, content, summary, tags, author, status, publishedAt, originalImage
- Status enum: PENDING, PROCESSING, COMPLETED, FAILED

## Available Scripts

```bash
# Development
pnpm dev              # Start dev server on port 3000
pnpm build            # Build for production
pnpm preview          # Preview production build

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database

# Code Quality
pnpm lint             # Run ESLint
pnpm format           # Run Prettier
pnpm check            # Format and lint fix
pnpm test             # Run tests
```

## Key Implementation Details

### AI Streaming
The application uses the Vercel AI SDK's streamText function to stream AI responses in real-time. The useCompletion hook on the client side handles the streaming and displays it progressively using the MessageResponse component with Streamdown for markdown rendering.

Relevant files:
- `src/routes/api/ai/summary.ts` - Server-side streaming endpoint
- `src/routes/dashboard/items/$itemId.tsx` - Client-side streaming consumption
- `src/components/ai-elements/message.tsx` - Streaming UI component

### Web Scraping
Firecrawl handles all web scraping with markdown extraction and metadata parsing. It supports:
- Main content extraction (removes ads, navigation)
- Markdown formatting
- JSON extraction for structured data (author, published date)
- Proxy support for geo-restricted content

Relevant files:
- `src/lib/firecrawl.ts` - Firecrawl client initialization
- `src/data/items.ts` - Scraping server functions

### Authentication Flow
Better Auth provides a modern, type-safe authentication system with:
- Email/password authentication
- Session management with PostgreSQL
- TanStack Start integration via cookies
- Protected route middleware

Relevant files:
- `src/lib/auth.ts` - Server-side auth config
- `src/lib/auth-client.ts` - Client-side auth
- `src/middlewares/auth.ts` - Route protection middleware

### Random Avatar System
Instead of storing user avatars, the app:
1. Maintains a list of 20 random names in `src/components/web/nav-user.tsx`
2. Randomly selects one on each render
3. Uses DiceBear API with the selected name as seed
4. Generates consistent avatars for that session

This approach is just for fun and keeps the database lean.

## Unique Features

- **No Avatar Storage**: Random avatar generation using DiceBear API
- **Streaming AI Responses**: Real-time AI summary generation with visual feedback
- **Bulk Import with Progress**: Import multiple URLs with live progress tracking
- **Auto-Tagging**: AI automatically generates relevant tags from summaries
- **Status Tracking**: Visual indicators for scraping progress (Pending → Processing → Completed)
- **Markdown Content**: All scraped content stored and displayed in markdown format
- **Type-Safe Everything**: Full TypeScript coverage with Prisma, Zod, and TanStack

## Features

### Web Content Scraping
- **Single URL Import**: Scrape and save individual web pages with full content extraction
- **Bulk Import**: Discover and import multiple URLs from a website at once
- **Content Extraction**: Uses Firecrawl to extract clean, markdown-formatted content
- **Metadata Extraction**: Automatically captures title, author, published date, and featured images

### AI-Powered Intelligence
- **AI Summaries**: Generate concise, structured summaries of saved content using OpenRouter
- **Streaming Responses**: AI response streaming on the UI for better user experience
- **Auto-Tagging**: AI automatically generates relevant tags (3-5) based on content summaries
- **Content Analysis**: AI extracts key points, notable details, and limitations from articles

### Content Management
- **Organized Library**: View all saved items in a beautiful grid layout with thumbnails
- **Filtering**: Filter by status (Pending, Processing, Completed, Failed)
- **Search Functionality**: Search by title or tags with real-time filtering
- **Status Tracking**: Monitor scraping progress with visual status indicators

### User Experience
- **Random Avatars**: Fun, randomly assigned avatars for users with no storage needed
- **Dark/Light Mode**: Full theme support with system preference detection
- **Responsive Design**: UI that works on all devices

### Authentication & Security
- **Email/Password Auth**: Secure authentication using Better Auth
- **Session Management**: Persistent sessions with PostgreSQL storage
- **Protected Routes**: Middleware-based route protection
- **User Isolation**: Each user's data is completely isolated

## Tech Stack

### Frontend Framework
- TanStack Start - Full-stack React framework
- TanStack Router - Type-safe file-based routing
- TanStack Form - Powerful form management
- React 19 - Latest React with concurrent features

### Styling & UI
- Tailwind CSS - Utility-first CSS framework
- shadcn/ui - Beautiful, accessible component library
- Radix UI - Accessible UI primitives
- Lucide Icons - Beautiful icon library
- next-themes - Theme management

### Backend & Database
- Prisma - Type-safe ORM with PostgreSQL adapter
- PostgreSQL - Robust relational database
- Better Auth - Modern authentication library

### AI & Web Scraping
- Firecrawl - Web scraping with markdown extraction
- OpenRouter - AI model routing (using GPT-OSS-120B free model)
- Vercel AI SDK - AI streaming and text generation
- Streamdown - Markdown streaming with syntax highlighting


## Contributing

Contributions are welcome! Please have a look at issues and feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

---

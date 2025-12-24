# imglift 🚀

> Free, ultra-clean background removal with a modern, minimal UI.

![imglift Screenshot](./public/og-image.jpg)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-imglift.online-blue?style=for-the-badge)](https://imglift.online)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?style=flat-square&logo=supabase)](https://supabase.com/)

A modern, AI-powered background removal tool that instantly removes backgrounds from images. Built with Next.js, Supabase, and Remove.bg API.

## ✨ Features

- 🎯 **AI-Powered Removal** - Instant background removal using Remove.bg API
- ☁️ **Cloud Storage** - Save processed images to Supabase Storage
- 📱 **Fully Responsive** - Works seamlessly on all devices
- 🔐 **User Authentication** - Secure Google OAuth integration
- 📊 **Usage Tracking** - Free tier with 2 removals per user
- 📜 **Image History** - View and manage your processed images
- 🎨 **Modern UI** - Clean interface built with shadcn/ui and Tailwind CSS

## 🚀 Live Demo

Visit **[imglift.online](https://imglift.online)** to try it out!

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Backend**: [Supabase](https://supabase.com/) (Auth, Storage, Database)
- **Background Removal**: [Remove.bg API](https://www.remove.bg/api)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📦 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- Remove.bg API key ([Get one here](https://www.remove.bg/api))
- Supabase account ([Sign up here](https://supabase.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pratik20gb/imglift.git
   cd imglift
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Remove.bg API
   REMOVEBG_API_KEY=your_removebg_api_key_here
   
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Set up Supabase**
   
   - Create a new Supabase project
   - Create the following tables:
     - `removal_usage` - Tracks user removal limits
     - `site_visits` - Tracks website visits
     - `image_history` - Stores user image history
   - Create a storage bucket named `processed-images`
   - Configure Row Level Security (RLS) policies

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
imglift/
├── app/
│   ├── api/              # API routes
│   │   ├── remove-bg/   # Background removal endpoint
│   │   ├── save-image/  # Image storage endpoint
│   │   ├── history/     # Image history endpoint
│   │   └── ...
│   ├── auth/            # Authentication pages
│   ├── history/         # Image history page
│   └── page.tsx         # Main application page
├── components/           # React components
│   └── ui/              # shadcn/ui components
├── lib/                 # Utility functions
│   ├── supabase.ts      # Client-side Supabase client
│   └── supabase-server.ts # Server-side Supabase client
└── public/              # Static assets
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REMOVEBG_API_KEY` | Remove.bg API key | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |

## 📝 License

This project is private and proprietary.

## 🙏 Acknowledgments

- [Remove.bg](https://www.remove.bg/) for the background removal API
- [Supabase](https://supabase.com/) for backend infrastructure
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components

---

Built with ❤️ by [Pratik Raj](https://github.com/pratik20gb)

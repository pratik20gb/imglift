# imglift 🚀

A modern, AI-powered background removal tool built with Next.js, Supabase, and Remove.bg API.

## Features

- ✨ **AI-Powered Background Removal** - Remove image backgrounds instantly using Remove.bg API
- ☁️ **Cloud Storage** - Save processed images to Supabase Storage
- 🔗 **Shareable Links** - Generate permanent shareable URLs for your processed images
- 📱 **Responsive Design** - Works seamlessly on mobile, tablet, and desktop
- 🎨 **Modern UI** - Beautiful interface built with shadcn/ui components
- ⚡ **Fast & Efficient** - Optimized for performance

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Storage**: Supabase Storage
- **Background Removal**: Remove.bg API
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn
- Remove.bg API key
- Supabase account

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
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key
   ```

4. **Set up Supabase Storage**
   
   Follow the instructions in `STORAGE_SETUP.md` to:
   - Create the `processed-images` bucket
   - Configure bucket policies

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
imglift/
├── app/
│   ├── api/
│   │   ├── remove-bg/      # Background removal API
│   │   └── save-image/     # Supabase Storage upload API
│   ├── page.tsx            # Main application page
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── supabase.ts        # Client-side Supabase client
│   ├── supabase-server.ts # Server-side Supabase client
│   └── utils.ts            # Utility functions
└── public/                 # Static assets
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REMOVEBG_API_KEY` | Remove.bg API key | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable key | Yes |

## Documentation

- `SUPABASE_SETUP.md` - Supabase setup guide
- `STORAGE_SETUP.md` - Storage bucket configuration
- `TROUBLESHOOTING.md` - Common issues and solutions
- `PROJECT_CHECKLIST.md` - Project status checklist

## Features in Development

- [ ] User authentication
- [ ] Image history/gallery
- [ ] Batch processing
- [ ] Multiple format support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and proprietary.

## Support

For issues and questions, please check `TROUBLESHOOTING.md` or open an issue on GitHub.

---

Built with ❤️ using Next.js and Supabase

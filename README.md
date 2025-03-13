# HashVault

A decentralized file storage platform built with Next.js, Lighthouse Protocol, and Privy authentication.

## Features

- 🔐 Secure authentication with Privy
- 📤 Decentralized file storage using WebHash
- 📱 Modern, responsive UI with Tailwind CSS
- 🔄 Real-time upload progress tracking
- 📊 File management dashboard
- 🌙 Dark/Light mode support
- 🛡️ Fallback mechanisms for API failures
- 📱 Responsive design for all devices

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Authentication**: Privy
- **Storage**: WebHash
- **Database**: MongoDB
- **Styling**: Shadcn UI Components

## Prerequisites

- Node.js 18.x or later
- MongoDB Atlas account
- Lighthouse Protocol API key
- Privy API key

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
MONGODB_URI=your_mongodb_uri
LIGHTHOUSE_API_KEY=your_lighthouse_api_key
NEXT_PUBLIC_LIGHTHOUSE_API_KEY=your_lighthouse_api_key
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
```

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/vidyasagarchamle/HashVault.git
   cd HashVault
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your API keys and configuration

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
HashVault/
├── src/
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── providers/       # Context providers
│   │   ├── ui/              # UI components
│   │   └── upload/          # File upload components
│   ├── lib/                 # Utility functions and clients
│   ├── models/              # Database models
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
└── CHANGELOG.md             # Project changelog
```

## API Routes

- `/api/upload` - File upload endpoint
- `/api/retrieve/[cid]` - File retrieval endpoint
- `/api/files` - File management endpoints
- `/api/storage/info` - Storage usage information
- `/api/storage/check` - Storage limit verification
- `/api/storage/purchase` - Storage plan purchase

## Recent Changes

See the [CHANGELOG.md](CHANGELOG.md) file for a detailed list of changes in each version.

### Latest Updates (v0.1.1)
- Fixed theme toggle functionality
- Improved dashboard loading with proper client-side rendering
- Added fallback mechanisms for API failures
- Enhanced error handling throughout the application

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Lighthouse Protocol](https://lighthouse.storage/) for decentralized storage
- [Privy](https://www.privy.io/) for authentication
- [Next.js](https://nextjs.org/) for the framework
- [Tailwind CSS](https://tailwindcss.com/) for styling

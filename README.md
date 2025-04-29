# HashVault

A decentralized file storage platform built with Next.js, WebHash Protocol SDK, and RainbowKit authentication.

## Features

- Direct file storage via WebHash Protocol SDK integration
- Chunked file uploads for handling large files
- Folder uploads with automatic zip handling
- Wallet-based authentication with RainbowKit
- File and folder management with hierarchical navigation
- Storage usage tracking and quota management
- Content addressing with IPFS/CID compatibility

## How It Works

HashVault integrates directly with the WebHash Protocol through their official SDK (`webhash@0.1.3`). This approach:

1. Eliminates the need for API keys
2. Provides more reliable uploads through direct SDK calls
3. Supports advanced features like directory uploads and chunked uploads
4. Maintains wallet-based authentication for user content management

For large files, HashVault uses a chunked upload system that breaks files into smaller pieces, uploads them in parallel, and then combines them on the server side using the SDK.

## Prerequisites

- Node.js 18.x or later
- MongoDB database
- WalletConnect Project ID

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=your_mongodb_uri_here

# Authentication Configuration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here

# Storage Configuration
NEXT_PUBLIC_STORAGE_LIMIT=1000000000 # 1GB in bytes

# Payment Configuration
NEXT_PUBLIC_PAYMENT_ADDRESS=your_payment_wallet_address_here
NEXT_PUBLIC_USDC_CONTRACT=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48

# Optional: Analytics and Monitoring
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id_here

# Optional: Feature Flags
NEXT_PUBLIC_ENABLE_BETA_FEATURES=false
```

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/hashvault.git
cd hashvault
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

HashVault uses a modern architecture:

- **Frontend**: Next.js with App Router for the web application
- **Storage**: WebHash Protocol SDK for direct decentralized storage integration
- **Authentication**: RainbowKit for wallet-based user authentication
- **Metadata**: MongoDB for storing file metadata and user information
- **UI**: Tailwind CSS for responsive, modern design
- **Blockchain**: Wagmi hooks for Ethereum interactions

## Technologies Used

- [Next.js](https://nextjs.org/) for the web application
- [WebHash Protocol SDK](https://webhash.io/) for decentralized storage
- [RainbowKit](https://www.rainbowkit.com/) for authentication and wallet connection
- [MongoDB](https://www.mongodb.com/) for metadata storage
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Wagmi](https://wagmi.sh/) for Ethereum interactions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [WebHash Protocol](https://webhash.io/) for their decentralized storage SDK
- [RainbowKit](https://www.rainbowkit.com/) for authentication and wallet connection
- [Next.js](https://nextjs.org/) for the framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Wagmi](https://wagmi.sh/) for Ethereum interactions

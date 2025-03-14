# HashVault

A decentralized file storage platform built with Next.js, WebHash Protocol, and Privy authentication.

## Features

- Secure file storage using WebHash Protocol
- Wallet-based authentication with Privy
- File upload and management
- Storage usage tracking
- File sharing and access control

## Prerequisites

- Node.js 18.x or later
- MongoDB database
- WebHash Protocol API key
- Privy App ID

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=your_mongodb_uri_here

# WebHash Configuration
NEXT_PUBLIC_WEBHASH_API_KEY=your_webhash_api_key_here

# Authentication Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

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

## Technologies Used

- [Next.js](https://nextjs.org/) for the web application
- [WebHash Protocol](https://webhash.io/) for decentralized storage
- [Privy](https://www.privy.io/) for authentication
- [MongoDB](https://www.mongodb.com/) for metadata storage
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [RainbowKit](https://www.rainbowkit.com/) for wallet connection

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [WebHash Protocol](https://webhash.io/) for decentralized storage
- [Privy](https://www.privy.io/) for authentication
- [Next.js](https://nextjs.org/) for the framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [RainbowKit](https://www.rainbowkit.com/) for wallet integration

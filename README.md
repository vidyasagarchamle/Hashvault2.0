# HashVault - Decentralized Storage Platform

HashVault is a modern, decentralized file storage platform built with Next.js, Privy authentication, and IPFS storage. It provides a secure and user-friendly way to store and manage files in a decentralized manner.

## Features

- 🔐 **Secure Authentication** via Privy
  - Email, Wallet, and Social login support
  - Seamless Web3 integration
  
- 📁 **File Management**
  - Upload files to IPFS
  - View and manage stored files
  - Copy CIDs and download files
  
- 📊 **Storage Dashboard**
  - Monitor storage usage
  - View file history
  - Manage storage quota
  
- 💳 **Payment Integration**
  - Pay-as-you-go storage pricing
  - Support for crypto payments
  - Flexible storage plans

## Tech Stack

- **Frontend**
  - Next.js 14 with App Router
  - TypeScript
  - TailwindCSS
  - ShadCN UI Components
  - Framer Motion
  
- **Authentication**
  - Privy SDK
  
- **Storage**
  - Web3.Storage (IPFS)
  
- **Additional Tools**
  - React Dropzone
  - Lucide Icons
  - Sonner (Toast notifications)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/hashvault.git
   cd hashvault
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
   WEB3STORAGE_EMAIL=your-email@example.com
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication routes
│   └── (dashboard)/       # Protected dashboard routes
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── dashboard/        # Dashboard components
│   ├── shared/           # Shared components
│   └── ui/               # UI components (shadcn)
└── lib/                  # Utilities and services
    ├── hooks/            # Custom React hooks
    ├── providers/        # Context providers
    ├── storage/          # Storage service
    └── utils/            # Helper functions
```

## Development

### Adding New Components

Use the shadcn-ui CLI to add new components:
```bash
npx shadcn-ui@latest add [component-name]
```

### File Storage

The project currently uses Web3.Storage for IPFS integration. The storage service is abstracted to allow easy migration to other providers in the future.

### Authentication

Authentication is handled by Privy, which supports:
- Email login
- Wallet connection
- Social logins (Google, Apple)
- Password-less authentication

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Privy](https://privy.io/) for authentication
- [Web3.Storage](https://web3.storage/) for IPFS storage
- [ShadCN UI](https://ui.shadcn.com/) for UI components
- [Next.js](https://nextjs.org/) for the framework

## Web3Storage Setup

1. Set the environment variable in your `.env.local` file:
```bash
WEB3STORAGE_EMAIL=your-email@example.com
```

2. When you first run the application, it will:
   - Register your email with Web3Storage
   - Send a verification email to your inbox
   - Wait for you to verify your email

3. Check your email for a verification link from Web3Storage
   - Click the verification link
   - Return to the application
   - The storage client will initialize and create a space for your files

4. After verification, the application will:
   - Create a new storage space (if none exists)
   - Set up the necessary permissions
   - Allow you to start uploading files

Note: The email verification is a one-time process. Once verified, your email will remain registered with Web3Storage.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
WEB3STORAGE_EMAIL=your-email@example.com
# Add other environment variables here
```

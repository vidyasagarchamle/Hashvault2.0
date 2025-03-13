import { User as PrivyUser } from '@privy-io/react-auth';

declare module '@privy-io/react-auth' {
  interface User extends PrivyUser {
    embeddedWallet?: {
      address: string;
      walletClientType?: string;
    };
  }
} 
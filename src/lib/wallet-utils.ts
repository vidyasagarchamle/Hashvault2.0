/**
 * Generates a deterministic Ethereum address from a user ID or email
 * This is used as a fallback when no real wallet is available
 * 
 * @param identifier User ID or email to generate address from
 * @returns A deterministic Ethereum address
 */
export function generateDeterministicAddress(identifier: string): string {
  // Simple hash function for browser environments
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to hex string and ensure it's 40 chars long
  let hexHash = Math.abs(hash).toString(16).padStart(40, '0');
  if (hexHash.length > 40) {
    hexHash = hexHash.substring(0, 40);
  }
  
  return '0x' + hexHash;
}

/**
 * Gets a wallet address from a Privy user object
 * Tries multiple sources and falls back to a deterministic address if needed
 * 
 * @param user Privy user object
 * @returns A wallet address or null if none can be determined
 */
export function getWalletAddressFromUser(user: any): string | null {
  if (!user) return null;
  
  // Try to get wallet address from standard locations
  if (user.wallet?.address) {
    console.log('Using connected wallet address');
    return user.wallet.address;
  }
  
  if ((user as any).embeddedWallet?.address) {
    console.log('Using embedded wallet address');
    return (user as any).embeddedWallet.address;
  }
  
  const linkedWalletAccount = user.linkedAccounts?.find((account: any) => account.type === 'wallet');
  if (linkedWalletAccount?.address) {
    console.log('Using linked wallet address');
    return linkedWalletAccount.address;
  }
  
  // Try to find any Ethereum address in the user object
  try {
    const userStr = JSON.stringify(user);
    const addressMatch = userStr.match(/"address":"(0x[a-fA-F0-9]{40})"/);
    if (addressMatch && addressMatch[1]) {
      console.log('Found address in user object:', addressMatch[1]);
      return addressMatch[1];
    }
  } catch (e) {
    console.error('Error searching for address in user object:', e);
  }
  
  // Generate a deterministic address based on user ID or email
  if (user.id) {
    console.log('Generating deterministic address from user ID');
    return generateDeterministicAddress(user.id);
  }
  
  if (user.email?.address) {
    console.log('Generating deterministic address from email');
    return generateDeterministicAddress(user.email.address);
  }
  
  return null;
} 
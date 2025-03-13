import { create } from '@web3-storage/w3up-client';
import { supabase } from './supabase';

let client: any = null;
let space: any = null;

// Function to store the token in Supabase
async function storeToken(userId: string, token: string) {
  const { error } = await supabase
    .from('storage_tokens')
    .upsert({ 
      user_id: userId,
      token: token,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error storing token:', error);
    throw error;
  }
}

// Function to retrieve the token from Supabase
async function getStoredToken(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('storage_tokens')
    .select('token')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error retrieving token:', error);
    return null;
  }

  return data?.token || null;
}

export async function getStorageClient(userId?: string) {
  if (!client && userId) {
    try {
      // Try to get existing token
      const storedToken = await getStoredToken(userId);
      
      // Create a new client
      client = await create();
      
      if (storedToken) {
        // If we have a stored token, try to use it
        try {
          await client.setToken(storedToken);
          const spaces = await client.spaces();
          if (spaces.length > 0) {
            space = spaces[0];
            await client.setCurrentSpace(space.did());
            return client;
          }
        } catch (error) {
          console.log('Stored token invalid, creating new one...');
        }
      }
      
      // If no token or token invalid, create new one
      const email = process.env.WEB3STORAGE_EMAIL;
      if (!email) {
        throw new Error('WEB3STORAGE_EMAIL environment variable not set');
      }

      // Login and create new token
      const account = await client.login(email);
      const newToken = await client.getToken();
      
      // Store the new token
      if (userId) {
        await storeToken(userId, newToken);
      }
      
      // Create and register space if needed
      const spaces = await client.spaces();
      if (spaces.length === 0) {
        space = await client.createSpace('app-storage');
        await space.register(account);
      } else {
        space = spaces[0];
      }
      
      await client.setCurrentSpace(space.did());
      
    } catch (error) {
      console.error('Failed to initialize Web3Storage client:', error);
      throw error;
    }
  }
  return client;
}

export function getSpace() {
  return space;
} 
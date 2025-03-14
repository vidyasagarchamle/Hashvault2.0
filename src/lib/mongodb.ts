import mongoose, { ConnectOptions } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  lastConnectionTime: number;
}

declare global {
  var mongoose: MongooseCache;
}

let cached = global.mongoose || { conn: null, promise: null, lastConnectionTime: 0 };

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, lastConnectionTime: 0 };
}

// Connection options optimized for serverless environments
const connectionOptions: ConnectOptions = {
  bufferCommands: false,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 30000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
  minPoolSize: 5,
  retryWrites: true,
  retryReads: true,
  w: 'majority',
  readPreference: 'primary' as const,
  family: 4, // Force IPv4 (faster DNS resolution)
};

export async function connectToDatabase() {
  // If we have a connection and it's recent (less than 60 seconds old), reuse it
  const now = Date.now();
  if (cached.conn && (now - cached.lastConnectionTime < 60000)) {
    console.log('Using recent MongoDB connection');
    return cached.conn;
  }

  // If we have a connection but it's old, check if it's still connected
  if (cached.conn) {
    const readyState = mongoose.connection.readyState;
    if (readyState === 1) { // 1 = connected
      console.log('Using existing MongoDB connection');
      cached.lastConnectionTime = now;
      return cached.conn;
    } else {
      console.log(`MongoDB connection is in state ${readyState}, creating new connection`);
      cached.conn = null;
      cached.promise = null;
    }
  }

  if (!cached.promise) {
    console.log('Creating new MongoDB connection...');
    
    cached.promise = mongoose.connect(MONGODB_URI!, connectionOptions)
      .then((mongoose) => {
        console.log('MongoDB connected successfully');
        cached.lastConnectionTime = Date.now();
        return mongoose;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        cached.promise = null;
        throw error;
      });
  } else {
    console.log('Using pending MongoDB connection promise');
  }

  try {
    console.log('Waiting for MongoDB connection...');
    cached.conn = await cached.promise;
    console.log('MongoDB connection established');
    cached.lastConnectionTime = Date.now();
  } catch (e: any) {
    console.error('MongoDB connection failed:', e);
    cached.promise = null;
    throw new Error(`Failed to connect to MongoDB: ${e.message}`);
  }

  return cached.conn;
} 
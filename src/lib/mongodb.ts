'use server';

import mongoose from 'mongoose';

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongoose: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let cached: MongooseCache = global.mongoose ?? {
  conn: null,
  promise: null,
};

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  try {
    // If we have an existing connection, return it
    if (cached.conn) {
      console.debug('[MongoDB] Using cached connection');
      return cached.conn;
    }

    // If we're already connecting, wait for that connection
    if (cached.promise) {
      console.debug('[MongoDB] Using existing connection promise');
      const mongooseInstance = await cached.promise;
      return mongooseInstance;
    }

    if (!MONGODB_URI) {
      throw new Error('[MongoDB] MONGODB_URI is not defined in environment variables');
    }

    console.debug('[MongoDB] Creating new connection...');
    const sanitizedUri = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.debug('[MongoDB] Connection URI:', sanitizedUri);

    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4,
      retryWrites: true,
      retryReads: true
    };

    // Create a new connection promise
    cached.promise = mongoose.connect(MONGODB_URI, opts);

    try {
      cached.conn = await cached.promise;
      
      // Set up connection event handlers
      mongoose.connection.on('connected', () => {
        console.debug('[MongoDB] Connected successfully');
      });

      mongoose.connection.on('error', (err) => {
        console.error('[MongoDB] Connection error:', err);
        cached.conn = null;
        cached.promise = null;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('[MongoDB] Disconnected');
        cached.conn = null;
        cached.promise = null;
      });

      console.debug('[MongoDB] Successfully connected to database');
      return cached.conn;
    } catch (error) {
      cached.promise = null;
      console.error('[MongoDB] Connection error:', error);
      throw error;
    }
  } catch (error) {
    console.error('[MongoDB] Error in connectDB:', error);
    throw error;
  }
}

export default connectDB;
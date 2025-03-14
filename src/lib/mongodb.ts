'use server';

import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

const MONGODB_URI = process.env.MONGODB_URI;

interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend the NodeJS global type
declare global {
  // eslint-disable-next-line no-var
  var mongooseGlobal: GlobalMongoose | undefined;
}

// Initialize the cached connection object
const cached: GlobalMongoose = global.mongooseGlobal || {
  conn: null,
  promise: null,
};

// Save the cached object on the global object
if (!global.mongooseGlobal) {
  global.mongooseGlobal = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  try {
    // If we have a connection and it's ready, return it
    if (cached.conn && mongoose.connection.readyState === 1) {
      return cached.conn;
    }

    // If we have a pending connection, wait for it
    if (cached.promise) {
      return await cached.promise;
    }

    // Configure mongoose
    mongoose.set('strictQuery', true);

    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      family: 4,
      serverSelectionTimeoutMS: 5000,
    };

    // Create new connection
    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        // Set up connection error handler
        mongoose.connection.on('error', (error) => {
          console.error('MongoDB connection error:', error);
          cached.conn = null;
          cached.promise = null;
        });

        // Set up disconnection handler
        mongoose.connection.on('disconnected', () => {
          console.warn('MongoDB disconnected, cleaning up connection cache');
          cached.conn = null;
          cached.promise = null;
        });

        // Set up successful connection handler
        mongoose.connection.on('connected', () => {
          console.info('MongoDB connected successfully');
        });

        return mongoose;
      })
      .catch((error) => {
        console.error('Failed to connect to MongoDB:', error);
        cached.promise = null;
        throw error;
      });

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}
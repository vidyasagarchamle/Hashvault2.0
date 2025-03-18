import { connectToDatabase } from '../src/lib/mongodb';
import mongoose from 'mongoose';

async function clearDatabase() {
  try {
    await connectToDatabase();
    
    // Check if we have a database connection
    if (!mongoose.connection.db) {
      throw new Error('No database connection');
    }
    
    // Get all collection names
    const collections = await mongoose.connection.db.collections();
    const collectionNames = collections.map(collection => collection.collectionName);
    
    console.log('Found collections:', collectionNames);
    
    // Drop each collection
    for (const collectionName of collectionNames) {
      await mongoose.connection.db.dropCollection(collectionName);
      console.log(`Dropped collection: ${collectionName}`);
    }
    
    console.log('Database cleared successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase(); 
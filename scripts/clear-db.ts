const mongoose = require('mongoose');
const { connectToDatabase } = require('../src/lib/mongodb');

async function clearDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await connectToDatabase();
    console.log('Connected successfully');

    // Check if we have a database connection
    if (!mongoose.connection.db) {
      throw new Error('No database connection');
    }

    // Get all collections
    const collections = await mongoose.connection.db.collections();

    // Drop each collection
    for (const collection of collections) {
      console.log(`Dropping collection: ${collection.collectionName}`);
      await collection.drop();
    }

    console.log('All collections cleared successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase(); 
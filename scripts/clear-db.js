const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://vidyasagarchamle:Vk8xhHeqtXRRb1x7@hashvault.bpyrv.mongodb.net/hashvault?retryWrites=true&w=majority';

async function clearDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully');

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
import mongoose from 'mongoose';

export const connectMongoDB = async (): Promise<void> => {
  try {
    // Try to use MONGODB_URI first, or construct from individual env vars
    let mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      const host = process.env.MONGODB_HOST || 'localhost';
      const port = process.env.MONGODB_PORT || '27017';
      const db = process.env.MONGODB_DB || 'api_testing_tool';
      mongoUri = `mongodb://${host}:${port}/${db}`;
    }
    
    await mongoose.connect(mongoUri);
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 MongoDB URI: ${mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//*****:*****@')}`); // Hide credentials in log
    
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

export const disconnectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
};

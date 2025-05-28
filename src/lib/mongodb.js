import mongoose from 'mongoose';

function getMongoURI(environment = 'test') {
  if (environment === 'prod') {
    const uri = process.env.MONGODB_URI_PROD;
    if (!uri) {
      throw new Error('Please define the MONGODB_URI_PROD environment variable inside .env');
    }
    return uri;
  }
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
  }
  return uri;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { 
    test: { conn: null, promise: null },
    prod: { conn: null, promise: null }
  };
}

async function connectToDatabase(environment = 'test') {
  if (!['test', 'prod'].includes(environment)) {
    throw new Error('Environment must be either "test" or "prod"');
  }

  if (cached[environment].conn) {
    return cached[environment].conn;
  }

  if (!cached[environment].promise) {
    const mongoURI = getMongoURI(environment);
    const opts = {
      bufferCommands: false,
    };

    cached[environment].promise = mongoose.connect(mongoURI, opts)
      .then((mongoose) => {
        console.log(`MongoDB connected successfully to ${environment.toUpperCase()} database!`);
        return mongoose;
      })
      .catch((err) => {
        console.error(`MongoDB connection error (${environment}):`, err);
        throw err;
      });
  }

  cached[environment].conn = await cached[environment].promise;
  return cached[environment].conn;
}

export default connectToDatabase;
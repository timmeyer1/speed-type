import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

// Déclare une interface typée pour le cache
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
    let mongooseCache: MongooseCache | undefined;
  }

const globalForMongoose = global as typeof globalThis & {
  mongooseCache: MongooseCache;
};

// Initialise le cache si besoin
const cached = globalForMongoose.mongooseCache || {
  conn: null,
  promise: null,
};
globalForMongoose.mongooseCache = cached;

export async function connectToDatabase() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

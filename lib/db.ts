import mongoose from "mongoose";

const envUri = () => process.env.MONGO_URL ?? process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithCache = global as typeof globalThis & {
  _mongo?: MongooseCache;
};

const cached: MongooseCache = globalWithCache._mongo ?? {
  conn: null,
  promise: null,
};
globalWithCache._mongo = cached;

export async function connectDb(): Promise<typeof mongoose | null> {
  const MONGODB_URI = envUri();
  if (!MONGODB_URI) {
    return null;
  }
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI).then((m) => m);
  }
  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error("[db] MongoDB connection failed:", error);
    return null;
  }
  return cached.conn;
}

export const isDbConnected = () => !!cached.conn || !!cached.promise;

export const dbTags = ["products", "orders", "inquiries"];
export const revalidateFallback = 300;
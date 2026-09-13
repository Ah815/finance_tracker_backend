const mongoose = require('mongoose');

/**
 * Serverless platforms (Vercel included) can reuse a "warm" instance across
 * requests, but each cold start re-runs this module. Caching the connection
 * (and the in-flight connection promise) on `global` means:
 *   - warm invocations reuse the existing connection instantly
 *   - concurrent requests during a cold start share one connection attempt
 *     instead of racing to open several
 * This is the standard pattern for Mongoose + serverless. It's harmless for
 * the local long-running server too — it just connects once, as before.
 */
let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env and configure it.');
  }

  if (!cached.promise) {
    mongoose.set('strictQuery', true);
    cached.promise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 8000 })
      .then((m) => {
        console.log(`MongoDB connected: ${m.connection.host}/${m.connection.name}`);
        return m;
      })
      .catch((err) => {
        cached.promise = null; // allow retry on the next request instead of caching a failure forever
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;

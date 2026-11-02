import mongoose from "mongoose";

/**
 * Opens the application's MongoDB connection.
 *
 * The URI is supplied by the environment so credentials and deployment-specific
 * connection details stay outside the source code.
 */
export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  // Fail startup immediately when the required database configuration is missing.
  if (!uri) {
    throw new Error("MONGODB_URI is required");
  }

  // Limit how long startup waits when MongoDB cannot be reached.
  const result = await mongoose.connect(uri, {
    autoIndex: false,
    serverSelectionTimeoutMS: 5000,
  });

  // Log successful connection details for startup diagnostics.
  console.log(
    "MongoDB connected.\n\n",
    result.connection.host + ":" + result.connection.port,
  );
}

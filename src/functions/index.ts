import { MongoClient } from "mongodb";
import { type FormData } from "../types";

// Extended form data that includes admin key for API requests
interface FormDataWithAdminKey extends FormData {
  adminKey: string;
}

// Appwrite function context types
interface AppwriteRequest {
  method: string;
  path?: string;
  url?: string;
  headers: Record<string, string>;
  body: unknown;
}

interface AppwriteResponse {
  setHeader: (key: string, value: string) => void;
  send: (data: string, statusCode?: number) => void;
  json: (
    data: Record<string, unknown> | unknown[],
    statusCode?: number
  ) => void;
}

interface AppwriteContext {
  req: AppwriteRequest;
  res: AppwriteResponse;
  log: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

// Database error type
interface DatabaseError extends Error {
  message: string;
}

// Type guard to check if an error is a DatabaseError
function isDatabaseError(error: unknown): error is DatabaseError {
  return error instanceof Error;
}

// Type guard to check if request body is FormData with admin key
function isFormDataWithAdminKey(body: unknown): body is FormDataWithAdminKey {
  return typeof body === "object" && body !== null && "adminKey" in body;
}

// Appwrite function entry point
export default async ({ req, res, log, error }: AppwriteContext) => {
  try {
    // Set CORS headers for web requests
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Key");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return res.send("", 200);
    }

    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB_NAME;
    const collectionName = process.env.MONGODB_COLLECTION;

    // Route handling
    const path = req.path || req.url || "/";
    const method = req.method;

    log(`Request: ${method} ${path}`);

    // Health check
    if (path === "/health" || path === "/") {
      return res.json(
        {
          status: "OK",
          message: "Appwrite function is running",
          timestamp: new Date().toISOString(),
        },
        200
      );
    }

    // Submit form data
    if (path === "/api/submit" && method === "POST") {
      try {
        // Validate request body
        if (!isFormDataWithAdminKey(req.body)) {
          return res.json({ error: "Invalid form data" }, 400);
        }

        const formData = req.body;

        // Validate admin key
        if (!formData.adminKey || formData.adminKey !== process.env.ADMIN_KEY) {
          return res.json({ error: "Invalid admin key" }, 401);
        }

        // Remove admin key from data before saving
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { adminKey, ...dataToSave } = formData;

        // Connect to MongoDB
        const client = new MongoClient(uri as string, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 5000,
        });

        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName as string);

        // Insert data
        const result = await collection.insertOne({
          ...dataToSave,
          createdAt: new Date(),
          submittedAt: new Date().toISOString(),
        });

        await client.close();

        log(`Data saved successfully with ID: ${result.insertedId}`);
        return res.json(
          {
            success: true,
            id: result.insertedId.toString(),
            message: "Form submitted successfully",
          },
          200
        );
      } catch (dbError: unknown) {
        const errorMessage = isDatabaseError(dbError)
          ? dbError.message
          : "Unknown database error";
        error("Database error:", errorMessage);
        return res.json(
          {
            error: "Failed to save data",
            details:
              process.env.NODE_ENV === "development" ? errorMessage : undefined,
          },
          500
        );
      }
    }

    // Get data (admin only)
    if (path === "/api/data" && method === "GET") {
      try {
        const adminKey =
          req.headers["x-admin-key"] || req.headers["X-Admin-Key"];

        if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
          return res.json({ error: "Invalid admin key" }, 401);
        }

        // Connect to MongoDB
        const client = new MongoClient(uri as string, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 5000,
        });

        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(collectionName as string);

        // Get all documents
        const documents = await collection.find({}).toArray();
        await client.close();

        log(`Retrieved ${documents.length} documents`);
        return res.json(documents, 200);
      } catch (dbError: unknown) {
        const errorMessage = isDatabaseError(dbError)
          ? dbError.message
          : "Unknown database error";
        error("Database error:", errorMessage);
        return res.json(
          {
            error: "Failed to fetch data",
            details:
              process.env.NODE_ENV === "development" ? errorMessage : undefined,
          },
          500
        );
      }
    }

    // Default 404
    return res.json(
      {
        error: "Not found",
        path: path,
        method: method,
      },
      404
    );
  } catch (err: unknown) {
    const errorMessage = isDatabaseError(err) ? err.message : "Unknown error";
    error("Function execution failed:", errorMessage);
    return res.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      500
    );
  }
};

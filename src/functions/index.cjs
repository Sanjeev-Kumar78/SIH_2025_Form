const { MongoClient } = require("mongodb");

// Type guard to check if an error is a database error
function isDatabaseError(error) {
    return error instanceof Error;
}

// Type guard to check if request body has required fields
function isValidFormData(body) {
    return (
        typeof body === "object" &&
        body !== null &&
        "adminKey" in body &&
        "name" in body &&
        "email" in body
    );
}

// Appwrite function entry point
module.exports = async function (context) {
    const { req, res, log, error } = context;

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
        if (path === "/submit" && method === "POST") {
            try {
                // Validate request body
                if (!isValidFormData(req.body)) {
                    return res.json({ error: "Invalid form data" }, 400);
                }

                const formData = req.body;

                // Validate admin key
                if (!formData.adminKey || formData.adminKey !== process.env.ADMIN_KEY) {
                    return res.json({ error: "Invalid admin key" }, 401);
                }

                // Remove admin key from data before saving
                const { adminKey, ...dataToSave } = formData;

                // Connect to MongoDB
                const client = new MongoClient(uri, {
                    serverSelectionTimeoutMS: 5000,
                    socketTimeoutMS: 5000,
                    tls: true,
                    tlsAllowInvalidCertificates: false,
                    tlsAllowInvalidHostnames: false,
                });

                await client.connect();
                const db = client.db(dbName);
                const collection = db.collection(collectionName);

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
            } catch (dbError) {
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
        if (path === "/data" && method === "GET") {
            try {
                const adminKey =
                    req.headers["x-admin-key"] || req.headers["X-Admin-Key"];

                if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
                    return res.json({ error: "Invalid admin key" }, 401);
                }

                // Connect to MongoDB
                const client = new MongoClient(uri, {
                    serverSelectionTimeoutMS: 5000,
                    socketTimeoutMS: 5000,
                    tls: true,
                    tlsAllowInvalidCertificates: false,
                    tlsAllowInvalidHostnames: false,
                });

                await client.connect();
                const db = client.db(dbName);
                const collection = db.collection(collectionName);

                // Get all documents
                const documents = await collection.find({}).toArray();
                await client.close();

                log(`Retrieved ${documents.length} documents`);
                return res.json(documents, 200);
            } catch (dbError) {
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
    } catch (err) {
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

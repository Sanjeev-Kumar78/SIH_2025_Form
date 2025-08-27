const { MongoClient } = require("mongodb");
const crypto = require("crypto");

// Helper function to verify reCAPTCHA token
async function verifyCaptcha(token) {
    try {
        if (!token) {
            return { success: false, error: "CAPTCHA token is required" };
        }

        const secretKey = process.env.GOOGLE_CAPTCHA_SECRET_KEY;
        if (!secretKey) {
            return { success: false, error: "reCAPTCHA not configured on server" };
        }

        const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
        const response = await fetch(verifyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `secret=${secretKey}&response=${token}`
        });

        const data = await response.json();

        if (!data.success) {
            return {
                success: false,
                error: "CAPTCHA verification failed",
                details: data['error-codes'] || []
            };
        }

        // Optional: Check score for reCAPTCHA v3 (0.0 = bot, 1.0 = human)
        if (data.score !== undefined && data.score < 0.5) {
            return {
                success: false,
                error: "CAPTCHA score too low, please try again"
            };
        }

        return { success: true, score: data.score };
    } catch (error) {
        return {
            success: false,
            error: "CAPTCHA verification error",
            details: error.message
        };
    }
}

// Helper function to send JSON response with CORS headers
function sendJsonResponse(res, data, statusCode = 200) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    return res.json(data, statusCode, {
        "Access-Control-Allow-Origin": frontendUrl,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
        "Access-Control-Allow-Credentials": "true"
    });
}

// Type guard to check if an error is a database error
function isDatabaseError(error) {
    return error instanceof Error;
}

// Comprehensive FormData validation matching the TypeScript interface
function isValidFormData(body) {
    if (typeof body !== "object" || body === null) {
        return { valid: false, error: "Request body must be an object" };
    }

    // Check for reCAPTCHA token
    if (!body.captchaToken || typeof body.captchaToken !== "string") {
        return { valid: false, error: "CAPTCHA token is required" };
    }

    // Check required fields (adminKey is now passed via URL, not body)
    if (!body.name || typeof body.name !== "string") {
        return { valid: false, error: "Name is required and must be a string" };
    }

    if (!body.roll_number || typeof body.roll_number !== "number") {
        return { valid: false, error: "Roll number is required and must be a number" };
    }

    if (!body.gender || (body.gender !== "M" && body.gender !== "F")) {
        return { valid: false, error: "Gender is required and must be 'M' or 'F'" };
    }

    if (!body.email || typeof body.email !== "string") {
        return { valid: false, error: "Email is required and must be a string" };
    }

    if (!body.about || typeof body.about !== "string") {
        return { valid: false, error: "About is required and must be a string" };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
        return { valid: false, error: "Invalid email format" };
    }

    // Validate optional fields (if present, they must be strings)
    const optionalStringFields = ['github_link', 'linkedin_link', 'instagram_link', 'team_name', 'referrer_name', 'referrer_email'];
    for (const field of optionalStringFields) {
        if (body[field] !== undefined && typeof body[field] !== "string") {
            return { valid: false, error: `${field} must be a string if provided` };
        }
    }

    // Validate referrer_email format if provided
    if (body.referrer_email && !emailRegex.test(body.referrer_email)) {
        return { valid: false, error: "Invalid referrer email format" };
    }

    return { valid: true };
}

// Timing-safe admin key comparison
function validateAdminKey(providedKey, actualKey) {
    if (!providedKey || !actualKey) {
        return false;
    }

    try {
        const providedBuf = Buffer.from(providedKey);
        const actualBuf = Buffer.from(actualKey);

        if (providedBuf.length !== actualBuf.length) {
            return false;
        }

        return crypto.timingSafeEqual(providedBuf, actualBuf);
    } catch (error) {
        return false;
    }
}

// Appwrite function entry point
module.exports = async function (context) {
    const { req, res, log, error } = context;

    try {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

        // Handle preflight requests
        if (req.method === "OPTIONS") {
            return res.send("", 200, {
                "Access-Control-Allow-Origin": frontendUrl,
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
                "Access-Control-Allow-Credentials": "true"
            });
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
            return sendJsonResponse(res, {
                status: "OK",
                message: "Appwrite function is running",
                timestamp: new Date().toISOString(),
            });
        }

        // Submit form data
        if (path === "/submit" && method === "POST") {
            try {
                // Log the incoming request for debugging (since Appwrite doesn't capture body data)
                log("Received form submission request");
                log("Request body keys:", Object.keys(req.body || {}));

                // Validate request body structure and data
                const validation = isValidFormData(req.body);
                if (!validation.valid) {
                    log("Validation failed:", validation.error);
                    return sendJsonResponse(res, { error: validation.error }, 400);
                }

                const formData = req.body;

                // Verify reCAPTCHA token
                log("Verifying CAPTCHA token...");
                const captchaResult = await verifyCaptcha(formData.captchaToken);
                if (!captchaResult.success) {
                    log("CAPTCHA verification failed:", captchaResult.error);
                    return sendJsonResponse(res, {
                        error: captchaResult.error,
                        details: captchaResult.details
                    }, 400);
                }

                log("CAPTCHA verification successful", captchaResult.score ? `(score: ${captchaResult.score})` : "");

                // Remove captcha token from data before saving and logging
                const { captchaToken, ...dataToSave } = formData;

                // Log form data for debugging (excluding captcha token)
                log("Form data received:", JSON.stringify(dataToSave, null, 2));

                // Connect to MongoDB
                const client = new MongoClient(uri, {
                    serverSelectionTimeoutMS: 5000,
                    socketTimeoutMS: 5000,
                    tls: true,
                    tlsAllowInvalidCertificates: false,
                    tlsAllowInvalidHostnames: false,
                });

                await client.connect();
                log("Connected to MongoDB successfully");

                const db = client.db(dbName);
                const collection = db.collection(collectionName);

                // Check for existing data with same roll_number and email (duplicate prevention)
                const existingData = await collection.findOne({
                    $or: [
                        { roll_number: dataToSave.roll_number },
                        { email: dataToSave.email }
                    ]
                });

                if (existingData) {
                    await client.close();
                    const duplicateField = existingData.roll_number === dataToSave.roll_number ? "roll number" : "email";
                    const errorMsg = `Registration with this ${duplicateField} already exists`;
                    log("Duplicate entry attempted:", errorMsg);
                    return sendJsonResponse(res, { error: errorMsg }, 409);
                }

                // Insert data with timestamps
                const result = await collection.insertOne({
                    ...dataToSave,
                    createdAt: new Date(),
                    submittedAt: new Date().toISOString(),
                });

                await client.close();

                log(`Data saved successfully with ID: ${result.insertedId}`);
                log("Registration completed for:", dataToSave.name, "Roll:", dataToSave.roll_number);

                return sendJsonResponse(res, {
                    success: true,
                    id: result.insertedId.toString(),
                    message: "Form submitted successfully",
                });
            } catch (dbError) {
                const errorMessage = isDatabaseError(dbError)
                    ? dbError.message
                    : "Unknown database error";
                error("Database error during submission:", errorMessage);
                return sendJsonResponse(res, {
                    error: "Failed to save data",
                    details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
                }, 500);
            }
        }

        // Export data as CSV (admin only)
        if (path === "/csv" && method === "GET") {
            try {
                const adminKey =
                    req.headers["x-admin-key"] || req.headers["X-Admin-Key"] || req.query.key;

                if (!validateAdminKey(adminKey, process.env.ADMIN_KEY)) {
                    log("Invalid admin key provided for CSV export");
                    return sendJsonResponse(res, { error: "Invalid admin key" }, 401);
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
                log("Connected to MongoDB for CSV export");

                const db = client.db(dbName);
                const collection = db.collection(collectionName);

                // Get all documents
                const documents = await collection.find({}).toArray();
                await client.close();

                // Convert to CSV
                if (documents.length === 0) {
                    log("No data found for CSV export");
                    return res.send("", 200, {
                        "Content-Type": "text/csv",
                        "Content-Disposition": "attachment; filename=registrations.csv"
                    });
                }

                const headers = Object.keys(documents[0]);
                const csvRows = [
                    headers.join(","),
                    ...documents.map((row) =>
                        headers
                            .map((field) => {
                                const value = row[field];
                                if (typeof value === "string") {
                                    const escaped = value.replace(/"/g, '""');
                                    return `"${escaped}"`;
                                }
                                return value;
                            })
                            .join(",")
                    ),
                ];
                const csv = csvRows.join("\n");

                log(`CSV export completed with ${documents.length} records`);
                return res.send(csv, 200, {
                    "Content-Type": "text/csv",
                    "Content-Disposition": "attachment; filename=registrations.csv"
                });
            } catch (dbError) {
                const errorMessage = isDatabaseError(dbError)
                    ? dbError.message
                    : "Unknown database error";
                error("Database error during CSV export:", errorMessage);
                return sendJsonResponse(res, {
                    error: "Failed to export CSV",
                    details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
                }, 500);
            }
        }

        // Default 404
        return sendJsonResponse(res, {
            error: "Not found",
            path: path,
            method: method,
        }, 404);
    } catch (err) {
        const errorMessage = isDatabaseError(err) ? err.message : "Unknown error";
        error("Function execution failed:", errorMessage);
        return sendJsonResponse(res, {
            error: "Internal server error",
            details:
                process.env.NODE_ENV === "development" ? errorMessage : undefined,
        }, 500);
    }
};

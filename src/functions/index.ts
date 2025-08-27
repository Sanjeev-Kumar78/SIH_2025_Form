import {
  connectDB,
  closeDB,
  insertData,
  collection_to_csv,
} from "../services/data_handler";
import { type FormData } from "../types";

// Appwrite function handler
export default async ({
  req,
  res,
  log,
  error,
}: {
  req: {
    method: string;
    path: string;
    headers: Record<string, string>;
    body: FormData;
  };
  res: {
    json: (
      data: Record<string, unknown>,
      status?: number,
      headers?: Record<string, string>
    ) => void;
    text: (
      data: string,
      status?: number,
      headers?: Record<string, string>
    ) => void;
  };
  log: (message: string) => void;
  error: (message: string) => void;
}) => {
  const { method, path, body } = req;

  // Set CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": process.env.FRONTEND_URL || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle preflight requests
  if (method === "OPTIONS") {
    return res.json({}, 200, corsHeaders);
  }

  try {
    // Health check endpoint
    if (method === "GET" && path === "/health") {
      await connectDB();
      return res.json(
        { message: "Server is running! DB Connected" },
        200,
        corsHeaders
      );
    }

    // Submit form data endpoint
    if (method === "POST" && path === "/submit") {
      const formData: FormData = body;

      if (!formData.name || !formData.email) {
        return res.json(
          { success: false, message: "Name and email are required" },
          400,
          corsHeaders
        );
      }

      try {
        await insertData(formData);
        log("Form submitted successfully");
        return res.json(
          { success: true, message: "Form submitted successfully" },
          200,
          corsHeaders
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        error("Failed to submit form: " + errorMessage);
        return res.json(
          { success: false, message: errorMessage },
          500,
          corsHeaders
        );
      }
    }

    // CSV export endpoint
    if (method === "GET" && path === "/csv") {
      try {
        const csvData = await collection_to_csv();
        return res.text(csvData, 200, {
          ...corsHeaders,
          "Content-Type": "text/csv",
          "Content-Disposition": 'attachment; filename="form_data.csv"',
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        error("Failed to export CSV: " + errorMessage);
        return res.json(
          { success: false, message: "Failed to export CSV" },
          500,
          corsHeaders
        );
      }
    }

    // Close database connection endpoint
    if (method === "GET" && path === "/close") {
      await closeDB();
      return res.json(
        { message: "Server is shutting down! DB Connection Closed" },
        200,
        corsHeaders
      );
    }

    // Default 404 response
    return res.json(
      { success: false, message: "Endpoint not found" },
      404,
      corsHeaders
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    error("Server error: " + errorMessage);
    return res.json(
      { success: false, message: "Internal server error" },
      500,
      corsHeaders
    );
  }
};

import {
  connectDB,
  closeDB,
  insertData,
  collection_to_csv,
} from "../services/data_handler";

import express from "express";
import type { Express, Request, Response } from "express";
import cors from "cors";
import * as crypto from "crypto";

const app: Express = express();
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const PORT = process.env.PORT || 3000;
app.use(
  cors({
    origin: [FRONTEND_URL],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

app.get("/health", async (_: Request, response: Response) => {
  await connectDB();
  response.send("Server is running! DB Connected");
});

// Helper function to verify reCAPTCHA token
async function verifyCaptcha(
  token: string
): Promise<{ success: boolean; error?: string; score?: number }> {
  try {
    if (!token) {
      return { success: false, error: "CAPTCHA token is required" };
    }

    const secretKey = process.env.GOOGLE_CAPTCHA_SECRET_KEY;
    if (!secretKey) {
      return { success: false, error: "reCAPTCHA not configured on server" };
    }

    const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
    const response = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();

    if (!data.success) {
      return {
        success: false,
        error: "CAPTCHA verification failed",
      };
    }

    // Check score for reCAPTCHA v3 (0.0 = bot, 1.0 = human)
    if (data.score !== undefined && data.score < 0.5) {
      return {
        success: false,
        error: "CAPTCHA score too low, please try again",
      };
    }

    return { success: true, score: data.score };
  } catch (error: unknown) {
    return {
      success: false,
      error: `CAPTCHA verification error: ${error}`,
    };
  }
}

app.post("/submit", async (req: Request, response: Response) => {
  try {
    const { captchaToken, ...formData } = req.body;

    // Verify reCAPTCHA token
    const captchaResult = await verifyCaptcha(captchaToken);
    if (!captchaResult.success) {
      return response.status(400).json({
        success: false,
        message: captchaResult.error || "CAPTCHA verification failed",
      });
    }

    await insertData(formData);
    response.send("Data submitted successfully!");
  } catch (error: unknown) {
    console.error("Error submitting data:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to submit data";
    response.status(500).json({
      success: false,
      message: `${errorMessage}`,
    });
  }
});
app.get("/to_csv", async (req: Request, response: Response) => {
  const adminKey = process.env.ADMIN_KEY;
  const rawKey = req.query.key;
  const providedKey = Array.isArray(rawKey)
    ? rawKey[0]
    : typeof rawKey === "string"
    ? rawKey
    : undefined;

  if (!adminKey || !providedKey) {
    return response.status(403).send("Forbidden: Admin key required");
  }

  // Use constant-time comparison to mitigate timing attacks
  const adminBuf = Buffer.from(adminKey);
  const providedBuf = Buffer.from(providedKey as string);

  const keysMatch =
    adminBuf.length === providedBuf.length &&
    crypto.timingSafeEqual(adminBuf, providedBuf);

  if (!keysMatch) {
    return response.status(403).send("Forbidden: Invalid admin key");
  }

  try {
    const csv = await collection_to_csv();
    response.header("Content-Type", "text/csv");
    response.attachment("data.csv");
    response.send(csv);
  } catch (err: unknown) {
    console.error("Error exporting CSV:", err);
    response
      .status(500)
      .json({ success: false, message: "Failed to export CSV" });
  }
});

app.get("/close", async (_: Request, response: Response) => {
  await closeDB();
  response.send("Server is shutting down! DB Connection Closed");
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

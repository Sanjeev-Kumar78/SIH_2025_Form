import {
  MongoClient,
  Db,
  Collection,
  type WithId,
  type Document,
} from "mongodb";
import { type FormData } from "../types";
import * as dotenv from "dotenv";
dotenv.config();

const uri: string = process.env.MONGODB_URI as string;
const dbName: string = process.env.MONGODB_DB_NAME as string;
let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectDB(): Promise<Db> {
  try {
    if (!client) {
      client = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
        heartbeatFrequencyMS: 30000,
        tls: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false,
        retryWrites: true,
        w: "majority",
      });

      console.log("Connecting to MongoDB Atlas...");
      await client.connect();

      // Test the connection
      await client.db("admin").command({ ping: 1 });

      db = client.db(dbName);
      console.log("✅ Connected to MongoDB Atlas successfully");
    }
    return db!; // Non-null assertion since we know it's assigned above
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);

    // Reset client on connection failure
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error("Error closing failed connection:", closeError);
      }
      client = null;
      db = null;
    }

    throw new Error(
      `MongoDB connection failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function schemaValidation(data: FormData): Promise<boolean> {
  console.log(data);
  try {
    if (
      !data.name ||
      typeof data.name !== "string" ||
      !data.roll_number ||
      typeof data.roll_number !== "number" ||
      !data.gender ||
      (data.gender !== "M" && data.gender !== "F") ||
      !data.email ||
      typeof data.email !== "string" ||
      !data.about ||
      typeof data.about !== "string"
    ) {
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error during schema validation:", error);
    return false;
  }
}

export async function getCollection(): Promise<Collection> {
  try {
    const db = await connectDB();
    return db.collection(process.env.MONGODB_COLLECTION || "Registrations");
  } catch (error) {
    console.error("Error getting collection:", error);
    throw error;
  }
}

export async function getData(): Promise<WithId<Document>[]> {
  try {
    const collection = await getCollection();
    return await collection.find({}).toArray();
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

export async function collection_to_csv(): Promise<string> {
  try {
    const data = await getData();
    // Use mongodb-export style: include headers, handle commas/quotes
    if (data.length === 0) return "";
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((field) => {
            const value = row[field];
            if (typeof value === "string") {
              // Escape quotes and wrap in quotes if needed
              const escaped = value.replace(/"/g, '""');
              return `"${escaped}"`;
            }
            return value;
          })
          .join(",")
      ),
    ];
    const csv = csvRows.join("\n");
    return csv;
  } catch (error) {
    console.error("Error converting collection to CSV:", error);
    throw error;
  }
}

export async function insertData(data: FormData): Promise<void> {
  try {
    const collection = await getCollection();
    if (!(await schemaValidation(data))) {
      throw new Error("Invalid data format");
    }
    const existingData = await collection.findOne({
      roll_number: data.roll_number,
      email: data.email,
    });
    if (existingData) {
      throw new Error("Data with this roll number & email already exists");
    }
    await collection.insertOne(data);
    console.log("Data inserted successfully");
  } catch (error) {
    console.error("Inserting Error:", error);
    throw error;
  }
}

export async function closeDB(): Promise<void> {
  try {
    if (client) {
      await client.close();
      client = null;
      db = null;
      console.log("✅ MongoDB connection closed successfully");
    }
  } catch (error) {
    console.error("❌ Error closing MongoDB connection:", error);
    throw error;
  }
}

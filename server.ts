import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

let adminApp: admin.app.App | null = null;

/**
 * Lazy initialization of Firebase Admin SDK.
 * This prevents the server from crashing if the service account is not provided.
 */
function getFirebaseAdmin(): admin.app.App {
  if (!adminApp) {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccountVar) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is required for admin features. Please provide the service account JSON string.");
    }

    try {
      // Allow serviceAccountVar to be either a JSON string or a path to a file
      let serviceAccount;
      if (serviceAccountVar.startsWith('{')) {
        serviceAccount = JSON.parse(serviceAccountVar);
      } else {
        // Fallback to treat as path (user's provided path if they uploaded it)
        serviceAccount = serviceAccountVar;
      }

      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log("Firebase Admin initialized successfully.");
    } catch (error) {
      console.error("Failed to initialize Firebase Admin:", error);
      throw error;
    }
  }
  return adminApp;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check/Status route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", adminInitialized: !!adminApp });
  });

  // Nutrition API proxy to Gemini
  app.post("/api/nutrition", async (req, res) => {
    const { foodName } = req.body;
    if (!foodName) {
      return res.status(400).json({ error: "foodName is required" });
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Estimate the nutritional content for "${foodName}" per standard serving.`;
      
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fats: { type: Type.NUMBER },
              servingSize: { type: Type.STRING }
            },
            required: ["calories", "protein", "carbs", "fats"]
          }
        }
      });

      const text = result.response.text();
      res.json(JSON.parse(text));
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Failed to get nutrition data" });
    }
  });

  // Example Admin Route (protected or just for demo)
  app.get("/api/admin/test", async (req, res) => {
    try {
      const adminSrv = getFirebaseAdmin();
      // Example: List first 10 users (just to prove it works)
      const listUsersResult = await adminSrv.auth().listUsers(10);
      res.json({ users: listUsersResult.users.length, success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

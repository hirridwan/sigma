import { Hono } from "hono";
import { GoogleGenAI } from "@google/genai";

interface Env {
  GEMINI_API_KEY: string;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => {
  return c.json({
    success: true,
    message: "SIGMA API is running",
  });
});

app.post("/api/test-gemini", async (c) => {
  try {
    const ai = new GoogleGenAI({
      apiKey: c.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Jawab singkat: SIGMA API berhasil terhubung ke Gemini.",
    });

    return c.json({
      success: true,
      data: response.text,
    });
  } catch (error) {
    console.error(error);

    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan pada server.";

    return c.json(
      {
        success: false,
        message,
      },
      500
    );
  }
});

export default app;
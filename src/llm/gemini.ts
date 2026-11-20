
import { GoogleGenAI } from "@google/genai";
import type { ChatMessage } from "./adapter.js";

export class GeminiAdapter {
  readonly provider = "Google Gemini";
  readonly model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  private client: GoogleGenAI | null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    this.client = apiKey
      ? new GoogleGenAI({ apiKey })
      : null;
  }

  async enviar(messages: ChatMessage[]): Promise<string> {
    if (!this.client) {
      throw new Error("Falta GEMINI_API_KEY en el servidor");
    }

    const systemInstruction = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n");

    const conversation = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

    if (conversation.length === 0) {
      throw new Error("No hay mensajes para procesar");
    }

    const response = await this.client.models.generateContent({
      model: this.model,
      contents: conversation,
      config: {
        systemInstruction,
        temperature: 0.2
      }
    });

    if (!response.text) {
      throw new Error("Gemini no devolvió una respuesta");
    }

    return response.text;
  }
}

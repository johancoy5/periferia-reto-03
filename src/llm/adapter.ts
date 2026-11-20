export type ChatMessage={role:"system"|"user"|"assistant";content:string};export interface LlmAdapter{provider:string;model:string;enviar(mensajes:ChatMessage[]):Promise<string>}

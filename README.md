# Reto 03 · Agente de órdenes de compra

## Instalación y ejecución
`npm install` y `npm run dev`. Abre `http://localhost:3000`.

## Demo determinista
`npm run demo` (sin clave de IA). Limpia `out/` y ejecuta seis casos, idempotencia y confirmaciones.

## IA
Copia `.env.example` a `.env`, agrega `OPENAI_API_KEY` y define `OPENAI_MODEL` para respuestas del modelo. Nunca publiques `.env`. Sin clave el backend sigue procesando determinísticamente los casos, pero no ofrece respuestas generadas por LLM.

## API
`GET /api/health`; `POST /api/chat` con `{sessionId,message}`; `GET /api/sessions/:id`. Ejemplos: `procesa sol-001`, `procesa sol-004`, luego `confirmo`.

## Despliegue
Servicio Node.js con `npm install` y `npm run dev`, variable `PORT` asignada por el hosting y `OPENAI_API_KEY` como secreto. El directorio `out/` requiere escritura; en hosting efímero se pierde al reiniciar. Enlace público: pendiente de configurar.

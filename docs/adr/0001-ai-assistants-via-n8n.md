# AI assistants implemented as n8n webhooks

The app has two distinct AI assistants — the Sommelier (free-form wine questions on `/sommelier`) and the Asistente de cata (wine analysis scoped to a specific cata). Rather than calling the OpenAI API directly from the client, both are implemented as separate n8n workflows exposed via webhook. This keeps LLM logic, prompt engineering, and model choice out of the frontend and centralises them in n8n, where they can be iterated on without shipping a new app build.

## Considered Options

- **Direct OpenAI calls from the client** — already partially implemented (`src/lib/openai.ts`), but leaks the API key to the browser and couples prompt changes to frontend deploys.
- **Single shared n8n workflow with a context parameter** — simpler to operate, but forces both assistants to share the same prompt and model configuration.
- **Two separate n8n workflows** — chosen; each assistant has its own prompt, model, and memory strategy independently.

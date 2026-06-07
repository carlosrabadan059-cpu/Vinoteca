import OpenAI from 'openai'
import type { ChatMessage, Wine } from '../types'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY as string,
  dangerouslyAllowBrowser: true,
  timeout: 30_000,
})

export async function askOpenAI(
  messages: ChatMessage[],
  systemPrompt: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    })
    return response.choices[0]?.message?.content ?? ''
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI error ${error.status}: ${error.message}`)
    }
    throw error
  }
}

const LABEL_PROMPT =
  'Analiza esta etiqueta de vino y extrae en JSON:\n' +
  '{ nombre, bodega, anada, region, denominacion, uva }.\n' +
  'Si no encuentras algún campo devuelve null.\n' +
  'Solo devuelve el JSON sin texto adicional ni backticks.'

function stripPrefix(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/[^;]+;base64,/, '')
}

export async function analyzeWineLabel(
  frontImageDataUrl: string,
  backImageDataUrl?: string
): Promise<Partial<Wine>> {
  const images: OpenAI.Chat.Completions.ChatCompletionContentPartImage[] = [
    {
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${stripPrefix(frontImageDataUrl)}`,
        detail: 'high',
      },
    },
  ]

  if (backImageDataUrl) {
    images.push({
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${stripPrefix(backImageDataUrl)}`,
        detail: 'high',
      },
    })
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: LABEL_PROMPT },
            ...images,
          ],
        },
      ],
      max_tokens: 300,
    })

    const text = response.choices[0]?.message?.content ?? ''
    return JSON.parse(text) as Partial<Wine>
  } catch {
    return {}
  }
}

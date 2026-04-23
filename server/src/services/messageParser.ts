import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ParsedMessage {
  type: 'grocery' | 'reminder' | 'message'
  // grocery
  item?: string
  quantity?: string
  // reminder
  eventTitle?: string
  dateText?: string
  personSlug?: string
}

const SYSTEM_PROMPT = `You are a family dashboard assistant. Classify incoming messages into one of three types and extract structured data. "Mom" is equal to "Krysten". "Dad" is equal to "Jon".

Types:
- "grocery": user wants to add something to the grocery list (e.g. "add milk", "we need eggs", "pick up oat milk")
- "reminder": user wants to create a calendar event or reminder (e.g. "remind Harry about soccer Friday at 4pm", "add dentist appointment next Tuesday")
- "message": general family communication that doesn't fit the above

Respond only with valid JSON matching the tool schema. Be generous in inferring grocery and reminder intents.`

export async function parseMessage(body: string, senderSlug: string): Promise<ParsedMessage> {
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: [
        {
          name: 'classify_message',
          description: 'Classify and extract structured data from a family message',
          input_schema: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['grocery', 'reminder', 'message'],
                description: 'Message classification',
              },
              item: {
                type: 'string',
                description: 'Grocery item name (grocery type only)',
              },
              quantity: {
                type: 'string',
                description: 'Optional quantity like "2 lbs" or "a gallon of" (grocery type only)',
              },
              eventTitle: {
                type: 'string',
                description: 'Event title for the calendar (reminder type only)',
              },
              dateText: {
                type: 'string',
                description: 'Natural language date/time like "next Friday at 4pm" (reminder type only)',
              },
              personSlug: {
                type: 'string',
                description: 'Person the reminder is for. If the message says "me", "I", or "my" without naming someone else, use the sender slug provided in the message context. Valid values: harry/ruby/krysten/jon/mylo',
              },
            },
            required: ['type'],
          },
        },
      ],
      tool_choice: { type: 'auto' },
      messages: [{ role: 'user', content: `[Sender: ${senderSlug}]\n${body}` }],
    })

    const toolUse = response.content.find(b => b.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      return { type: 'message' }
    }

    const input = toolUse.input as ParsedMessage
    return {
      type: input.type ?? 'message',
      item: input.item,
      quantity: input.quantity,
      eventTitle: input.eventTitle,
      dateText: input.dateText,
      personSlug: input.personSlug ?? senderSlug,
    }
  } catch (err) {
    console.error('[messageParser] Error:', err)
    return { type: 'message' }
  }
}

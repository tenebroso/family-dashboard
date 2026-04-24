import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface ParsedMessage {
  type: 'grocery' | 'reminder' | 'chore'
  // grocery
  item?: string
  quantity?: string
  // reminder
  eventTitle?: string
  dateText?: string
  personSlug?: string
  // chore
  choreTitle?: string
  choreDateText?: string
}

const SYSTEM_PROMPT = `You are a family dashboard assistant. Classify incoming messages into one of four types and extract structured data. "Mom" is equal to "Krysten". "Dad" is equal to "Jon".

Types:
- "grocery": user wants to add something to the grocery list (e.g. "add milk", "we need eggs", "pick up oat milk")
- "reminder": user wants to create a calendar event or reminder (e.g. "remind Harry about soccer Friday at 4pm", "add dentist appointment next Tuesday")
- "chore": user wants to add a chore to someone's chore list (e.g. "add clean the shower to my chore list", "add a chore for Ruby to do her reading tomorrow", "add a chore every day to stretch")

Respond only with valid JSON matching the tool schema. Be generous in inferring grocery, reminder, and chore intents.`

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
                enum: ['grocery', 'reminder', 'chore'],
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
                description: 'Person the reminder or chore is for. If the message says "me", "I", or "my" without naming someone else, use the sender slug provided in the message context. Valid values: harry/ruby/krysten/jon/mylo',
              },
              choreTitle: {
                type: 'string',
                description: 'The chore name/task (chore type only), e.g. "clean the shower", "stretch", "reading"',
              },
              choreDateText: {
                type: 'string',
                description: 'When the chore applies (chore type only). Use "today" for same-day one-time chores, "tomorrow" for next-day, a specific date like "2024-03-15", or a recurrence like "every day", "every monday", "weekdays". Leave null if unclear (defaults to today).',
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
      return { type: 'chore' }
    }

    const input = toolUse.input as ParsedMessage
    return {
      type: input.type ?? 'chore',
      item: input.item,
      quantity: input.quantity,
      eventTitle: input.eventTitle,
      dateText: input.dateText,
      personSlug: input.personSlug ?? senderSlug,
      choreTitle: input.choreTitle,
      choreDateText: input.choreDateText,
    }
  } catch (err) {
    console.error('[messageParser] Error:', err)
    return { type: 'chore' }
  }
}

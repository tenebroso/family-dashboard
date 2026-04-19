import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface WordEntry {
  word: string
  fallbackDefinition: string
  fallbackPartOfSpeech: string
}

const WORD_LIST: WordEntry[] = [
  { word: 'ephemeral', fallbackDefinition: 'Lasting for a very short time.', fallbackPartOfSpeech: 'adjective' },
  { word: 'luminous', fallbackDefinition: 'Full of or shedding light; bright or shining.', fallbackPartOfSpeech: 'adjective' },
  { word: 'serene', fallbackDefinition: 'Calm, peaceful, and untroubled.', fallbackPartOfSpeech: 'adjective' },
  { word: 'resilient', fallbackDefinition: 'Able to recover quickly from difficulties.', fallbackPartOfSpeech: 'adjective' },
  { word: 'curious', fallbackDefinition: 'Eager to know or learn something.', fallbackPartOfSpeech: 'adjective' },
  { word: 'magnificent', fallbackDefinition: 'Impressively beautiful, elaborate, or extravagant.', fallbackPartOfSpeech: 'adjective' },
  { word: 'tenacious', fallbackDefinition: 'Holding firmly to something; not giving up easily.', fallbackPartOfSpeech: 'adjective' },
  { word: 'vibrant', fallbackDefinition: 'Full of energy and enthusiasm.', fallbackPartOfSpeech: 'adjective' },
  { word: 'persevere', fallbackDefinition: 'Continue steadfastly despite difficulty.', fallbackPartOfSpeech: 'verb' },
  { word: 'empathy', fallbackDefinition: 'The ability to understand and share the feelings of another.', fallbackPartOfSpeech: 'noun' },
  { word: 'adventure', fallbackDefinition: 'An unusual and exciting experience or activity.', fallbackPartOfSpeech: 'noun' },
  { word: 'harmony', fallbackDefinition: 'A pleasing arrangement of parts; agreement.', fallbackPartOfSpeech: 'noun' },
  { word: 'eloquent', fallbackDefinition: 'Fluent or persuasive in speaking or writing.', fallbackPartOfSpeech: 'adjective' },
  { word: 'flourish', fallbackDefinition: 'Grow or develop in a healthy or vigorous way.', fallbackPartOfSpeech: 'verb' },
  { word: 'jubilant', fallbackDefinition: 'Feeling or expressing great happiness.', fallbackPartOfSpeech: 'adjective' },
  { word: 'tranquil', fallbackDefinition: 'Free from disturbance; calm and peaceful.', fallbackPartOfSpeech: 'adjective' },
  { word: 'audacious', fallbackDefinition: 'Showing a willingness to take bold risks.', fallbackPartOfSpeech: 'adjective' },
  { word: 'benevolent', fallbackDefinition: 'Well meaning and kindly toward others.', fallbackPartOfSpeech: 'adjective' },
  { word: 'candid', fallbackDefinition: 'Truthful and straightforward; frank.', fallbackPartOfSpeech: 'adjective' },
  { word: 'diligent', fallbackDefinition: 'Having or showing care and effort in one\'s work.', fallbackPartOfSpeech: 'adjective' },
  { word: 'exquisite', fallbackDefinition: 'Extremely beautiful and delicate.', fallbackPartOfSpeech: 'adjective' },
  { word: 'fortitude', fallbackDefinition: 'Courage in pain or adversity.', fallbackPartOfSpeech: 'noun' },
  { word: 'gracious', fallbackDefinition: 'Courteous, kind, and pleasant.', fallbackPartOfSpeech: 'adjective' },
  { word: 'halcyon', fallbackDefinition: 'Denoting a period of time that was happily peaceful.', fallbackPartOfSpeech: 'adjective' },
  { word: 'inspire', fallbackDefinition: 'Fill someone with the urge or ability to do something.', fallbackPartOfSpeech: 'verb' },
  { word: 'jovial', fallbackDefinition: 'Cheerful and friendly.', fallbackPartOfSpeech: 'adjective' },
  { word: 'kinetic', fallbackDefinition: 'Relating to or resulting from motion.', fallbackPartOfSpeech: 'adjective' },
  { word: 'lively', fallbackDefinition: 'Full of life and energy; active and outgoing.', fallbackPartOfSpeech: 'adjective' },
  { word: 'marvel', fallbackDefinition: 'A wonderful or astonishing person or thing.', fallbackPartOfSpeech: 'noun' },
  { word: 'noble', fallbackDefinition: 'Having or showing fine personal qualities.', fallbackPartOfSpeech: 'adjective' },
  { word: 'optimistic', fallbackDefinition: 'Hopeful and confident about the future.', fallbackPartOfSpeech: 'adjective' },
  { word: 'passionate', fallbackDefinition: 'Having or showing strong feelings or beliefs.', fallbackPartOfSpeech: 'adjective' },
  { word: 'quintessential', fallbackDefinition: 'Representing the most perfect example of something.', fallbackPartOfSpeech: 'adjective' },
  { word: 'radiant', fallbackDefinition: 'Sending out light; shining or glowing brightly.', fallbackPartOfSpeech: 'adjective' },
  { word: 'steadfast', fallbackDefinition: 'Resolutely firm and unwavering.', fallbackPartOfSpeech: 'adjective' },
  { word: 'tranquility', fallbackDefinition: 'The quality or state of being calm and peaceful.', fallbackPartOfSpeech: 'noun' },
  { word: 'unique', fallbackDefinition: 'Being the only one of its kind; unlike anything else.', fallbackPartOfSpeech: 'adjective' },
  { word: 'valiant', fallbackDefinition: 'Possessing or showing courage or determination.', fallbackPartOfSpeech: 'adjective' },
  { word: 'whimsical', fallbackDefinition: 'Playfully quaint or fanciful, especially in an appealing way.', fallbackPartOfSpeech: 'adjective' },
  { word: 'xenial', fallbackDefinition: 'Of or relating to hospitality toward guests.', fallbackPartOfSpeech: 'adjective' },
  { word: 'yearn', fallbackDefinition: 'Have an intense feeling of longing for something.', fallbackPartOfSpeech: 'verb' },
  { word: 'zeal', fallbackDefinition: 'Great energy or enthusiasm in pursuit of a cause.', fallbackPartOfSpeech: 'noun' },
  { word: 'abundant', fallbackDefinition: 'Existing or available in large quantities; plentiful.', fallbackPartOfSpeech: 'adjective' },
  { word: 'bliss', fallbackDefinition: 'Perfect happiness; great joy.', fallbackPartOfSpeech: 'noun' },
  { word: 'cherish', fallbackDefinition: 'Protect and care for lovingly.', fallbackPartOfSpeech: 'verb' },
  { word: 'dazzle', fallbackDefinition: 'Amaze or overwhelm with an impressive display.', fallbackPartOfSpeech: 'verb' },
  { word: 'earnest', fallbackDefinition: 'Resulting from or showing sincere and intense conviction.', fallbackPartOfSpeech: 'adjective' },
  { word: 'fearless', fallbackDefinition: 'Lacking fear; not afraid of anything.', fallbackPartOfSpeech: 'adjective' },
  { word: 'genuine', fallbackDefinition: 'Truly what something is said to be; authentic.', fallbackPartOfSpeech: 'adjective' },
  { word: 'humble', fallbackDefinition: 'Having a modest opinion of one\'s own importance.', fallbackPartOfSpeech: 'adjective' },
  { word: 'imaginative', fallbackDefinition: 'Having or showing creativity or inventiveness.', fallbackPartOfSpeech: 'adjective' },
  { word: 'joyful', fallbackDefinition: 'Feeling, expressing, or causing great pleasure and happiness.', fallbackPartOfSpeech: 'adjective' },
  { word: 'kind', fallbackDefinition: 'Having a friendly, generous, and considerate nature.', fallbackPartOfSpeech: 'adjective' },
  { word: 'loyal', fallbackDefinition: 'Giving or showing firm and constant support.', fallbackPartOfSpeech: 'adjective' },
  { word: 'mindful', fallbackDefinition: 'Conscious or aware of something; being present.', fallbackPartOfSpeech: 'adjective' },
  { word: 'nurture', fallbackDefinition: 'Care for and encourage the growth or development of.', fallbackPartOfSpeech: 'verb' },
  { word: 'original', fallbackDefinition: 'Present or existing from the beginning; first or earliest.', fallbackPartOfSpeech: 'adjective' },
  { word: 'patient', fallbackDefinition: 'Able to accept delay or difficulty without becoming annoyed.', fallbackPartOfSpeech: 'adjective' },
  { word: 'quench', fallbackDefinition: 'Satisfy a desire or put an end to a fire.', fallbackPartOfSpeech: 'verb' },
  { word: 'remarkable', fallbackDefinition: 'Worthy of attention; striking or extraordinary.', fallbackPartOfSpeech: 'adjective' },
  { word: 'sincere', fallbackDefinition: 'Free from pretense; genuinely felt.', fallbackPartOfSpeech: 'adjective' },
  { word: 'thoughtful', fallbackDefinition: 'Showing careful consideration or attention.', fallbackPartOfSpeech: 'adjective' },
  { word: 'uplifting', fallbackDefinition: 'Making one feel more positive or optimistic.', fallbackPartOfSpeech: 'adjective' },
  { word: 'versatile', fallbackDefinition: 'Able to adapt or be adapted to many different functions.', fallbackPartOfSpeech: 'adjective' },
  { word: 'wonder', fallbackDefinition: 'A feeling of amazement and admiration caused by something beautiful.', fallbackPartOfSpeech: 'noun' },
  { word: 'exuberant', fallbackDefinition: 'Filled with or characterized by a lively energy and excitement.', fallbackPartOfSpeech: 'adjective' },
  { word: 'youthful', fallbackDefinition: 'Remaining young or seeming young; having the freshness of youth.', fallbackPartOfSpeech: 'adjective' },
  { word: 'zenith', fallbackDefinition: 'The time at which something is most powerful or successful.', fallbackPartOfSpeech: 'noun' },
  { word: 'altruistic', fallbackDefinition: 'Showing a selfless concern for the well-being of others.', fallbackPartOfSpeech: 'adjective' },
  { word: 'bountiful', fallbackDefinition: 'Large in quantity; generous in giving.', fallbackPartOfSpeech: 'adjective' },
  { word: 'courageous', fallbackDefinition: 'Not deterred by danger or pain; brave.', fallbackPartOfSpeech: 'adjective' },
  { word: 'daring', fallbackDefinition: 'Adventurous or audaciously bold.', fallbackPartOfSpeech: 'adjective' },
  { word: 'enchanting', fallbackDefinition: 'Delightfully charming or attractive.', fallbackPartOfSpeech: 'adjective' },
  { word: 'fidelity', fallbackDefinition: 'Faithfulness to a person, cause, or belief.', fallbackPartOfSpeech: 'noun' },
  { word: 'grateful', fallbackDefinition: 'Feeling or showing thankfulness.', fallbackPartOfSpeech: 'adjective' },
  { word: 'hearty', fallbackDefinition: 'Loudly vigorous and cheerful; strong and healthy.', fallbackPartOfSpeech: 'adjective' },
  { word: 'integrity', fallbackDefinition: 'The quality of being honest and having strong moral principles.', fallbackPartOfSpeech: 'noun' },
  { word: 'judicious', fallbackDefinition: 'Having or showing good judgment.', fallbackPartOfSpeech: 'adjective' },
  { word: 'knack', fallbackDefinition: 'An acquired or natural skill at doing something.', fallbackPartOfSpeech: 'noun' },
  { word: 'lavish', fallbackDefinition: 'Sumptuously rich, elaborate, or luxurious.', fallbackPartOfSpeech: 'adjective' },
  { word: 'mellow', fallbackDefinition: 'Pleasantly smooth or soft; free from harshness.', fallbackPartOfSpeech: 'adjective' },
  { word: 'nimble', fallbackDefinition: 'Quick and light in movement or action.', fallbackPartOfSpeech: 'adjective' },
  { word: 'opulent', fallbackDefinition: 'Ostentatiously rich and luxurious.', fallbackPartOfSpeech: 'adjective' },
  { word: 'plucky', fallbackDefinition: 'Having or showing determined courage in difficult situations.', fallbackPartOfSpeech: 'adjective' },
  { word: 'quirky', fallbackDefinition: 'Having peculiar or unexpected traits; unusual in an appealing way.', fallbackPartOfSpeech: 'adjective' },
  { word: 'robust', fallbackDefinition: 'Strong and healthy; vigorous.', fallbackPartOfSpeech: 'adjective' },
  { word: 'sprightly', fallbackDefinition: 'Lively, energetic, and full of spirit.', fallbackPartOfSpeech: 'adjective' },
  { word: 'tactful', fallbackDefinition: 'Having or showing skill and sensitivity in dealing with others.', fallbackPartOfSpeech: 'adjective' },
  { word: 'unwavering', fallbackDefinition: 'Not wavering; steady or resolute.', fallbackPartOfSpeech: 'adjective' },
  { word: 'vivid', fallbackDefinition: 'Producing powerful feelings or strong, clear images in the mind.', fallbackPartOfSpeech: 'adjective' },
  { word: 'whiz', fallbackDefinition: 'A person who is outstandingly talented at something.', fallbackPartOfSpeech: 'noun' },
  { word: 'exemplary', fallbackDefinition: 'Serving as a desirable model; representing the best of its kind.', fallbackPartOfSpeech: 'adjective' },
  { word: 'fanciful', fallbackDefinition: 'Overimaginative and unrealistic; appealing to the fancy.', fallbackPartOfSpeech: 'adjective' },
  { word: 'gallant', fallbackDefinition: 'Brave; heroic; chivalrously attentive and respectful.', fallbackPartOfSpeech: 'adjective' },
  { word: 'heirloom', fallbackDefinition: 'A valuable object passed down through generations of a family.', fallbackPartOfSpeech: 'noun' },
  { word: 'ingenuity', fallbackDefinition: 'The quality of being clever, original, and inventive.', fallbackPartOfSpeech: 'noun' },
  { word: 'jaunty', fallbackDefinition: 'Having a lively, cheerful, and self-confident manner.', fallbackPartOfSpeech: 'adjective' },
  { word: 'kaleidoscope', fallbackDefinition: 'A constantly changing pattern or sequence of elements.', fallbackPartOfSpeech: 'noun' },
  { word: 'luster', fallbackDefinition: 'A gentle sheen or soft glow; radiance.', fallbackPartOfSpeech: 'noun' },
  { word: 'meticulous', fallbackDefinition: 'Showing great attention to detail or correct behavior.', fallbackPartOfSpeech: 'adjective' },
]

interface DictionaryResponse {
  meanings?: Array<{
    partOfSpeech: string
    definitions: Array<{ definition: string }>
  }>
}

async function fetchDefinition(word: string): Promise<{ definition: string; partOfSpeech: string } | null> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
    if (!res.ok) return null
    const data = await res.json() as DictionaryResponse[]
    const meaning = data[0]?.meanings?.[0]
    if (!meaning) return null
    return {
      partOfSpeech: meaning.partOfSpeech,
      definition: meaning.definitions[0]?.definition ?? '',
    }
  } catch {
    return null
  }
}

function dateKeyHash(dateKey: string): number {
  let hash = 0
  for (const ch of dateKey) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  }
  return hash
}

export async function getWordOfDay(): Promise<{ word: string; definition: string; partOfSpeech: string }> {
  const dateKey = new Date().toISOString().slice(0, 10)

  const existing = await prisma.wordOfDay.findUnique({ where: { dateKey } })
  if (existing) {
    return { word: existing.word, definition: existing.definition, partOfSpeech: existing.partOfSpeech }
  }

  const entry = WORD_LIST[dateKeyHash(dateKey) % WORD_LIST.length]
  const fetched = await fetchDefinition(entry.word)

  const result = {
    word: entry.word,
    definition: fetched?.definition ?? entry.fallbackDefinition,
    partOfSpeech: fetched?.partOfSpeech ?? entry.fallbackPartOfSpeech,
  }

  await prisma.wordOfDay.create({ data: { ...result, dateKey } })
  return result
}

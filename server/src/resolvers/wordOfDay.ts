import { getWordOfDay } from '../services/wordOfDay'

const STUB_WORD = { word: 'ephemeral', partOfSpeech: 'adjective', definition: 'Lasting for a very short time.' }

export const wordOfDayResolvers = {
  Query: {
    wordOfDay: async () => {
      try {
        return await getWordOfDay()
      } catch (err) {
        console.error('Word of Day error, using stub:', err)
        return STUB_WORD
      }
    },
  },
}

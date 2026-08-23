import { LlmChat, UserMessage } from 'emergentintegrations'

const MODEL_PROVIDER = 'gemini'
const MODEL_NAME = 'gemini-2.5-flash'

const SYSTEM_MESSAGE = `Anda adalah asisten ahli budidaya maggot BSF (Black Soldier Fly) berbahasa Indonesia bernama Asisten Agrotech.
Jawablah dengan praktis, ramah, dan singkat (maksimal beberapa paragraf singkat atau poin-poin).
Fokus pada tips budidaya, manajemen limbah organik, dan troubleshooting masalah umum (hama, kelembaban, suhu, kontaminasi, kualitas pakan).
Jika data yang diberikan pengguna tidak cukup untuk memberi jawaban akurat, tanyakan detail tambahan yang relevan.
Selalu gunakan Bahasa Indonesia.`

export function createBsfChat(sessionId) {
  const key = process.env.EMERGENT_LLM_KEY
  if (!key) throw new Error('Missing EMERGENT_LLM_KEY')
  if (!key.startsWith('sk-emergent-')) {
    throw new Error('EMERGENT_LLM_KEY must be an Emergent Universal Key')
  }

  return new LlmChat(key, sessionId, SYSTEM_MESSAGE)
    .withModel(MODEL_PROVIDER, MODEL_NAME)
    .withParams({ temperature: 0.4, max_tokens: 900 })
}

export function extractText(response) {
  return typeof response === 'string'
    ? response
    : (response?.content || response?.text || String(response))
}

export { UserMessage, MODEL_NAME }

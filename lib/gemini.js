import { GoogleGenAI } from '@google/genai'

const GEMINI_MODEL = 'gemini-3.6-flash'

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null

const BSF_SYSTEM_INSTRUCTION = `Anda adalah asisten ahli budidaya maggot BSF (Black Soldier Fly) berbahasa Indonesia bernama Asisten Agrotech.
Jawablah dengan praktis, ramah, dan singkat (maksimal beberapa paragraf singkat atau poin-poin).
Fokus pada tips budidaya, manajemen limbah organik, dan troubleshooting masalah umum (hama, kelembaban, suhu, kontaminasi, kualitas pakan).
Jika data yang diberikan pengguna tidak cukup untuk memberi jawaban akurat, tanyakan detail tambahan yang relevan.
Selalu gunakan Bahasa Indonesia.`

function ensureClient() {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY belum diatur di server')
  }
  return genAI
}

// Multi-turn chat consultation assistant
export async function geminiChat(history, message) {
  const client = ensureClient()
  const contents = [
    ...(history || []).slice(-10).map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.text }]
    })),
    { role: 'user', parts: [{ text: message }] }
  ]

  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents,
    config: { systemInstruction: BSF_SYSTEM_INSTRUCTION }
  })

  return response.text?.trim() || ''
}

// Single-shot generation (tips tambahan kalkulator, analisis kegagalan, dll)
export async function geminiGenerate(prompt, systemInstruction) {
  const client = ensureClient()
  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: { systemInstruction: systemInstruction || BSF_SYSTEM_INSTRUCTION }
  })

  return response.text?.trim() || ''
}

// Multimodal Vision generation (analisis foto panen/gagal)
export async function geminiVision(prompt, imageUrl, systemInstruction) {
  const client = ensureClient()
  try {
    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error('Gagal mengunduh gambar')
    const buffer = Buffer.from(await res.arrayBuffer())
    const mimeType = res.headers.get("content-type") || "image/jpeg"

    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { data: buffer.toString("base64"), mimeType } }
          ]
        }
      ],
      config: { systemInstruction: systemInstruction || BSF_SYSTEM_INSTRUCTION }
    })
    return response.text?.trim() || ''
  } catch (error) {
    console.error("Gemini Vision Error:", error)
    return null
  }
}

export { GEMINI_MODEL, BSF_SYSTEM_INSTRUCTION }

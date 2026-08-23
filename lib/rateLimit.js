/**
 * Simple in-memory rate limiter untuk endpoint AI.
 * Batas: MAX_REQUESTS request per WINDOW_MS per user ID.
 * Catatan: Di multi-instance deployment, gunakan Redis-based limiter.
 */

const WINDOW_MS = 60 * 1000 // 1 menit
const MAX_REQUESTS = 15 // 15 request AI per menit per user

const store = new Map() // { userId: { count, resetAt } }

export function checkRateLimit(userId) {
  const now = Date.now()
  const record = store.get(userId)

  if (!record || now > record.resetAt) {
    store.set(userId, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_REQUESTS - 1 }
  }

  if (record.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

  record.count++
  return { allowed: true, remaining: MAX_REQUESTS - record.count }
}

'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, X, Send, Loader2 } from 'lucide-react'

export default function AIChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Halo! Saya asisten AI budidaya maggot BSF. Ada yang bisa saya bantu? 🐛' }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [messages, open])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', text: input }
    const history = messages
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: userMsg.text, history }) })
      const data = await res.json()
      setMessages(m => [...m, { role: 'assistant', text: data.answer || data.error || 'Maaf, terjadi kesalahan.' }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'Maaf, asisten sedang tidak tersedia.' }])
    } finally { setLoading(false) }
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className={`fixed right-4 bottom-20 z-40 w-14 h-14 rounded-full bg-emerald-600 shadow-lg flex items-center justify-center ${open ? 'hidden' : ''}`}>
        <Sparkles className="w-6 h-6 text-white" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center sm:items-center">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-lg w-full sm:max-w-md h-[70vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center"><Sparkles className="w-4 h-4 text-white" /></div>
                <h3 className="font-montserrat font-bold text-stone-800 text-sm">Asisten AI BSF</h3>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center"><X className="w-4 h-4 text-stone-500" /></button>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 space-y-3 pb-2">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${m.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-700'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && <div className="flex justify-start"><div className="bg-stone-100 rounded-2xl px-3 py-2"><Loader2 className="w-4 h-4 animate-spin text-stone-400" /></div></div>}
            </div>
            <div className="flex flex-row gap-2 px-4 py-3">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Tanya soal budidaya BSF..."
                className="flex-1 rounded-xl bg-stone-100 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
              <button onClick={send} disabled={loading} className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

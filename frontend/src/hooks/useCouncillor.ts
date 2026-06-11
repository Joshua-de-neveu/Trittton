import { useState, useCallback, useRef, useEffect } from 'react'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const STORAGE_KEY = 'ucsd-councillor-history'

function loadFromStorage(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useCouncillor() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadFromStorage)
  const [isStreaming, setIsStreaming] = useState(false)
  const [thinkingPhase, setThinkingPhase] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!isStreaming) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
    }
  }, [messages, isStreaming])

  const messagesRef = useRef(messages)
  messagesRef.current = messages

  const sendMessage = useCallback(async (
    text: string,
    model: string = 'gemini',
    geminiKey: string | null = null,
    anthropicKey: string | null = null,
    uid: string | null = null,
  ) => {
    const userMsg: ChatMessage = { role: 'user', content: text }
    const newMessages = [...messagesRef.current, userMsg]
    setMessages(newMessages)
    setIsStreaming(true)
    setThinkingPhase('Thinking...')
    setError(null)

    const assistantMsg: ChatMessage = { role: 'assistant', content: '' }
    setMessages([...newMessages, assistantMsg])

    try {
      const abort = new AbortController()
      abortRef.current = abort

      const body: Record<string, unknown> = { messages: newMessages, model, uid }
      if (model === 'gemini' && geminiKey) {
        body.gemini_api_key = geminiKey
      }
      if (model !== 'gemini' && anthropicKey) {
        body.anthropic_api_key = anthropicKey
      }

      const res = await fetch('/api/councillor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abort.signal,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(err.error || `Server returned ${res.status}`)
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('No response body')

      let buffer = ''
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.thinking !== undefined) {
                if (data.thinking) {
                  setThinkingPhase(data.phase || 'Thinking...')
                } else {
                  setThinkingPhase(null)
                }
              }
              if (data.text) {
                setThinkingPhase(null)
                fullText += data.text
                setMessages((prev) => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { role: 'assistant', content: fullText }
                  return updated
                })
              }
              if (data.error) {
                setError(data.error)
              }
            } catch {
              // skip malformed
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg)
      setMessages(newMessages)
    } finally {
      setIsStreaming(false)
      setThinkingPhase(null)
    }
  }, []) // stable: reads from messagesRef

  // Abort in-flight request on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  const clearChat = useCallback(() => {
    abortRef.current?.abort()
    setMessages([])
    setError(null)
    setIsStreaming(false)
    setThinkingPhase(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return { messages, isStreaming, thinkingPhase, error, sendMessage, clearChat }
}

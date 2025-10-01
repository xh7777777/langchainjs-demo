import axios from 'axios'
import { createParser } from 'eventsource-parser'

const apiClient = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json'
  }
})

interface StreamOptions {
  signal?: AbortSignal
  onChunk?: (text: string) => void
  onError?: (error: unknown) => void
  onComplete?: () => void
}

export const sendMessage = async (message: string) => {
  const response = await apiClient.post('/chat', { message })
  return response.data
}

export const streamMessage = async (message: string, options: StreamOptions = {}) => {
  const { onChunk, onError, onComplete, signal } = options

  try {
    const response = await fetch(`${apiClient.defaults.baseURL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message }),
      signal
    })

    if (!response.ok || !response.body) {
      throw new Error(`Stream request failed with status ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let completed = false

    const parser = createParser({
      onEvent(event) {
        if (event.event === 'error') {
          onError?.(event.data)
          return
        }

        if (event.data === '[DONE]') {
          completed = true
          onComplete?.()
          reader.cancel().catch(() => {})
          return
        }

        if (event.data) {
          onChunk?.(event.data)
        }
      },
      onError(parseError) {
        onError?.(parseError)
      }
    })

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      parser.feed(chunk)
    }

    if (!completed) {
      onComplete?.()
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return
    }
    onError?.(error)
    throw error
  }
}

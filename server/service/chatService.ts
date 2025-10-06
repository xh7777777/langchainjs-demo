import { makeResponse, streamResponse } from "../agent/langchain.ts"

export class ChatService {
  async chat(message: string): Promise<string> {
    const result = await makeResponse(message)
    const text = this.normalizeContent(result)
    return text || JSON.stringify(result)
  }

  async stream(message: string): Promise<AsyncGenerator<string, void, unknown>> {
    const source = (await streamResponse(message)) as AsyncIterable<unknown>
    const self = this

    async function* iterate(): AsyncGenerator<string, void, unknown> {
      const iterator = source[Symbol.asyncIterator]()
      try {
        while (true) {
          const { value, done } = await iterator.next()
          if (done) break
          const text = self.normalizeContent(value)
          if (!text) continue
          yield text
        }
      } finally {
        if (typeof iterator.return === "function") {
          try {
            await iterator.return()
          } catch (error) {
            console.error("ChatService.stream iterator cleanup error", error)
          }
        }
      }
    }

    return iterate()
  }

  private normalizeContent(input: unknown): string {
    console.log("normalizeContent input:", input)
    if (input == null) {
      return ""
    }

    if (typeof input === "string" || typeof input === "number" || typeof input === "boolean") {
      return String(input)
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.normalizeContent(item)).join("")
    }

    if (typeof input === "object") {
      const candidateKeys = ["content", "text", "delta", "message", "value"] as const

      for (const key of candidateKeys) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
          const value = (input as Record<string, unknown>)[key]
          const normalized = this.normalizeContent(value)
          if (normalized) {
            return normalized
          }
        }
      }

      if (Object.prototype.hasOwnProperty.call(input, "choices")) {
        const choices = (input as { choices: unknown }).choices
        if (Array.isArray(choices)) {
          return choices
            .map((choice) => this.normalizeContent(choice))
            .join("")
        }
      }

      return JSON.stringify(input)
    }

    return ""
  }
}

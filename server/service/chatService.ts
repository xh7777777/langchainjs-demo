import { makeResponse } from "../agent/langchain.ts"

export class ChatService {
  async chat(message: string): Promise<string> {
    const result = await makeResponse(message)

    if (typeof result === "string") {
      return result
    }

    const content = (result as { content?: unknown }).content

    if (typeof content === "string") {
      return content
    }

    if (Array.isArray(content)) {
      return content
        .map((part) => {
          if (!part) return ""
          if (typeof part === "string") return part
          if (typeof (part as { text?: unknown }).text === "string") {
            return (part as { text: string }).text
          }
          if (Array.isArray((part as { text?: unknown[] }).text)) {
            return (part as { text: unknown[] }).text.join("")
          }
          return JSON.stringify(part)
        })
        .join("")
    }

    return JSON.stringify(result)
  }
}

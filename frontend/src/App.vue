<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import MarkdownIt from 'markdown-it'
import type { RenderRule } from 'markdown-it/lib/renderer'
import { sendMessage, streamMessage } from './api'

type ChatRole = 'user' | 'ai'

interface ChatMessage {
  id: number
  role: ChatRole
  content: string
  createdAt: Date
}

const messages = ref<ChatMessage[]>([
  {
    id: Date.now(),
    role: 'ai',
    content: '嗨，我是你的 AI 小伙伴，随时准备回答你的问题。',
    createdAt: new Date()
  }
])
const userInput = ref('')
const isResponding = ref(false)
const chatBoxRef = ref<HTMLDivElement | null>(null)
const DEFAULT_ERROR_MESSAGE = '抱歉，暂时无法连接到服务，请稍后重试。'
const useStream = ref(true)
const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
})

const defaultLinkRule = markdown.renderer.rules.link_open as RenderRule | undefined

const linkOpenRule: RenderRule = (tokens, idx, options, env, self) => {
  const token = tokens[idx]
  token.attrSet('target', '_blank')
  token.attrSet('rel', 'noopener noreferrer')
  if (defaultLinkRule) {
    return defaultLinkRule(tokens, idx, options, env, self)
  }
  return self.renderToken(tokens, idx, options)
}

markdown.renderer.rules.link_open = linkOpenRule

const renderMarkdown = (input: string) => markdown.render(input)

const canSend = computed(() => userInput.value.trim().length > 0 && !isResponding.value)
const showTypingIndicator = computed(() => isResponding.value && !useStream.value)
const streamAbortController = ref<AbortController | null>(null)

const formatTimestamp = (value: Date) =>
  new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(value)

const scrollToBottom = async () => {
  await nextTick()
  const target = chatBoxRef.value
  if (!target) return
  target.scrollTop = target.scrollHeight
}

const handleSend = async () => {
  const trimmed = userInput.value.trim()
  if (!trimmed || isResponding.value) return

  messages.value.push({
    id: Date.now(),
    role: 'user',
    content: trimmed,
    createdAt: new Date()
  })
  userInput.value = ''
  isResponding.value = true
  scrollToBottom()

  if (useStream.value) {
    await streamReply(trimmed)
  } else {
    await fetchReply(trimmed)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleSend()
  }
}

const fetchReply = async (prompt: string) => {
  try {
    const response = await sendMessage(prompt)
    const reply = typeof response === 'string' ? response : response?.reply ?? DEFAULT_ERROR_MESSAGE

    messages.value.push({
      id: Date.now(),
      role: 'ai',
      content: reply,
      createdAt: new Date()
    })
  } catch (error) {
    console.error('Failed to fetch AI response', error)
    messages.value.push({
      id: Date.now(),
      role: 'ai',
      content: DEFAULT_ERROR_MESSAGE,
      createdAt: new Date()
    })
  } finally {
    isResponding.value = false
    scrollToBottom()
  }
}

const streamReply = async (prompt: string) => {
  const assistantMessage: ChatMessage = {
    id: Date.now(),
    role: 'ai',
    content: '',
    createdAt: new Date()
  }
  messages.value.push(assistantMessage)
  scrollToBottom()

  try {
    streamAbortController.value?.abort()
    const controller = new AbortController()
    streamAbortController.value = controller

    await streamMessage(prompt, {
      onChunk(content) {
        assistantMessage.content += content
        scrollToBottom()
      },
      onError(error) {
        console.error('Stream error', error)
        assistantMessage.content = DEFAULT_ERROR_MESSAGE
      },
      onComplete() {
        assistantMessage.createdAt = new Date()
      },
      signal: controller.signal
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return
    }
    console.error('Failed to stream AI response', error)
    assistantMessage.content = DEFAULT_ERROR_MESSAGE
  } finally {
    if (!streamAbortController.value?.signal.aborted) {
      streamAbortController.value?.abort()
    }
    streamAbortController.value = null
    isResponding.value = false
    scrollToBottom()
  }
}
</script>

<template>
  <div class="page">
    <header class="header">
      <h1>AI 聊天</h1>
      <p>支持非流式与流式两种模式切换</p>
    </header>
    <main class="chat-card">
      <div ref="chatBoxRef" class="messages">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message"
          :class="message.role"
        >
          <div class="bubble">
            <div class="message-body" v-html="renderMarkdown(message.content)"></div>
          </div>
          <span class="timestamp">{{ formatTimestamp(message.createdAt) }}</span>
        </div>
        <div v-if="showTypingIndicator" class="message ai thinking">
          <div class="bubble">
            <span class="dot" aria-hidden="true"></span>
            <span class="dot" aria-hidden="true"></span>
            <span class="dot" aria-hidden="true"></span>
          </div>
          <span class="timestamp">正在思考…</span>
        </div>
      </div>
      <form class="composer" @submit.prevent="handleSend">
        <label class="mode-toggle">
          <input v-model="useStream" type="checkbox" />
          <span>{{ useStream ? '流式模式' : '非流式模式' }}</span>
        </label>
        <textarea
          v-model="userInput"
          placeholder="输入内容，按 Enter 发送，Shift+Enter 换行"
          rows="2"
          :disabled="isResponding"
          @keydown="handleKeydown"
        ></textarea>
        <button type="submit" :disabled="!canSend">发送</button>
      </form>
    </main>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
  color: inherit;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header h1 {
  margin: 0;
  font-size: 24px;
}

.header p {
  margin: 0;
  color: rgba(148, 148, 148, 0.9);
  font-size: 14px;
}

.chat-card {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  padding: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(14px);
  box-shadow: 0 20px 30px -20px rgba(0, 0, 0, 0.4);
}

.messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 4px;
}

.message {
  display: flex;
  flex-direction: column;
  max-width: 70%;
}

.message.ai {
  align-self: flex-start;
}

.message.user {
  align-self: flex-end;
  align-items: flex-end;
}

.bubble {
  padding: 10px 14px;
  border-radius: 16px;
  line-height: 1.55;
  background: rgba(87, 90, 252, 0.2);
  border: 1px solid rgba(87, 90, 252, 0.4);
  color: inherit;
  position: relative;
}

.message-body :deep(p) {
  margin: 0;
}

.message-body :deep(p + p) {
  margin-top: 0.75em;
}

.message-body :deep(code) {
  background: rgba(255, 255, 255, 0.14);
  padding: 0.1em 0.4em;
  border-radius: 6px;
  font-family: 'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 0.92em;
}

.message-body :deep(pre) {
  margin: 0.75em 0 0;
  padding: 0.75em;
  background: rgba(0, 0, 0, 0.28);
  border-radius: 10px;
  overflow-x: auto;
}

.message-body :deep(pre code) {
  padding: 0;
  background: transparent;
  display: block;
  white-space: pre;
}

.message-body :deep(ul),
.message-body :deep(ol) {
  margin: 0.6em 0 0 1.2em;
  padding: 0;
}

.message-body :deep(a) {
  color: #b8c0ff;
}

.message-body :deep(strong) {
  font-weight: 600;
}

.message.user .bubble {
  background: linear-gradient(135deg, #636cff, #2a2fff);
  border-color: transparent;
  color: white;
}

.timestamp {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(148, 148, 148, 0.9);
}

.message.user .timestamp {
  color: rgba(255, 255, 255, 0.7);
}

.thinking .bubble {
  width: 56px;
  display: flex;
  justify-content: space-between;
  background: rgba(87, 90, 252, 0.18);
  border-style: dashed;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(87, 90, 252, 0.7);
  animation: blink 1.2s infinite ease-in-out;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

.composer {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 16px;
}

.composer textarea {
  flex: 1;
  resize: none;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  color: inherit;
  font-size: 14px;
  line-height: 1.6;
}

.composer textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.composer button {
  min-width: 84px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #636cff, #2a2fff);
  color: white;
  font-weight: 600;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.composer button:disabled {
  opacity: 0.5;
  transform: none;
  cursor: not-allowed;
}

.composer button:not(:disabled):hover {
  transform: translateY(-2px);
}

@keyframes blink {
  0%,
  80%,
  100% {
    opacity: 0.2;
  }
  40% {
    opacity: 1;
  }
}

@media (max-width: 720px) {
  .chat-card {
    padding: 12px;
    border-radius: 14px;
  }

  .message {
    max-width: 86%;
  }
}

.mode-toggle {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  min-width: 82px;
  user-select: none;
  cursor: pointer;
}

.mode-toggle input {
  width: 48px;
  height: 24px;
  accent-color: #636cff;
  cursor: pointer;
}
</style>


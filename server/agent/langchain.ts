import { ChatDeepSeek } from "@langchain/deepseek";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import * as dotenv from "dotenv";
dotenv.config();

// 初始化大模型
const llm = new ChatDeepSeek({
  model: "deepseek-reasoner",
  temperature: 0.7,
});

// 构建template
const prompt = ChatPromptTemplate.fromTemplate('You are a assistant for a chatbot. You are given a message and you need to respond to it.')

// 创建chain
const chain = prompt.pipe(llm)

// 返回对话历史
export async function makeResponse(message: string) {
  return await chain.invoke({
    message: message
  })
}

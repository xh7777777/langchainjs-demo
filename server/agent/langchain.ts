import { ChatDeepSeek } from "@langchain/deepseek";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { docs } from "./retrieval.ts";
import { ChatOpenAI } from "@langchain/openai";

import * as dotenv from "dotenv";
dotenv.config();

// 初始化大模型
const llm = new ChatDeepSeek({
  model: "deepseek-chat",
  temperature: 0.7,
});

// 构建template
const prompt = ChatPromptTemplate.fromTemplate(`
  Answer the user's question.
  Context: {context}.
  Question: {message}
`);

// 创建chain
const chain = await createStuffDocumentsChain({
  llm,
  prompt,
});

// 返回对话历史
export async function makeResponse(message: string) {
  console.log("makeResponse message:", docs);
  return await chain.invoke({
    message: message,
    context: docs
  })
}

export async function streamResponse(message: string) {
  return await chain.stream({
    message: message,
    context: "You are a helpful assistant."
  })
}

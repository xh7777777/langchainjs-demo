import { ChatDeepSeek } from "@langchain/deepseek";
import * as dotenv from "dotenv";
dotenv.config();

// 初始化大模型
const llm = new ChatDeepSeek({
  model: "deepseek-reasoner",
  temperature: 0.7,
});

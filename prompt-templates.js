import { ChatDeepSeek } from "@langchain/deepseek";
import { ChatPromptTemplate } from "@langchain/core/prompts";

import * as dotenv from 'dotenv'
dotenv.config()

const llm = new ChatDeepSeek({
  model: "deepseek-reasoner",
  temperature: 0.7,
});

const prompt = ChatPromptTemplate.fromTemplate('You are a comedian. Make a joke about {input}')
  
// create chain
const chain = prompt.pipe(llm)

const aiMsg = await chain.invoke({
    input: "dog"
})

console.log(aiMsg)
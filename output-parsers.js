import { ChatDeepSeek } from "@langchain/deepseek";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

import * as dotenv from 'dotenv'
dotenv.config()

const llm = new ChatDeepSeek({
  model: "deepseek-reasoner",
  temperature: 0.7,
});

const prompt = ChatPromptTemplate.fromTemplate('You are a comedian. Make a joke about {input}')

// create output parser
const outputParser = new StringOutputParser()
  
// create chain
const chain = prompt.pipe(llm).pipe(outputParser)

const aiMsg = await chain.invoke({
    input: "dog"
})

console.log(aiMsg)
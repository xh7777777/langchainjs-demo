import { ChatDeepSeek } from "@langchain/deepseek";
import * as dotenv from 'dotenv'
dotenv.config()

const llm = new ChatDeepSeek({
  model: "deepseek-reasoner",
  temperature: 0.7,
  verbose: true
});

const aiMsg = await llm.invoke('tell me how to find a girl friend')
  console.log(aiMsg);
  
  
// 用于构建向量存储，获取别的资源
import { Document } from "langchain/document"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore} from 'langchain/vectorstores/memory'


const loader = new CheerioWebBaseLoader(
  "https://js.langchain.com/docs/how_to/#langchain-expression-language-lcel"
);

export const docs = await loader.load()

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 2000,
  chunkOverlap: 20,
})

export const splitDocs = await splitter.splitDocuments(docs)

console.log("splitDocs:", splitDocs);

// const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, async (text: string) => {
//     const url = 'https://api.siliconflow.cn/v1/embeddings';
//     const options = {
//     method: 'POST',
//     headers: {Authorization: 'Bearer sk-dvkgednimxozjiwscmdrpdqlnhbusgxwjwdswdulwkuswtgo', 'Content-Type': 'application/json'},
//     body: '{"model":"BAAI/bge-large-zh-v1.5","input":"Silicon flow embedding online: fast, affordable, and high-quality embedding services. come try it out!"}'
//     };

//     const response = await fetch(url, options);
//     const data = await response.json();
//     console.log(data);
//     return data.data[0].embedding;
// });

// console.log("vectorStore:", vectorStore);
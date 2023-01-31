import { lstat } from 'fs'
import { type NextRequest, NextResponse } from 'next/server'
import { initialMessages } from '../../components/Chat'
import { type Message } from '../../components/ChatLine'

// break the app if the API key is missing
if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing Environment Variable OPENAI_API_KEY')
}

const botName = 'AI'
const userName = 'News reporter' // TODO: move to ENV var
const firstMessge = initialMessages[0].message

// @TODO: unit test this. good case for unit testing
const generatePromptFromMessages = (messages: Message[]) => {
  console.log('== INITIAL messages ==', messages)

  let prompt = ''

  // add first user message to prompt
  prompt += messages[1].message

  // remove first conversaiton (first 2 messages)
  const messagesWithoutFirstConvo = messages.slice(2)
  console.log(' == messagesWithoutFirstConvo', messagesWithoutFirstConvo)

  // early return if no messages
  if (messagesWithoutFirstConvo.length == 0) {
    return prompt
  }

  messagesWithoutFirstConvo.forEach((message: Message) => {
    const name = message.who === 'user' ? userName : botName
    prompt += `\n${name}: ${message.message}`
  })
  
  // return prompt
  return messages[messages.length-1].message
}

const getUserMessage = (messages: Message[]) => {
  const lastMessage = messages[messages.length - 1]
  return lastMessage.who === 'user' ? lastMessage.message : ''
}

export const config = {
  runtime: 'edge',
}

export default async function handler(req: NextRequest) {
  // read body from request
  const body = await req.json()

  // const messages = req.body.messages
  const userMessage = getUserMessage(body.messages)
  const payload = {
    messageBody: userMessage,
    phone_number: "+13364574672"
  }

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const response = await fetch('https://13hxtv4ocj.execute-api.us-east-1.amazonaws.com/prod/', {
    headers: requestHeaders,
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  console.log(data)

  if (data.error) {
    console.error('OpenAI API error: ', data.error)
    return NextResponse.json({
      text: `ERROR with API integration. ${data.error.message}`,
    })
  }

  // return response with 200 and stringify json text
  return NextResponse.json({ text: data })
}

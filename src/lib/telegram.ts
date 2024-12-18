import TelegramBot from 'node-telegram-bot-api'
import { env } from '~/env';

const bot = new TelegramBot(env.TELEGRAM_API_KEY, {
  polling: false,
  webHook: false
});

export async function announceNewTokenOnTelegram(name: string, ticker: string, ca: string) {
  try {
  const message = `New coin launched! 🚀
name: ${name}
ticker: ${ticker}
 
https://clank.fun/t/${ca.trim()}`

  await bot.sendMessage("-1002268416996", message)
  } catch(e: any) {
    console.log("Failed to announce on Telegram", e.message)
  }
}
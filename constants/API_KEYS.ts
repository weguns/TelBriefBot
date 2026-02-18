const API_KEYS = {
    telegramBot: Bun.env.TELEGRAM_TOKEN,
    metisAi: Bun.env.METISAI_API_KEY,
}

console.log(API_KEYS)

export default API_KEYS;
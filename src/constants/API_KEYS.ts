const API_KEYS: {telegramBot: string, metisAi: string} = {
    telegramBot: Bun.env.TELEGRAM_TOKEN ? Bun.env.TELEGRAM_TOKEN: "",
    metisAi: Bun.env.METISAI_API_KEY ? Bun.env.METISAI_API_KEY: "",
}

export default API_KEYS;
import {Bot, Context} from "grammy";
import {Database} from "bun:sqlite"
import API_KEYS from "#constants/API_KEYS.ts";
import {startCommandHandle} from "#commands";
import {OpenAI} from "openai";
import BASE from "#constants/BASE.ts";

const bot = new Bot<Context>(API_KEYS.telegramBot)
const db = new Database("./database/chats.sqlite")

const openAi = new OpenAI({
    apiKey: API_KEYS.metisAi,
    baseURL: BASE.URL
})

type ChatMessage = {
    message_id: number;
    reply_message_id: number | null;
    name: string;
    reply_name: string | null;
    text: string;
}

function createChatTable(chatId: number) {
    return ` CREATE TABLE IF NOT EXISTS "chat_${String(chatId)}"
             (
                 row
                 INTEGER
                 PRIMARY
                 KEY
                 AUTOINCREMENT,
                 message_id
                 INTEGER,
                 reply_message_id
                 INTEGER,
                 user_id
                 INTEGER,
                 username
                 text,
                 name
                 text,
                 reply_user_id
                 INTEGER,
                 reply_username
                 text,
                 reply_name
                 text,
                 chat_id
                 INTEGER,
                 text
                 TEXT
                 timestamp
                 DATETIME
                 DEFAULT
                 CURRENT_TIMESTAMP,
                 file_id
                 TEXT,
                 file_type
                 TEXT
             ) `;
}

function saveMessage(ctx: Context, db: Database) {
    if (ctx.message) {
        const message = ctx.message

        db.run(createChatTable(message.chat.id))

        db.run(
            `
                INSERT INTO "chat_${String(message.chat.id)}" (message_id, reply_message_id, user_id, username, name, reply_user_id, reply_username, reply_name, chat_id, text, file_id, file_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                message.message_id,
                message.reply_to_message?.message_id || null,
                message.from.id,
                message.from.username || null,
                message.from.first_name || null,
                message.reply_to_message?.from?.id || null,
                message.reply_to_message?.from?.username || null,
                message.reply_to_message?.from?.first_name || null,
                message.chat.id,
                message.text || null,
                null,
                null
            ]
        );

        db.run(`
            DELETE
            FROM "chat_${message.chat.id}"
            WHERE row <= (SELECT row FROM "chat_${message.chat.id}" ORDER BY row DESC LIMIT 1
            OFFSET 1000)
        `);

        if (message.chat.id === 5436968365) {
            console.log("Message received in the specified chat (ID: 5436968365).");
            // console.log(message);
        }

    }
}

function getChatHistory(chatId: number, limit: number = 100): ChatMessage[] {
    const tableName = `chat_${chatId}`;

    const rows = db.query(`
        SELECT message_id, reply_message_id, name, reply_name, text
        FROM "${tableName}"
        WHERE text IS NOT NULL
        ORDER BY row DESC LIMIT ?
    `).all(limit);

    return rows.reverse() as ChatMessage[];
}

startCommandHandle(bot);

bot.command("summarize", async (ctx) => {
    if (ctx.match && !isNaN(Number(ctx.match))) {
        const count = Number(ctx.match);

        if (count < 10 && count > 100) {
            return ctx.reply("تعداد پیام ها مناسب نمیباشد. لطفا بین 5 تا 100 پیام انتخاب کنید.");
        }

        const waitingMessage = await ctx.reply("در حال بررسی پیام ها ... لطفا صبر کنید.🔄");
        const history = getChatHistory(ctx.chat.id, count);

        try {
            const response = await openAi.chat.completions.create({
                model: BASE.model,
                messages: [
                    {
                        role: 'system',
                        content: `تو یک خلاصه ساز متن چت هستی. وظیفه تو به هنوان یک خلاصه ساز واضح و ساده است.با استفاده از متن پیام هایی که ارسال شده برایت یک خلاصه از بحث درجریان بده جوری که کاربر مجبور به خواندن آن تعداد چت نباشد. حتما در نظر بگیر با استفاده از آیدی پیام ها بفهمی چه چیزی در جواب چه چیزی است و همینطور در نظر بگیر پیام مورد درجواب پیام خاصی نیست یا ادامه پیام قبلی است یا موضوعی جدید.`
                    },
                    {
                        role: `user`,
                        content: `دیتای چت برای آنالیز و فرآیند خلاصه سازی: ${JSON.stringify(history)}`,
                    }
                ],
                response_format: {type: "json_object"}
            })

            const content = JSON.parse(response.choices[0].message.content!).summary;

            console.log(JSON.parse(response.choices[0].message.content!).summary);



            await ctx.api.editMessageText(
                ctx.chat.id,

                waitingMessage.message_id,

                `📊 خلاصه ${history.length} پیام اخیر:\n\n${content}`
            );
        } catch (error) {
            console.error("Error in summarization:", error);
            await ctx.api.editMessageText(
                ctx.chat.id,
                waitingMessage.message_id,
                "متأسفانه در فرآیند خلاصه‌سازی خطایی رخ داد. مطمئن شوید Ollama در حال اجرا است."
            );
        }


    }
})

bot.on("message", (ctx: Context) => saveMessage(ctx, db));

bot.start().then();
import {Database} from "bun:sqlite";

function createChatTable(chatId: number) {
    return ` CREATE TABLE IF NOT EXISTS "chat_${String(chatId)}"
             (
                 row INTEGER PRIMARY KEY AUTOINCREMENT,
                 message_id INTEGER,
                 reply_message_id INTEGER,
                 user_id INTEGER,
                 username text,
                 name text,
                 reply_user_id INTEGER,
                 reply_username text,
                 reply_name text,
                 chat_id INTEGER,
                 text TEXT timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                 file_id TEXT,
                 file_type TEXT
             ) `;
}

export { createChatTable };
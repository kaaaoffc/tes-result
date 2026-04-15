require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const imaps = require('imap-simple');
const { simpleParser } = require('mailparser');

// ================= CONFIG =================
const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_ID = process.env.OWNER_ID;
const CHECK_INTERVAL = process.env.CHECK_INTERVAL || 60000;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ================= IMAP CONFIG =================
const config = {
  imap: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    authTimeout: 10000
  }
};

// ================= START MESSAGE =================
bot.onText(/\/start/, (msg) => {
  if (msg.from.id.toString() !== OWNER_ID.toString()) return;

  bot.sendMessage(
    OWNER_ID,
    "🤖 Bot monitoring email spam telah aktif!"
  );
});

// ================= FUNCTION TO CHECK SPAM =================
async function checkSpamEmails() {
  try {
    const connection = await imaps.connect(config);
    await connection.openBox('[Gmail]/Spam');

    const searchCriteria = ['UNSEEN'];
    const fetchOptions = {
      bodies: [''],
      markSeen: true
    };

    const messages = await connection.search(searchCriteria, fetchOptions);

    for (const item of messages) {
      const all = item.parts.find(part => part.which === '');
      const parsed = await simpleParser(all.body);

      const subject = parsed.subject || '(Tanpa Subjek)';
      const from = parsed.from?.text || 'Tidak diketahui';
      const text = parsed.text || parsed.html || 'Tidak ada isi pesan';

      const message = `
✅ *NEW RESULT Detected*

RESULT BY: 💠 KAAAOFFC 💠

📨 *From:* ${from}
📌 *Subject:* ${subject}

✉️ *Isi pesan:*
${text.substring(0, 3500)}
`;

      const keyboard = {
        inline_keyboard: [
          [
            {
              text: "👨‍💻 Developer",
              url: "https://t.me/kaaaoffc311"
            }
          ]
        ]
      };

      await bot.sendMessage(OWNER_ID, message, {
        parse_mode: "Markdown",
        reply_markup: keyboard
      });
    }

    connection.end();
  } catch (error) {
    console.error("Error checking spam emails:", error);
  }
}

// ================= INTERVAL CHECK =================
setInterval(checkSpamEmails, CHECK_INTERVAL);

// Jalankan pertama kali saat bot start
checkSpamEmails();

console.log("🤖 Bot Spam Email Monitor is running...");

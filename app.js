// Imports
const dotenv = require("dotenv");
const Telegraf = require("telegraf");
const axios = require("axios");
const fs = require("fs");

// Load config
dotenv.config({ path: ".env" });

// Initialize the telegram API
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

//Set Download Directory and create it if it does not exist
var downloadDir = process.env.DOWNLOAD_DIR;

if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir);
}

// Download video and return to user
function getVid(tiktok_url, ctx) {
  axios
    .get(tiktok_url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 8.0.0; SM-G960F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.84 Mobile Safari/537.36",
      },
    })
    .then((response) => {
      let video = JSON.parse(
        "{" + response.data.match(/"urls":\s*?\[.+?\]/g) + "}"
      ).urls[0];
      video_key = tiktok_url.substring(21, tiktok_url.length - 1);
      if (video_key.length > 8) {
        video_key = Date.now();
      }
      axios({
        method: "get",
        url: video,
        responseType: "stream",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 8.0.0; SM-G960F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.84 Mobile Safari/537.36",
          Referer: tiktok_url,
        },
      }).then(function (response) {
        response.data.pipe(
          fs.createWriteStream(downloadDir + "/" + video_key + ".mp4")
        );
        ctx.reply("👍");
      });
    })
    .catch((error) => console.log(error));
}

// Take in message and validate
bot.on("text", (ctx) => {
  if (ctx.update.message.from.id == process.env.RESTRICT_USER) {
    video_url = ctx.update.message.text;
    console.log(video_url);
    if (video_url.match(/https?:\/\/v?m.tiktok.com\/.*\/.*/g)) {
      var resp = getVid(video_url, ctx);
    }
  }
});
bot.launch();

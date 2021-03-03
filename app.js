// Imports
const dotenv = require("dotenv");
const Telegraf = require("telegraf");
const axios = require("axios");
const fs = require("fs");
const { exec } = require("child_process");
const { stdout, stderr } = require("process");

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
  siteRE= /\"downloadAddr\":\"https?:\/\/.*?\"/g
  axios
    .get(tiktok_url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36 Edg/88.0.705.81",
      },
    })
    .then((response) => {
      console.log(response.headers)
      console.log(response.data.match(siteRE)[0].substring(16, response.data.match(siteRE)[0].length - 1).replace(/\\u0026/g, "&"))
      cookies = response.headers['set-cookie'].toString().replace(/\n|\r/g, "").match(/tt_webid_?v?2?=\d{19};/g).toString().replace(/,/g, ' ')
      console.log(cookies)
      let video;
      try {
        video = response.data.match(siteRE)[0].substring(16, response.data.match(siteRE)[0].length - 1).replace(/\\u0026/g, "&");}
      catch(error){
        console.log(error)
        ctx.reply("❌");
        return
      }
      video_key = tiktok_url.substring(22, tiktok_url.length - 1);
      console.log(video_key)
      if (video_key.length > 9) {
        video_key = Date.now();
      }
      axios({
        method: "get",
        url: video,
        responseType: "stream",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36 Edg/88.0.705.81",
            Referer: "https://www.tiktok.com/",
            Cookie: cookies,
        },
      }).then(function (response) {
        response.data.pipe(
          fs.createWriteStream(downloadDir + "/" + video_key + ".mp4")
        );
        ctx.reply("👍");
      });
    })
    .catch((error) => console.log(error.response));
}

function getVidYTDL(tiktok_url, ctx) {
  cmd = "youtube-dl --output '~/userdir/Nextcloud/TikTok/Downloads/%(id)s.mp4' " + tiktok_url;
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        ctx.reply("❌ - " + error.message);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        ctx.reply("❌ - " + stderr);
        return;
    }
    console.log(`stdout: ${stdout}`);
    ctx.reply("👍");
    return;
});
}


// Take in message and validate
bot.on("text", (ctx) => {
  if (ctx.update.message.from.id == process.env.RESTRICT_USER) {
    video_url = ctx.update.message.text;
    console.log(video_url);
    if (video_url.match(/https?:\/\/v?m?w?w?w?.tiktok.com\/.*\/.*/g)) {
      var resp = getVidYTDL(video_url, ctx);
    }
    else{
      ctx.reply("❌ - Invalid URL");
    }
  }
});
bot.launch();

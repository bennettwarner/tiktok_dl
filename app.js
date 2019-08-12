// Imports
const dotenv = require("dotenv");
const Telegraf = require("telegraf");
const cheerio = require("cheerio");
const axios = require("axios");
const fs = require("fs");
const puppeteer = require("puppeteer");

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
async function getVid(video, ctx) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(video);
  direct_url = await page.evaluate(
    "window.__INIT_PROPS__['/@:uniqueId/video/:id'].videoData.itemInfos.video.urls[0];"
  );
  await browser.close();
  video_key = video.substring(21, video.length - 1);
  axios({
    method: "get",
    url: direct_url,
    responseType: "stream"
  }).then(function(response) {
    response.data.pipe(
      fs.createWriteStream(downloadDir + "/" + video_key + ".mp4")
    );
    ctx.reply("👍");
  });
}

// Take in message and validate
bot.on("text", ctx => {
  if (ctx.update.message.from.id == process.env.RESTRICT_USER) {
    video = ctx.update.message.text;
    console.log(video);
    if (video.match(/http:\/\/vm.tiktok.com\/.*\//g)) {
      var resp = getVid(video, ctx);
    }
  }
});
bot.launch();

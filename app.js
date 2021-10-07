// Imports
import dotenv from "dotenv";
import { Telegraf } from "telegraf";
import NextcloudClient from 'nextcloud-link';
import { readFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { exec } from "child_process";
import { stdout, stderr } from "process";

// Load config
dotenv.config({ path: ".env" });

// Initialize the telegram API
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

//Set Download Directory and create it if it does not exist
var downloadDir = process.env.DOWNLOAD_DIR;
if (!existsSync('./temp')) {
  mkdirSync('./temp');
}

async function upload(video_key) {
  console.log("Uploaded started for: " + video_key);
  try {
    const client = new NextcloudClient({
      url: process.env.NEXTCLOUD_ADDR,
      username: process.env.NEXTCLOUD_USER,
      password: process.env.NEXTCLOUD_PASS,
    });

    await client.checkConnectivity();

    await client.put((downloadDir + video_key + ".mp4"), readFileSync("./temp/" + video_key + ".mp4"));
    console.log("Uploaded complete for: " + video_key);
    unlinkSync("./temp/" + video_key + ".mp4")
  } catch (error) {
    console.log(error);
  }
}

function getVidYTDL(tiktok_url, ctx) {
  var video_key;
  video_key = tiktok_url.substring(22, tiktok_url.length - 1);
        if (video_key.length > 9) {
    video_key = Date.now();
  }
  var cmd;
  cmd = "youtube-dl --output '" + './temp/' + video_key + ".mp4' " + tiktok_url;
  console.log(video_key)

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        ctx.reply("❌ - " + error.message);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        
        return;
    }
    console.log(`stdout: ${stdout}`);
    upload(video_key)
    ctx.reply("👍");
    return;
});
}


// Take in message and validate
bot.on("text", (ctx) => {
  if (ctx.update.message.from.id == process.env.RESTRICT_USER) {
    var video_url;
    video_url = ctx.update.message.text;
    console.log(video_url);
    if (video_url.match(/https?:\/\/v?m?w?w?w?.tiktok.com\/.*/g)) {
      var resp = getVidYTDL(video_url, ctx);
    }
    else{
      ctx.reply("❌ - Invalid URL");
    }
  }
});
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
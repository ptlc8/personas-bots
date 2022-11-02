const Discord = require("discord.js");
const fs = require("fs");
require("dotenv").config();

var messageFrequence = parseFloat(process.env.MESSAGE_FREQUENCE);
var EXPRESSIONS = JSON.parse(fs.readFileSync("expressions.json", "utf8"));

const client = new Discord.Client({ intents:
	[
		Discord.GatewayIntentBits.Guilds,
		Discord.GatewayIntentBits.GuildMessages,
		Discord.GatewayIntentBits.MessageContent
	]
});

client.on("ready", () => {
	console.info("Logged in Discord as "+client.user.tag);
});

client.on("messageCreate", async message => {
	if (message.author.id == client.user.id) return;
	if (Math.random() > messageFrequence) return;
	message.channel.send(EXPRESSIONS[Math.floor(EXPRESSIONS.length*Math.random())]);
});

client.login(process.env.DISCORD_BOT_TOKEN);

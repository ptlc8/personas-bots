const fs = require("fs");
const DiscordPersona = require("./persona");

/** @type DiscordPersona[] */
const personas = [];

for (let file of fs.readdirSync("personas").filter(file => file.endsWith("json"))) {
	let config = JSON.parse(fs.readFileSync(`personas/${file}`, "utf8"));
	config.name = file;
	personas.push(new DiscordPersona(config));
}
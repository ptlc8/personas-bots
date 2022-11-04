const fs = require("fs");
const DiscordPersona = require("./persona");

/** @type DiscordPersona[] */
const personas = [];

for (let file of fs.readdirSync("personas").filter(file => file.endsWith("json"))) {
	console.info(`Loading ${file}`);
	let config = JSON.parse(fs.readFileSync(`personas/${file}`, "utf8"));
	config.config = file;
	personas.push(new DiscordPersona(config));
}

console.info(`${personas.length} personas loaded`);
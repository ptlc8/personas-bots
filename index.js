const fs = require("fs");
const DiscordPersona = require("./discord-persona");

/** @type DiscordPersona[] */
const personas = [];

/** @type {{ignoreChannels: string[]?, frequenceFactor: number?, delayAddional: number?, delayFactor: number?, typingTimeAddional: number?, typingTimeFactor: number?}} */
var globalConfig = {
	ignoreChannels: [],
	frequenceFactor: 1,
	delayAddional: 0,
	delayFactor: 1,
	typingTimeFactor: 1,
	typingTimeAddional: 0
};
if (fs.existsSync("config.json")) {
	var json = fs.readFileSync("config.json", "utf8");
	try {
		globalConfig = JSON.parse(json);
	} catch (e) {
		console.error("Error parsing config.json: fix or delete it");
		console.error("\t " + e.message);
		process.exit(1);
	}
	console.info("Loaded config.json");
} else {
	fs.writeFileSync("config.json", JSON.stringify(globalConfig, null, 4));
}

for (let file of fs.readdirSync("personas").filter(file => file.endsWith("json"))) {
	console.info(`Loading ${file}`);
	/** @type DiscordPersona.Config */
	let config = JSON.parse(fs.readFileSync(`personas/${file}`, "utf8"));
	config.ignoreChannels = (config.ignoreChannels ?? []).concat(globalConfig.ignoreChannels ?? []);
	for (let r of config.responses ?? [])
		r.frequence = 1 - Math.pow(1 - r.frequence, globalConfig.frequenceFactor) ?? 1;
	for (let r of config.routines ?? [])
		r.frequence = 1 - Math.pow(1 - r.frequence, globalConfig.frequenceFactor) ?? 1;
	config.delay = (config.delay ?? 0) * (globalConfig.delayFactor ?? 1) + (globalConfig.delayAddional ?? 0);
	config.typingTime = (config.typingTime ?? 2000) * (globalConfig.typingTimeFactor ?? 1) + (globalConfig.typingTimeAddional ?? 0);
	config.config = file;
	personas.push(new DiscordPersona(config));
}

console.info(`${personas.length} personas loaded`);
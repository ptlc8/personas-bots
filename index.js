const fs = require("fs");
const DiscordPersona = require("./discord-persona");

/**
 * @typedef GlobalConfig
 * @property {string[]?} ignoreChannels channels names patterns to ignore
 * @property {number?} frequenceFactor
 * @property {number?} delayAddional
 * @property {number?} delayFactor
 * @property {number?} typingTimeAddional
 * @property {number?} typingTimeFactor
 * @property {string?} timeZone timezone to use, example: "Europe/Paris"
 */

/** @type {DiscordPersona[]} */
const personas = [];

/** @type {GlobalConfig} */
var globalConfig = {
	ignoreChannels: [],
	frequenceFactor: 1,
	delayAddional: 0,
	delayFactor: 1,
	typingTimeFactor: 1,
	typingTimeAddional: 0,
	timeZone: null
};

var configFile = "data/config.json";
if (fs.existsSync(configFile)) {
	var json = fs.readFileSync(configFile, "utf8");
	try {
		globalConfig = JSON.parse(json);
	} catch (/** @type {any} */ e) {
		console.error(`Error parsing config file: fix or delete it (${configFile})`);
		console.error("\t " + e.message);
		process.exit(1);
	}
	console.info('Config file loaded');
} else {
	fs.writeFileSync(configFile, JSON.stringify(globalConfig, null, 4));
	console.info("Config file created");
}

if (globalConfig.timeZone)
	process.env.TZ = globalConfig.timeZone;

var personasFolder = "data/personas";
for (let file of fs.readdirSync(personasFolder).filter(file => file.endsWith("json"))) {
	console.info(`Loading ${file}`);
	/** @type {DiscordPersona.Config} */
	let config = JSON.parse(fs.readFileSync(`${personasFolder}/${file}`, "utf8"));
	config.ignoreChannels = (config.ignoreChannels ?? []).concat(globalConfig.ignoreChannels ?? []);
	for (let r of config.responses ?? [])
		r.frequence = 1 - Math.pow(1 - (r.frequence ?? 0), globalConfig.frequenceFactor ?? 1);
	for (let r of config.routines ?? [])
		r.frequence = 1 - Math.pow(1 - (r.frequence ?? 0), globalConfig.frequenceFactor ?? 1);
	config.delay = (config.delay ?? 0) * (globalConfig.delayFactor ?? 1) + (globalConfig.delayAddional ?? 0);
	config.typingTime = (config.typingTime ?? 2000) * (globalConfig.typingTimeFactor ?? 1) + (globalConfig.typingTimeAddional ?? 0);
	config.config = file;
	personas.push(new DiscordPersona(config));
}

console.info(`${personas.length} personas loaded`);

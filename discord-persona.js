const Discord = require("discord.js");
const Persona = require("./persona");

/**
 * @typedef DiscordConfig
 * @property {string} token Discord bot token
 * @property {number?} delay Delay before response
 * @property {number?} typingTime Time to type message
 * 
 * @typedef {Persona.Config & DiscordConfig} Config
 */

/**
 * Persona for Discord
 * @see {@link Persona} Persona
 * @see {@link https://discord.js.org/#/docs/main/stable/class/Client} Discord.Client
 */
class DiscordPersona {
    /**
     * @param {Config} config Also containing Persona parameters
     * @see {@link Persona} Persona
     */
    constructor({ token, config, responses, routines, delay, typingTime, ignoreChannels }) {
        /** @type {string} */
        this.config = config;
        /** @type {Persona} */
        this.persona = new Persona({ config, responses, routines, ignoreChannels });
        /** @type {number} */
        this.delay = delay || 0;
        /** @type {number} */
        this.typingTime = typingTime || 2000;
        /** @type {Discord.Client} */
        this.client = new Discord.Client({
            intents:
                [
                    Discord.GatewayIntentBits.Guilds,
                    Discord.GatewayIntentBits.GuildMessages,
                    Discord.GatewayIntentBits.MessageContent
                ]
        });
        this.client.on("ready", () => {
            console.info(`[${this.config}] Logged in Discord as ${this.client.user?.tag}`);
        });
        this.client.on("messageCreate", async message => {
            // if it's its message ignore
            if (message.author.id == this.client.user?.id) return;
            // else if it's command
            if (message.content.split(" ")[0] == `<@${this.client.user?.id}>`) {
                let result = this.command(message.content.replace(`<@${this.client.user?.id}>`, "").trim());
                if (result) {
                    message.channel.send(result);
                    return;
                }
            }
            // else let persona respond
            var response = this.persona.onMessage(message.content, "name" in message.channel ? message.channel.name : "", message.mentions.users.has(this.client.user?.id ?? "0"));
            if (response) {
                this.sendMessage(message.channel, response);
            }
        });
        this.client.login(token);
        setInterval(() => {
            let action = this.persona.onMinute(this.client.channels.cache.filter(channel => "messages" in channel).map(channel => "name" in channel ? channel.name : ""));
            if (!action) return;
            if (action.message && action.channel) {
                let textChannels = this.client.channels.cache.filter(channel => channel.type == Discord.ChannelType.GuildText)
                let channel = textChannels.find(channel => "name" in channel && channel.name == action.channel) ?? null;
                this.sendMessage(channel, action.message);
            }
        }, 60 * 1000);
    }
    /**
     * Send a message in a specific channel with typing
     * @param {Discord.TextBasedChannel?} channel 
     * @param {string|String[]} message 
     */
    async sendMessage(channel, message) {
        if (!channel)
            return;
        if ("guild" in channel && channel.guild.members.me && !channel.permissionsFor(channel.guild.members.me).has([Discord.PermissionFlagsBits.SendMessages, Discord.PermissionFlagsBits.ViewChannel]))
            return;
        if (message instanceof Array) {
            if (message.length == 0) return;
            let remain = message.slice(1);
            setTimeout(() => this.sendMessage(channel, remain), randomize(this.delay / 2, 20) + randomize(this.typingTime, 10) + 100);
            message = message[0];
        }
        if ("guild" in channel)
            message = await replaceAsync(message, /(?<!<):([a-zA-Z0-9_]+):(?![0-9])/g, async (_match, emojiName) => {
                return await getEmoji(channel.guild, emojiName);
            });
        setTimeout(() => {
            channel.sendTyping();
            setTimeout(() => channel.send(message), randomize(this.typingTime, 30));
        }, randomize(this.delay, 60));
    }
    /**
     * Get result of a command
     * @param {string} message Message content
     * @returns {?string}
     */
    command(message) {
        switch (message.split(" ")[0]) {
            case "info":
                let info = this.persona.info();
                return `J'ai ${info.responses} répliques, ${info.routines} routines, ${info.expressions} expressions et je réponds en moyenne à ${info.frequence * 100}% des messages (${info.config})`;
        }
        return null;
    }
}

/** @type {Object.<string, Discord.Collection<Discord.Snowflake, Discord.GuildEmoji>>} */
const emojisCache = {}
/**
 * Find emote tag with name
 * @param {Discord.Guild} guild 
 * @param {string} emojiName 
 * @returns {Promise<string>}
 */
function getEmoji(guild, emojiName) {
    return new Promise((resolve, _reject) => {
        if (!emojisCache[guild.id]) {
            guild.emojis.fetch()
                .then(emojis => {
                    emojisCache[guild.id] = emojis.filter(emoji => emoji.available ?? false);
                    var emoji = emojisCache[guild.id].find(emoji => emoji.name == emojiName);
                    resolve(emoji ? `<:${emoji.name}:${emoji.id}>` : emojiName);
                });
        } else {
            var emoji = emojisCache[guild.id].find(emoji => emoji.name == emojiName);
            resolve(emoji ? `<:${emoji.name}:${emoji.id}>` : emojiName);
        }
    });
}

/**
 * String.replace function but for async function
 * @see {@link String.replace}
 * @param {string} str 
 * @param {string|RegExp} regex 
 * @param {function(...string):Promise<string>} asyncFn 
 * @returns 
 */
async function replaceAsync(str, regex, asyncFn) {
    /** @type {Promise<?>[]} */
    const promises = [];
    str.replace(regex, (match, ...args) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
        return "";
    });
    const data = await Promise.all(promises);
    return str.replace(regex, () => data.shift());
}

/** Add or remove % of the value
 * @param {number} value
 * @param {number} percent
 * @returns {number}
 */
function randomize(value, percent) {
    return value * (1 + (Math.random() - 0.5) * percent / 50);
}

module.exports = DiscordPersona;
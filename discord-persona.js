const Discord = require("discord.js");
const Persona = require("./persona");

/**
 * @typedef {Persona.Config} Config
 * @property {string} token Discord bot token
 * @property {number?} delay Delay before response
 * @property {number?} typingTime Time to type message
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
        /** @type Persona */
        this.persona = new Persona({ config, responses, routines, ignoreChannels });
        /** @type number */
        this.delay = delay || 0;
        /** @type number */
        this.typingTime = typingTime || 2000;
        /** @type Discord.Client */
        this.client = new Discord.Client({
            intents:
                [
                    Discord.GatewayIntentBits.Guilds,
                    Discord.GatewayIntentBits.GuildMessages,
                    Discord.GatewayIntentBits.MessageContent
                ]
        });
        this.client.on("ready", () => {
            console.info(`[${this.config}] Logged in Discord as ${this.client.user.tag}`);
        });
        this.client.on("messageCreate", async message => {
            // if it's its message ignore
            if (message.author.id == this.client.user.id) return;
            // else if it's command
            if (message.content.split(" ")[0] == `<@${this.client.user.id}>`) {
                let result = this.command(message.content.replace(`<@${this.client.user.id}>`, "").trim());
                if (result) {
                    message.channel.send(result);
                    return;
                }
            }
            // else let persona respond
            var response = this.persona.onMessage(message.content, message.channel.name, message.mentions.users.has(this.client.user.id));
            if (response) {
                this.sendMessage(message.channel, response);
            }
        });
        this.client.login(token);
        setInterval(() => {
            var action = this.persona.onMinute(this.client.channels.cache.filter(channel => channel.send).map(channel => channel.name));
            if (!action) return;
            if (action.message && action.channel) {
                this.sendMessage(this.client.channels.cache.find(channel => channel.name == action.channel), action.message);
            }
        }, 60 * 1000);
    }
    /**
     * Send a message in a specific channel with typing
     * @param {Discord.Channel} channel 
     * @param {string|String[]} message 
     */
    sendMessage(channel, message) {
        if (!channel.send)
            return;
        if (!channel.permissionsFor(channel.guild.members.me).has([Discord.PermissionFlagsBits.SendMessages, Discord.PermissionFlagsBits.ViewChannel]))
            return;
        if (message instanceof Array) {
            if (message.length == 0) return;
            let remain = message.slice(1);
            setTimeout(() => this.sendMessage(channel, remain), randomize(this.delay, 20) + randomize(this.typingTime, 10) + 100);
            message = message[0];
        }
        replaceAsync(message, /(?<!<):([a-zA-Z0-9_]+):(?![0-9])/g, async (_match, emojiName) => {
            return await getEmoji(channel.guild, emojiName);
        }).then(message => {
            setTimeout(() => {
                channel.sendTyping();
                setTimeout(() => channel.send(message), randomize(this.typingTime, 30));
            }, randomize(this.delay, 60));
        });
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

/** @type {{Discord.Snowflake: Discord.Collection<Discord.Snowflake, Discord.GuildEmoji>}}} */
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
                    emojisCache[guild.id] = emojis.filter(emoji => emoji.available);
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
 * @param {function(string):Promise<string>} asyncFn 
 * @returns 
 */
async function replaceAsync(str, regex, asyncFn) {
    const promises = [];
    str.replace(regex, (match, ...args) => {
        const promise = asyncFn(match, ...args);
        promises.push(promise);
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
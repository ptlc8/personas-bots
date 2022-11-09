const Discord = require("discord.js");
const Persona = require("./persona");

class DiscordPersona {
    /**
     * @param {Object} param Also containing Persona parameters
     * @param {string} param.token Discord bot token
     * @param {number?} param.delay Delay before response
     * @param {number?} param.typingTime Time to type message
     * @see {@link Persona} Persona
     */
    constructor({ token, expressions, frequence, config, responses, delay, typingTime }) {
        /** @type {string} */
        this.config = config;
        /** @type Persona */
        this.persona = new Persona({ expressions, frequence, config, responses });
        /** @type number */
        this.delay = delay || 0;
        /** @type number */
        this.typingTime = typingTime || 2000;
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
            var response = this.persona.onMessage(message.content, message.mentions.users.has(this.client.user.id));
            if (response) {
                setTimeout(() => {
                    message.channel.sendTyping();
                    setTimeout(() => message.channel.send(response), this.typingTime);
                }, this.delay);
            }
        });
        this.client.login(token);
    }
    /**
     * Get result of a command
     * @param {string} message Message content
     * @returns {?string}
     */
    command(message) {
        switch (message.split(" ")[0]) {
            case "info":
                let info = this.info();
                return `J'ai ${info.expressions} expressions, ${info.responses} répliques et je réponds à ${info.frequence * 100}% des messages (${info.config})`;
        }
        return null;
    }
}

module.exports = DiscordPersona;
const Discord = require("discord.js");

class DiscordPersona {
    /**
     * @param {Object} param
     * @param {string} param.token Discord bot token
     * @param {string[]} param.expressions Array of sentences
     * @param {number} param.frequence Message frequence
     * @param {string} param.config Configuration name
     */
    constructor({ token, expressions, frequence, config }) {
        /** @type {string[]} */
        this.expressions = expressions;
        /** @type {number} */
        this.frequence = frequence;
        /** @type {string} */
        this.config = config;
        this.client = new Discord.Client({
            intents:
                [
                    Discord.GatewayIntentBits.Guilds,
                    Discord.GatewayIntentBits.GuildMessages,
                    Discord.GatewayIntentBits.MessageContent
                ]
        });
        this.client.on("ready", () => {
            console.info("Logged in Discord as " + this.client.user.tag);
        });
        this.client.on("messageCreate", async message => {
            // if it's its message ignore
            if (message.author.id == this.client.user.id) return;
            // else if it's command
            if (message.content.split(" ")[0] == `<@${this.client.user.id}>`) {
                console.log("command");
                let result = this.command(message.content.replace(`<@${this.client.user.id}>`, "").trim());
                if (result) {
                    message.channel.send(result);
                    return;
                }
            }
            // else if it need to send expression
            if (message.mentions.users.has(this.client.user.id) || Math.random() < messageFrequence)
                message.channel.send(this.expressions[Math.floor(this.expressions.length * Math.random())]);
        });
        this.client.login(token);
    }
    /**
     * Get result of a command
     * @param {string} message Message content
     * @returns {?string}
     */
    command(message) {
        console.log(message);
        switch (message.split(" ")[0]) {
            case "info":
                let info = this.info();
                return `J'ai ${info.expressions} expressions et je réponds à ${info.frequence * 100}% des messages (${info.config})`;
        }
        return null;
    }
    /**
     * Get info about the persona
     * @returns {{tag: string, expressions: number, frequence: number, config: string}}
     */
    info() {
        return {
            tag: this.client.user.tag,
            expressions: this.expressions.length,
            frequence: this.frequence
        };
    }
}

module.exports = DiscordPersona;
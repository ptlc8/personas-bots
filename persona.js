/**
 * @typedef Response
 * @property {string?} pattern pattern to match with previous message to send
 * @property {number?} frequence frequence between 0 and 1 of response
 * @property {(string|string[])[]?} expressions array of possible expressions
 * @property {string|string[]?} expression only if one expression
 * @property {boolean} whenMention only use when mention
 * @property {string[]?} channels array of channel id allowed, default is all
 */

/**
 * @typedef Routine
 * @property {[string,string]?} between two time between routine can be sent, example : ["10:00", "18:00"]
 * @property {number?} frequence probability of it being sent every minute
 * @property {(string|string[])[]?} expressions array of possible expressions
 * @property {(string|string[])?} expression only if one expression
 * @property {string[]?} channels array of channel id allowed, default is all
 */

/**
 * @typedef Config
 * @property {string} config configuration name
 * @property {string[]?} names possible names
 * @property {Response[]?} responses possible responses
 * @property {Routine[]?} routines possible routines
 * @property {string[]?} ignoreChannels channels names patterns to ignore
 */

const { llmComplete } = require("./mistral-llm"); 

class Persona {
    /**
     * @param {Config} config
     */
    constructor({ config, names, responses, routines, ignoreChannels }) {
        /** @type {string} */
        this.config = config;
        /** @type {string[]} */
        this.names = names || [];
        /** @type {Response[]} */
        this.responses = responses || [];
        /** @type {Routine[]} */
        this.routines = routines || [];
        /** @type {string[]} */
        this.ignoreChannels = ignoreChannels || [];
    }

    /**
     * Inform the persona that a message was received
     * @param {string} message content of the message received
     * @param {string?} sender sender name
     * @param {string} channel channel name or identifier
     * @param {boolean} mentioned true if the persona was mentioned
     * @returns {Promise<(string|string[])?>} response of the persona
     */
    async onMessage(message, sender, channel = "", mentioned = false) {
        if (!filterChannels([channel], this.ignoreChannels)[0])
            return null;
        var prompt = `
Tu es un humain, on t'apelle ${this.names.join(" ou ")}
Tu ne sors jamais du personnage ! Tu ne cherches pas à être intelligent ou informatif

Tu as pour but de répondre ou non à des messages, tu peux être créatif.
Mais pour t'aider voici quelques exemples de tes expressions typiques, tu peux t'en inspirer, les modifier, les mélanger ou en inventer des variantes pour rester imprévisible et naturel :
${this.responses.map(responseToString).map(r => "\n- " + r)}

Surprend l'utilisateur avec une réponse intéressante
N'utilise pas que ton vocabulaire, utilise aussi des mots normaux, tu restes un humain normal

On est le ${new Date().toLocaleString()}
${sender ?? "Un utilisateur"} : ${message}
${mentioned ? "Tu as été ping dans ce message" : "Tu n'as pas été ping dans ce message mais tu peux répondre quand même"}
Si tu ne veux pas répondre, répond null et rien d'autre
`;
        console.log(prompt);
        let response = await llmComplete(prompt);
        if ((response instanceof Array ? response[0] : response)?.toLowerCase() == "null")
            return null;
        return response;
    }

    /**
     * Inform the persona that a minute has passed
     * @param {string[]} channels list of channels names or identifiers
     * @returns {{message: string | string[], channel: string?}?} message the persona would send
     */
    onMinute(channels) {
        /*for (let routine of this.routines) { // TODO: temporary disabled
            if (!testBetween(routine.between) || (Math.random() > (routine.frequence || 0))) continue;
            return {
                message: routine.expressions ? pickRandom(routine.expressions) : routine.expression ?? [],
                channel: pickRandom(filterChannels(channels, this.ignoreChannels, routine.channels ?? []))
            };
        }*/
        return null;
    }

    /**
     * Get info about the persona
     * @returns {{expressions: number, frequence: number, config: string, responses: number, routines: number}}
     */
    info() {
        return {
            config: this.config,
            responses: Object.keys(this.responses).length,
            routines: Object.keys(this.routines).length,
            expressions: [...this.responses, ...this.routines].reduce((n, r) => n + (r.expressions?.length || 1), 0),
            frequence: this.responses.reduce((f, r) => r.pattern ? f : f + (1 - f) * (r.frequence || 0), 0)
        };
    }
}

/**
 * @param {string} str formating string
 * @param {string[]} args arguments
 * @returns {string} formated string
 */
function format(str, args) {
    return str.replace(/{([0-9]+)}/g, function (match, index) {
        return typeof args[index] == "undefined" ? match : args[index];
    });
}

/**
 * @template T
 * @param {T[]} arr
 * @returns {T}
 */
function pickRandom(arr) {
    return arr[Math.floor(arr.length * Math.random())];
}

/**
 * Test if actual time is between interval
 * @param {[string,string]?} interval two time between routine can be sent, example : ["10:00", "18:00"]
 * @returns {boolean} 
 */
function testBetween(interval) {
    if (!interval) return true;
    var now = new Date().getHours() * 60 + new Date().getMinutes();
    var time1 = Number(interval[0].split(":")[0] || 0) * 60 + Number(interval[0].split(":")[1] || 0);
    var time2 = Number(interval[1].split(":")[0] || 0) * 60 + Number(interval[1].split(":")[1] || 0);
    return time1 < time2 ? (time1 <= now && now < time2) : (time1 < now || now < time2);
}

/**
 * Filter channels
 * @param {string[]} channels 
 * @param {string[]} ignorePatterns ignoring patterns
 * @param {string[]} patterns inclusion patterns, if undefined, all channels are included
 * @returns {string[]} filtered channels
 */
function filterChannels(channels, ignorePatterns, patterns = []) {
    return channels.filter(channel => {
        for (let iPattern of ignorePatterns)
            if (channel.match(new RegExp(iPattern, "i")))
                return false;
        if (patterns.length == 0) return true;
        for (let pattern of patterns)
            if (channel.match(new RegExp(pattern, "i")))
                return true;
        return false;
    });
}

/**
 * Retourne une version naturellement lisible d'une réponse
 * Pour une utilisation dans un prompt
 * @param {Response} response
 * @returns {string}
 */
function responseToString(response) {
    let expressions = response.expressions ?? [response.expression];
    let string = "";
    if (response.pattern)
        string += `quand on dit "${response.pattern}", `;
    if (response.whenMention)
        string += "quand tu es ping";
    //if (response.frequence)
    //    string += `avec une fréquence de ${response.frequence * 60 * 24} fois par jour`;
    string += expressions.map(expr => `\n  - ${expr instanceof Array ? expr.join(" ") : expr}`).join("");
    return string;
}

module.exports = Persona;

/**
 * @typedef Response
 * @type {object}
 * @property {string?} pattern pattern to match with previous message to send
 * @property {number?} frequence frequence between 0 and 1 of response
 * @property {string[]|string[][]?} expressions array of possible expressions
 * @property {string|string[]?} expression only if one expression
 * @property {boolean} whenMention only use when mention
 * @property {string[]?} channels array of channel id allowed, default is all
 */

/**
 * @typedef Routine
 * @type {object}
 * @property {[string,string]?} between two time between routine can be sent, example : ["10:00", "18:00"]
 * @property {number?} frequence probability of it being sent every minute
 * @property {string[]?} expressions array of possible expressions
 * @property {string?} expression only if one expression
 */

class Persona {
    /**
     * @param {Object} param
     * @param {string?} param.config configuration name
     * @param {Response[]} param.responses possible responses
     * @param {Routine[]} param.routines possible routines
     */
    constructor({ config, responses, routines }) {
        /** @type {string?} */
        this.config = config;
        /** @type {Response[]} */
        this.responses = responses || [];
        /** @type {Routine[]} */
        this.routines = routines || [];
    }
    /**
     * Inform the persona that a message was received
     * @param {string} message content of the message received
     * @param {string} channel channel name or identifier
     * @param {boolean} mentioned true if the persona was mentioned
     * @returns {string?} response of the persona
     */
    onMessage(message, channel = undefined, mentioned = false) {
        for (let response of this.responses) {
            if (response.channels && !response.channels.includes(channel)) continue;
            if (!(response.whenMention && mentioned) && (Math.random() > (response.frequence || 0))) continue;
            var match = response.pattern
                ? message.match(new RegExp(response.pattern, "i"))
                : [message];
            if (match) {
                let expression = response.expressions ? pickRandom(response.expressions) : response.expression;
                return expression instanceof Array ? expression.map(e => format(e, match)) : format(expression, match);
            }
        }
    }
    /**
     * Inform the persona that a minute has passed
     * @returns {string?} message the persona would send
     */
    onMinute() {
        for (let routine of this.routines) {
            if (!testBetween(routine.between) || (Math.random() > (routine.frequence || 0))) continue;
            return routine.expressions ? pickRandom(routine.expressions) : routine.expression;
        }
    }
    /**
     * Get info about the persona
     * @returns {{expressions: number, frequence: number, config: string, responses: number}}
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
        return typeof args[index] == 'undefined' ? match : args[index];
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
 * @param {[string,string]} interval two time between routine can be sent, example : ["10:00", "18:00"]
 * @returns {boolean} 
 */
function testBetween(interval) {
    if (!interval) return true;
    var now = new Date().getHours() * 60 + new Date().getMinutes();
    var time1 = Number(interval[0].split(":")[0] || 0) * 60 + Number(interval[0].split(":")[1] || 0);
    var time2 = Number(interval[1].split(":")[0] || 0) * 60 + Number(interval[1].split(":")[1] || 0);
    return time1 < time2 ? (time1 <= now && now < time2) : (time1 < now || now < time2);
}

module.exports = Persona;
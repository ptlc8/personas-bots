class Persona {
    /**
     * @param {Object} param
     * @param {string[]?} param.expressions Array of sentences
     * @param {number?} param.frequence Message frequence
     * @param {string?} param.config Configuration name
     * @param {Object.<string,string>?} param.responses Regex and associated responses
     */
    constructor({ expressions, frequence, config, responses }) {
        /** @type {string[]} */
        this.expressions = expressions || [];
        /** @type {number} */
        this.frequence = frequence || 0;
        /** @type {string?} */
        this.config = config;
        /** @type {Object.<string,string>} */
        this.responses = responses || {};
    }
    onMessage(message, mentioned=false) {
        // if it can respond
        for (let pattern in this.responses) {
            var match = message.match(new RegExp(pattern, "i"));
            if (match)
                return format(this.responses[pattern], match);
        }
        // else if it need to send expression
        if (mentioned || Math.random() < this.frequence)
            return this.expressions[Math.floor(this.expressions.length * Math.random())];
    }
    /**
     * Get info about the persona
     * @returns {{tag: string, expressions: number, frequence: number, config: string, responses: number}}
     */
    info() {
        return {
            tag: this.client.user.tag,
            expressions: this.expressions.length,
            frequence: this.frequence,
            config: this.config,
            responses: Object.keys(this.responses).length
        };
    }
}

/**
 * @param {string} str formating string
 * @param {any[]} args arguments
 * @returns {string} formated string
 */
function format(str, args) {
    return str.replace(/{([0-9]+)}/g, function (match, index) {
        return typeof args[index] == 'undefined' ? match : args[index];
    });
}

module.exports = Persona;
import { Mistral } from '@mistralai/mistralai';

const apiKey = process.env.MISTRAL_API_KEY;

const client = new Mistral({apiKey: apiKey});

/**
 * @param {string} question 
 * @returns {Promise<string|string[]?>}
 */
export async function llmComplete(question) {
    const chatResponse = await client.chat.complete({
        model: 'mistral-large-latest',
        messages: [{role: 'user', content: question}],
    });
    let response = chatResponse?.choices?.[0]?.message?.content ?? null;
    if (response instanceof Array)
        return response.map(chunk =>
            "text" in chunk ? chunk.text
            : "imageUrl" in chunk ? (typeof chunk.imageUrl == "string" ? chunk.imageUrl : chunk.imageUrl.url)
            : "documentUrl" in chunk ? chunk.documentUrl : "");
    return response;
}

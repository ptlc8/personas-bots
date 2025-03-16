import { Mistral } from '@mistralai/mistralai';

const apiKey = process.env.MISTRAL_API_KEY;

const client = new Mistral({ apiKey: apiKey });

var lastAPICallTime = 0;

/**
 * @param {string} question 
 * @returns {Promise<string|string[]?>}
 */
export async function llmComplete(question) {
    while (Date.now() - lastAPICallTime < 1200) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    lastAPICallTime = Date.now();
    var chatResponse;
    do try {
        chatResponse = await client.chat.complete({
            model: 'mistral-large-latest',
            messages: [{ role: 'user', content: question }],
        });
    } catch (e) {
        continue;
    } while (false);
    let response = chatResponse?.choices?.[0]?.message?.content ?? null;
    if (response instanceof Array)
        return response.map(chunk =>
            "text" in chunk ? chunk.text
            : "imageUrl" in chunk ? (typeof chunk.imageUrl == "string" ? chunk.imageUrl : chunk.imageUrl.url)
            : "documentUrl" in chunk ? chunk.documentUrl : "");
    return response;
}

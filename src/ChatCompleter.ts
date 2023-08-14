import { ChatCompletionRequestMessage, Configuration, OpenAIApi, ChatCompletionRequestMessageRoleEnum } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const { Assistant, User } = ChatCompletionRequestMessageRoleEnum;

export abstract class ChatCompleter {
    private static openai: OpenAIApi = new OpenAIApi(new Configuration({apiKey: process.env.API_KEY}));
    private static model: string = 'gpt-3.5-turbo';
    private static messages: ChatCompletionRequestMessage[] = [];

    /*
    * The following function is used to generate a response from the OpenAI API.
    *
    * The function takes in an array of messages, which are objects with a role
    * and content property. The role property is either 'Assistant' or 'User' and
    * the content property is the message that the role is sending.
    *
    * The function returns a string, which is the response from the OpenAI API.
    */
    static async generateGptResponse(content: string, resetMessages: boolean = false): Promise<{ response: string; error: boolean }> {
        const chatCompleterResponse = {
            response: '',
            error: false
        };

        if (resetMessages) {
            ChatCompleter.messages = [];
        }

        try {
            ChatCompleter.messages.push({ role: User, content });
            const response = await ChatCompleter.openai.createChatCompletion({
                model: ChatCompleter.model,
                messages: ChatCompleter.messages,
                temperature: 0.5
            });

            if (response.data.choices[0].message && response.data.choices[0].message.content) {
                const responseContent = response.data.choices[0].message.content;
                ChatCompleter.messages.push({ role: Assistant, content: responseContent });
                chatCompleterResponse.response = responseContent;
            } else {
                const responseContent = 'The message or content property is undefined';
                console.error(responseContent);
                chatCompleterResponse.response = responseContent;
                chatCompleterResponse.error = true;
            }
            return chatCompleterResponse;
        } catch (error: any) {
            if (error.response) {
                const { status, data } = error.response;
                const errorMessage = `Error with OpenAI API request: ${status}, ${data.error.message}`;
                console.error(errorMessage);
                if (status === 429) {
                    console.log('Retrying...');
                    await new Promise(resolve => setTimeout(resolve, 20000)); // due to rate limits wait 20 seconds before making API request
                    return await this.generateGptResponse(content);
                } else {
                    chatCompleterResponse.response = errorMessage;
                    chatCompleterResponse.error = true;
                }
            } else {
                const errorMessage = `Error with OpenAI API request: ${error.message}`;
                console.error(errorMessage);
                chatCompleterResponse.response = errorMessage;
                chatCompleterResponse.error = true;
            }
            return chatCompleterResponse;
        }
    }
}

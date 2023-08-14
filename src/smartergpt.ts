import dotenv from 'dotenv';
import { ChatCompleter } from './ChatCompleter.js';

dotenv.config();

interface SmartGptResponse {
    responses: string;
    researcherResponse: string;
    resolverResponse: string;
}

/*
* The following function is used to send a request to the OpenAI API with a
* formatted question to try and get a better response from the OpenAI API.
*
* The function takes in a question and an optional numberOfRequests parameter.
* The numberOfRequests parameter is the number of requests that the user wants
* to send to the OpenAI API.
* 
* The function returns a string, which are the responses from the OpenAI API.
* The response is a concatenation of the responses from the OpenAI API.
* The responses are separated by two newlines.
* 
* The function also updates the messages array with the messages that were sent
* to the OpenAI API.
*/
const sendFormattedRequest = async (question: string, numberOfRequests: number = 3): Promise<{ response: string; error: boolean }> => {
    const formattedQuestion = `Question: ${question}\n\n
    Let's work this out in a step by step way to be sure we have the right answer.`

    const responses: string[] = [];
    let error = false;
    for (let i = 0; responses.length < numberOfRequests; i++) {
        const resetMessages = i == 0; // only reset messages on first request
        const { response, error: singleError } = await ChatCompleter.generateGptResponse(formattedQuestion, resetMessages);
        if (singleError) {
            error = true;
        }
        responses.push(`Answer ${i + 1}:\n${response}`);
    }
    
    return {
        response: responses.join('\n\n'),
        error
    };
};

/*
* The following function is used to send a request to the OpenAI API with a
* researcher prompt to try and list any flaws in the original responses.
*
* The function takes in a question and responses. The question is the question
* that the user wants to ask the OpenAI API. The responses are the responses
* received from the initial requests to the OpenAI API.
*
* The function returns a string, which is the response from the OpenAI API with
* any flaws from the previous responses.
*
* The function also updates the messages array with the messages that were sent
* to and received from the OpenAI API.
*/
const sendResearcherRequest = async (question: string, responses: string): Promise<{ response: string; error: boolean }> => {
    const researcherPrompt = `Question: ${question}\n\n
    ${responses}\n\n}
    You are a researcher tasked with investigating the three given answers above. List the logical flaws, if there are any, in each answer. Let's work this out in a step by step way to be sure we have all the errors.`

    return await ChatCompleter.generateGptResponse(researcherPrompt);
};

/*
* The following function is used to send a request to the OpenAI API with a
* resolver prompt to try and which of the original responses was the best and
* using the response from the researcher request to try and improve on that
* response.
*
* The function takes in a researcherResponse, which is the response from the
* OpenAI API listing any flaws from the previous responses.
*
* The function returns a string, which is the response from the OpenAI API with
* the improved responses.
*
* The function also updates the messages array with the messages that were sent
* to and received from the OpenAI API.
*/
const sendResolverRequest = async (): Promise<{ response: string; error: boolean }> => {
    const resolverPrompt = `You are a resolver tasked with\n
    1. Deciding which of the answers was best based on the researcher's feedback\n
    2. Improving that answer\n
    3. Printing the improved answer in full\n\n
    Let's work this out in a step by step way to be sure we have the right answer.`

    return await ChatCompleter.generateGptResponse(resolverPrompt);
};

/*
* The following function is used to send a set of requests to the OpenAI API with
* to try and get a better response for the given question from the OpenAI API.
*
* The function takes in a question, which is the question that the user wants
* to ask the OpenAI API.
*
* The function returns a SmartGptResponse, which is an object with the following
* properties:
*   - responses: a string, which is the response from the OpenAI API with the
*     initial responses from the OpenAI API.
*   - researcherResponse: a string, which is the response from the OpenAI API
*     listing any flaws from the previous responses.
*   - resolverResponse: a string, which is the response chosen from the OpenAI API
*     as the best, including improvements, if any, from the researcher feedback.
*/
export const sendSmartRequests = async (question: string): Promise<SmartGptResponse> => {
    if (!process.env.API_KEY) {
        console.error('OpenAI API key not configured');
        return {
            responses: 'OpenAI API key not configured',
            researcherResponse: 'OpenAI API key not configured',
            resolverResponse: 'OpenAI API key not configured'
        };
    }

    const responses = await sendFormattedRequest(question);
    if (responses.error) {
        return {
            responses: responses.response,
            researcherResponse: '',
            resolverResponse: ''
        };
    }
    const researcherResponse = await sendResearcherRequest(question, responses.response);
    if (researcherResponse.error) {
        return {
            responses: responses.response,
            researcherResponse: researcherResponse.response,
            resolverResponse: ''
        };
    }
    const resolverResponse = await sendResolverRequest();

    return {
        responses: responses.response,
        researcherResponse: researcherResponse.response,
        resolverResponse: resolverResponse.response
    };
};

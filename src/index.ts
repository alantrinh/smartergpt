import express from 'express';
import { sendSmartRequests } from './smartergpt.js';

const app = express();
const PORT = 8080;

app.use(express.json());

app.post('/conversation', async (req, res) => {
    const { question } = req.body;

    if (question.trim().length === 0) {
        return res.status(418).send({ question: 'Please send a valid question' });
    }

    const result = await sendSmartRequests(question);

    res.send({
        result
    });
});

app.listen(
    PORT,
    () => console.log(`Server running on port ${PORT}`)
);

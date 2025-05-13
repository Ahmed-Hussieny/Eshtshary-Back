import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import { initiateApp } from './src/initiate-app.js';
config();
const app = express();
app.use(cors());
initiateApp({ app, express });
app.get('/', (req, res) => {
    res.send('Welcome to the API');
});



app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});
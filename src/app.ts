import express from 'express';
import { toNodeHandler } from "better-auth/node";
import { auth } from './lib/auth';
import cors from 'cors';
const app = express();
app.use(cors({
    origin: process.env.APP_URL || "http://localhost:4000",
    credentials: true,
}))

app.all('/api/auth/{*any}', toNodeHandler(auth));

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

export default app;
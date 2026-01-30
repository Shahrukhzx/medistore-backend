import express from 'express';
import { toNodeHandler } from "better-auth/node";
import { auth } from './lib/auth';
import cors from 'cors';
import { CategoryRouter } from './modules/category/category.router';
import { MedicineRouter } from './modules/medicine/medicine.router';
import { OrderRouter } from './modules/order/order.router';

const app = express();
app.use(cors({
    origin: process.env.APP_URL || "http://localhost:4000",
    credentials: true,
}))

app.all('/api/auth/{*any}', toNodeHandler(auth));
app.use(express.json());
//Category Routes
app.use("/api/categories", CategoryRouter)
//Medicine Routes
app.use("/api/medicines", MedicineRouter)
//Order Routes
app.use("/api/orders", OrderRouter)

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

export default app;
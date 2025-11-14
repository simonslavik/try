import express from 'express';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import logger from './utils/logger.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.listen(PORT, () => {
    logger.info(`User Service is running on port ${PORT}`);
})
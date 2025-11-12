import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import helmet from 'helmet';
import errorHandler from './middleware/errorHandler.js';



dotenv.config();

const app: Express = express();
const PORT: number = Number(process.env.PORT) || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());



app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API Gateway is running' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Gateway is running on port ${PORT}`);
});
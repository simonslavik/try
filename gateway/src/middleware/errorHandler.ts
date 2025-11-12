import logger from "../utils/logger.js";
import { Request, Response, NextFunction} from "express";

const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(err.stack);

  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
};

export default errorHandler;
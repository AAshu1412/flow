import { Request, Response, NextFunction } from "express";

const errorMiddleWare = (err: any, req: Request, res: Response, next: NextFunction) => {

    const status = err.status || 500;
    const message = err.message || "Backend Error";
    const extraDetails = err.extraDetails || "Error from backend";

    return res.status(status).json({message,extraDetails});
};

export default errorMiddleWare;
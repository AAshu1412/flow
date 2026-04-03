// types.d.ts
import { Request } from "express";

declare global {
  namespace Express {
    export interface Request {
      username?: any; 
      userID?: any;
      user?: any; 
    }
  }
}
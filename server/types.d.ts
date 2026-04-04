// types.d.ts
import { Request } from "express";
import { User } from "./types/user-type";

declare global {
  namespace Express {
    export interface Request {
      userID: string;
      user: User;
      db_doc_id: any; 
    }
  }
}
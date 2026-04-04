// types.d.ts
import { Request } from "express";
import { Req } from "./types/user-type";

declare global {
  namespace Express {
    export interface Request extends Req {}
  }
}
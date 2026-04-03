import { Request } from "express";

interface AuthRequest extends Request {
  userID?: string;
  username?: string
}


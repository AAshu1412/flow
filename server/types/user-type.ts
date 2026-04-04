import { JwtPayload } from "jsonwebtoken";


export interface GoogleOauth {
    access_token: string;
    refresh_token: string;
    token_type: string;
    access_token_expires_in: number;
}

export interface IUser extends Document {
  google_id: string;
  email: string;
  name: string;
  picture: string;
  google_oauth: GoogleOauth;
}

export interface User {
    google_id: string;
    email: string;
    name: string;
    picture: string;
}


export interface CustomJwtPayload extends JwtPayload {
    google_id: string;
    email: string;
}

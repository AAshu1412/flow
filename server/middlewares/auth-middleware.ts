import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/user-model";
import {Request,Response,NextFunction} from "express";
import { CustomJwtPayload } from "../types/user-type";


const authMiddleware = async (req:Request, res:Response, next:NextFunction) => {
  const token = req.header("Authorization");

  if (!token) {
    return res
      .status(401)
      .json({ msg: "Unauthorization HTTP, Token not provided" });
  }

  const jwtToken = token.replace("Bearer", "").trim();
  console.log(
    "\n\n########## *******Token form auth middleware******* ##############\n\n"
  );
  console.log("Token form auth middleware : " + jwtToken);

  try {
    const secretKey=process.env.JWT_SECRET_KEY;
    if(!secretKey){
        return res.status(500).json({ msg: "Internal Server Error: JWT secret key not found" });
    }
    const isVerified = jwt.verify(jwtToken, secretKey) as CustomJwtPayload;
    console.log("Decoded JWT Payload:", isVerified);
    
    const userData = await User.findOne({
      google_id: isVerified.google_id,
      email: isVerified.email,
    });
    // .select('-access_token -access_token_expires_in -refresh_token -refresh_token_expires_in -token_type');

    if (!userData) {
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }

    console.log("Data after verifying:", userData);

    req.userID = userData.google_id;
    req.user = {google_id: userData.google_id, email: userData.email, name: userData.name, picture: userData.picture};
    

    next();
    console.log(
      "\n\n########################################################\n\n"
    );
  } catch (error: any) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({ message: "Unauthorized: Invalid token." });
  }
};

export default authMiddleware;

import {Request,Response} from "express";
import passport from "passport";

// const google_authenticate = async (req: Request, res: Response) => {
//     try {
//         const response = await passport.authenticate('google');
//         console.log(response);

//         return res.status(200).json({status_response: 200, data: response });
//     }
//     catch (error: any) {
//         res.status(500).send({ status_response: 500, error: error.message });
//     }
// }

const google_authenticate = passport.authenticate('google');



export default { google_authenticate };
import {User} from "../models/user-model";
import bcrypt from "bcryptjs";
import {Request,Response} from "express";


// const register = async (req:Request, res:Response) => {
//     try {
//         console.log(req.body)
//         const { username, email, phone, password } = req.body;


//         const userExist = await User.findOne({ email });
//         if (userExist) {
//             return res.status(500).json({ msg: "email already exists" });

//         }

//         const userCreated = await User.create({ username, email, phone, password });

//         res.status(201).json({ msg: userCreated, token: await userCreated.generateToken(), userId: userCreated._id.toString() });
//     }
//     catch (error) {

//         res.status(500).json("register not found");


//     }
// }

// const login = async (req, res) => {
//     try {
//         const { email, password } = req.body;

//         const userExist = await User.findOne({ email });
//         console.log(`This is the LOGIN in auth-controllers == ${userExist}`);
//         if (!userExist) {
//             return res.status(500).json({ msg: "invalid credential" });

//         }

//         const user = await bcrypt.compare(password, userExist.password);

//         if (user) {
//             res.status(200).json({ msg: "Login successfull", token: await userExist.generateToken(), userId: userExist._id.toString() });
//         }
//         else {
//             return res.status(401).json({ msg: "invalid email or password" });
//         }

//     }
//     catch (error) {
//         res.status(500).send({ msg: "login error" });
//     }
// }


///////////////////////////////////////////////////////////////////////////////////////////////

  // const tokenResponse = await fetch(
  //     "https://github.com/login/oauth/access_token",
  //     {
  //       method: "POST",
  //       headers: {
  //         Accept: "application/json",
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         client_id: process.env.GITHUB_CLIENT_ID,
  //         client_secret: process.env.GITHUB_CLIENT_SECRET,
  //         code,
  //       }),
  //     }
  //   );

  //  const userResponse = await fetch("https://api.github.com/user", {
  //     headers: {
  //       Authorization: `Bearer ${access_token}`,
  //       Accept: "application/json",
  //     },
  //   });

  //    const userRepoResponse = await fetch(
  //     `https://api.github.com/users/${userData.username}/repos`,
  //     {
  //       headers: {
  //         Authorization: `Bearer ${access_token}`,
  //         Accept: "application/json",
  //       },
  //     }
  //   );
///////////////////////////////////////////////////////////////////////////////////////////////



const user = async (req: Request, res: Response) => {
    try {
        const userData = req.user;
        console.log(userData);

        return res.status(200).json({status_response: 200, data: userData });
    }
    catch (error: any) {
        res.status(500).send({ status_response: 500, error: error.message });
    }
}













export default { user };

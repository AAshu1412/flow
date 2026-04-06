import {User} from "../models/user-model";
import bcrypt from "bcryptjs";
import {Request,Response} from "express";
import {getUserWithAllConnections} from "../utils/useless-rn/db-func";
import { SERVICE_OPERATIONS } from "../constants";
import { getNodeProfileForFrontend } from "../nodes/node_helper";

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
        const UserId = req.db_doc_id;
        console.log(UserId);

        const userData = await getUserWithAllConnections(UserId);

        return res.status(200).json({status_response: 200, data: userData });
    }
    catch (error: any) {
        res.status(500).send({ status_response: 500, error: error.message });
    }
}


const getAvailableNodesMenu = (req: Request, res: Response) => {
    try {
        // Dynamically build the categorized menu
        const menu = [
            {
                category: "General Nodes",
                services: [
                    {
                        service: "core",
                        label: "Core Components", // Friendly name for the UI
                        operations: SERVICE_OPERATIONS.core
                    }
                ]
            },
            {
                category: "LLM Nodes",
                services: [
                    {
                        service: "gemini",
                        label: "Google Gemini",
                        operations: SERVICE_OPERATIONS.gemini
                    }
                ]
            },
            {
                category: "Service Nodes",
                // Filter out the ones we already used, map the rest dynamically
                services: Object.keys(SERVICE_OPERATIONS)
                    .filter(key => key !== "core" && key !== "gemini")
                    .map(key => {
                        return {
                            service: key,
                            // Optional: Make names look pretty in UI (e.g., "google_docs" -> "Google Docs")
                            label: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                            operations: SERVICE_OPERATIONS[key as keyof typeof SERVICE_OPERATIONS]
                        };
                    })
            }
        ];

        return res.status(200).json({ 
            message: "Menu fetched successfully", 
            data: menu 
        });

    } catch (error: any) {
        console.error("[API ERROR] Failed to generate node menu:", error);
        return res.status(500).json({ 
            message: "Failed to generate node menu", 
            error: error.message 
        });
    }
};



const getNodeProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.db_doc_id; 
        const { service, operation } = req.body;

        if (!service || !operation) {
            return res.status(400).json({ 
                message: "Both 'service' and 'operation' query parameters are required." 
            });
        }

        const profile = await getNodeProfileForFrontend(
            service as string, 
            operation as string, 
            userId
        );

        return res.status(200).json({
            message: "Node profile fetched successfully",
            data: profile
        });

    } catch (error: any) {
        console.error("\n[API ERROR] Failed to fetch node profile:", error);
        
        const statusCode = error.message.includes("Node not found") ? 404 : 500;
        
        return res.status(statusCode).json({ 
            message: "Failed to fetch node profile", 
            error: error.message 
        });
    }
};


export default { user , getAvailableNodesMenu, getNodeProfile};

import { Request, Response } from "express";
import { Waitlist } from "../models/waitlist-model";
import { User } from "../models/user-model";

const waitlist_request = async (req: Request, res: Response) => {
    try {
        const {email} = req.body;
        
        if(!email){
            return res.status(400).json({ status_response: 400, message:"Email is required" });
        }

        const existingUser = await User.findOne({ email });
        const existingWaitlist = await Waitlist.findOne({ email });

        if(existingUser || existingWaitlist){
            return res.status(409).json({ status_response: 409, message:"Email already exists" });
        }

        const waitlist = new Waitlist({ email });
        await waitlist.save();

        return res.status(200).json({ status_response: 200, message:"Request added to waitlist" });

    } catch (error: any) {
        console.error("\n[ERROR] Exception caught in waitlist_request:");
        console.error(error.message || error);
        
        return res.status(500).json({ 
            message: "Failed to add request to waitlist", 
            error: error.message 
        });
    }
}


export default { waitlist_request };
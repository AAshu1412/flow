import { Schema, model, Document, Types } from "mongoose";
import { IWaitlist } from "../types/waitlist-type";


const waitlistSchema = new Schema({
    email: { type: String, required: true },
    

}, { timestamps: true });

const Waitlist = model<IWaitlist>('Waitlist', waitlistSchema);

export {Waitlist};

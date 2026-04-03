import { model, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// const DeployedRepoSchema = new Schema({
//     repo_url: {
//       type: String,
//       required: true
//     },
//     subDirectory: {
//       type: String,
//       required: false,
//       default: null
//     },
//     branch: {
//       type: String,
//       required: true
//     },
//     email: {
//       type: String,
//       required: false,
//       default: null
//     },
//     username: {
//       type: String,
//       required: true
//     },
//     id: {
//       type: Number,
//       required: true
//     },
//     hosted_site_url: {
//       type: String,
//       required: true
//     },
//     status: {
//       type: String,
//       required: true,
//       lowercase: true,
//       enum: ['pending', 'building', 'success', 'failed','failure'] // Optional validation
//     },
//     build_number: {
//       type: Number,
//       required: true
//     },
//     created_at: {
//       type: Number,
//       required: true // Unix timestamp
//     },
//     updated_at: {
//       type: Number,
//       required: true // Unix timestamp
//     },
//     number_of_builds: {
//       type: [{build: Number, created_at: Number, status: String}],
//       required: true,
//       default: []
//     }
//   }
// //   , {
// //  //   timestamps: true // Optional: createdAt, updatedAt
// //   }
// );


// const userSchema = new Schema({
//     access_token: {
//         type: String,
//         require: true,
//     },
//     access_token_expires_in: {
//         type: Number,
//         require: true,
//     },
//     refresh_token: {
//         type: String,
//         require: false,
//     },
//     refresh_token_expires_in: {
//         type: Number,
//         require: false,
//     },
//     token_type: {
//         type: String,
//         require: true,
//     },
//     username: {
//         type: String,
//         require: true,
//     },
//     id: {
//         type: Number,
//         require: true,
//     },
//     email: {
//         type: String,
//         require: false,
//     },
//     has_completed_onboarding: {
//         type: Boolean,
//         default: false,
//         require: true,
//     },
//     created_at: {
//         type: Number,
//         require: true,
//     }, 
//     updated_at: {
//         type: Number,
//         require: true,
//     }, 
//     isAdmin: {
//         type: Boolean,
//         default: false,
//         require: true,
//     },
//     user: {
//         username: {
//             type: String,
//             require: true,
//         },
//         id: {
//             type: Number,
//             require: true,
//         },
//         node_id: {
//             type: String,
//             require: true,
//         },
//         email: {
//             type: String,
//             require: false,
//         },
//         type: {
//             type: String,
//             require: true,
//         },
//         name: {
//             type: String,
//             require: true,
//         },
//         user_view_type: {
//             type: String,
//             require: true,
//         },
//         bio: {
//             type: String,
//             require: false,
//         },
//         location: {
//             type: String,
//             require: false,
//         }
//         ,
//         notification_email: {
//             type: String,
//             require: false,
//         },
//         avatar_url: {
//             type: String,
//             require: false,
//         },
//         html_url: {
//             type: String,
//             require: true,
//         },
//     },
//     repos:{
//         type: [DeployedRepoSchema],
//         require: false,
//     }
// });

const userSchema = new Schema({
    username: {
        type: String,
        require: true,
    }

})

interface IUser extends Document {
  username: string;
  
}

userSchema.methods.generateToken = function () {
    try {
        const secret = process.env.JWT_SECRET_KEY!;  // ✅ Non-null assertion
        if (!secret) throw new Error('JWT_SECRET_KEY missing');
        return jwt.sign(
            // { username: this.username, userID: this._id.toString(), userGithubID: this.id, email: this.email || null, isAdmin: this.isAdmin, userAccessTokens: this.access_token, userAccessTokensExpiresIn: this.access_token_expires_in },
            {username: this.username},
            secret,
            { expiresIn: "30d" })
    } catch (error) {
        console.error(error);
    }
};



const User: Model<IUser> = model<IUser>('User', userSchema);
// const UserBuilds = mongoose.model('UserBuilds', userBuildsSchema);


export default  User ;

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const DeployedRepoSchema = new mongoose.Schema({
    repo_url: {
      type: String,
      required: true
    },
    subDirectory: {
      type: String,
      required: false,
      default: null
    },
    branch: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: false,
      default: null
    },
    username: {
      type: String,
      required: true
    },
    id: {
      type: Number,
      required: true
    },
    hosted_site_url: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true,
      lowercase: true,
      enum: ['pending', 'building', 'success', 'failed','failure'] // Optional validation
    },
    build_number: {
      type: Number,
      required: true
    },
    created_at: {
      type: Number,
      required: true // Unix timestamp
    },
    updated_at: {
      type: Number,
      required: true // Unix timestamp
    },
    number_of_builds: {
      type: [{build: Number, created_at: Number, status: String}],
      required: true,
      default: []
    }
  }
//   , {
//  //   timestamps: true // Optional: createdAt, updatedAt
//   }
);
  

const userSchema = new mongoose.Schema({
    access_token: {
        type: String,
        require: true,
    },
    access_token_expires_in: {
        type: Number,
        require: true,
    },
    refresh_token: {
        type: String,
        require: false,
    },
    refresh_token_expires_in: {
        type: Number,
        require: false,
    },
    token_type: {
        type: String,
        require: true,
    },
    username: {
        type: String,
        require: true,
    },
    id: {
        type: Number,
        require: true,
    },
    email: {
        type: String,
        require: false,
    },
    has_completed_onboarding: {
        type: Boolean,
        default: false,
        require: true,
    },
    created_at: {
        type: Number,
        require: true,
    }, 
    updated_at: {
        type: Number,
        require: true,
    }, 
    isAdmin: {
        type: Boolean,
        default: false,
        require: true,
    },
    user: {
        username: {
            type: String,
            require: true,
        },
        id: {
            type: Number,
            require: true,
        },
        node_id: {
            type: String,
            require: true,
        },
        email: {
            type: String,
            require: false,
        },
        type: {
            type: String,
            require: true,
        },
        name: {
            type: String,
            require: true,
        },
        user_view_type: {
            type: String,
            require: true,
        },
        bio: {
            type: String,
            require: false,
        },
        location: {
            type: String,
            require: false,
        }
        ,
        notification_email: {
            type: String,
            require: false,
        },
        avatar_url: {
            type: String,
            require: false,
        },
        html_url: {
            type: String,
            require: true,
        },
    },
    repos:{
        type: [DeployedRepoSchema],
        require: false,
    }
});

// const userBuildsSchema = new mongoose.Schema({
//     username: {
//         type: String,
//         require: true,
//     },
//     id: {
//         type: Number,
//         require: true,
//     },
//     repo_url: {
//         type: String,
//         required: true
//       },
//       hosted_site_url: {
//         type: String,
//         required: false,
//         default: null
//       },
//       builds: [{
//         type: DeployedRepoSchema,
//         discriminatorKey: 'kind', // ✅ Separate collections
//         collection: 'userBuilds_builds' // ✅ Separate table
//       }]
//     });
    
//     const UserBuildRepo = userBuildsSchema.discriminator(
//       'UserBuildRepo',
//       new mongoose.Schema({
//         build_logs: {
//           type: String,
//           required: false,
//           default: null
//         },
//       })
//     );
    

// userSchema.pre("save", async function (next) {
//     console.log(this);
//     const user = this;

//     if (!user.isModified("password")) {
//         next();
//     }

//     try {

//         const saltRound = await bcrypt.genSalt(10);
//         const hash_password = await bcrypt.hash(user.password, saltRound);
//         user.password = hash_password;
//     }
//     catch (error) {
//         next(error);
//     }
// });


userSchema.methods.generateToken = function () {
    try {
        return jwt.sign(
            { username: this.username, userID: this._id.toString(),userGithubID: this.id, email: this.email || null, isAdmin: this.isAdmin, userAccessTokens: this.access_token, userAccessTokensExpiresIn: this.access_token_expires_in},
            process.env.JWT_SECRET_KEY,
            { expiresIn: "30d" })
    } catch (error) {
        console.error(error);
    }
};



const User = new mongoose.model("User", userSchema);
// const UserBuilds = mongoose.model('UserBuilds', userBuildsSchema);


module.exports = { User };

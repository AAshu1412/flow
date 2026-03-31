const {z}= require("zod");

// const loginSchema=z.object({

//     email:z.email({required_error:"email is required"})
//     .trim()
//     .min(3,{message:"email must be of atleast 3 characters"})
//     .max(255,{message:"email must not be more than 255 characters"}),

//     password:z.string({required_error:"Password is required"})
//     .min(7,{message:"Password must be of atleast 7 characters"})
//     .max(1024,{message:"Password must not be more than 1024 characters"}),
// });

// const signupSchema=loginSchema.extend({
//     username:z.string({required_error:"Name is required"})
//     .trim()
//     .min(3,{message:"Name must be of atleast 3 characters"})
//     .max(255,{message:"Name must not be more than 255 characters"}),

//     phone:z.string({required_error:"Phone is required"})
//     .trim()
//     .min(10,{message:"Phone must be of atleast 10 characters"})
//     .max(20,{message:"Phone must not be more than 20 characters"}),

// });

const emailSchema=z.object({
    email:z.email({required_error:"email is required"})
    .trim()
    .min(3,{message:"email must be of atleast 3 characters"})
    .max(255,{message:"email must not be more than 255 characters"}),
});

const repoNameSchema=z.object({
    repo_name:z.string({required_error:"repo name is required"})
    .trim()
    .min(1,{message:"repo name must be of atleast 1 character"})
});

const repoContentSchema= repoNameSchema.extend({
    path:z.string({required_error:"path is required"})
    .trim()
    .min(1,{message:"path must be of atleast 1 character"})
});

module.exports={emailSchema,repoNameSchema,repoContentSchema};
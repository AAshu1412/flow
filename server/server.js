require("dotenv").config();  
const express=require("express");
const cors=require("cors");
const app=express();
const githubAuthRouter=require("./router/github-auth-router");
const jenkinsRouter=require("./router/jenkins-router");
const authRouter=require("./router/auth-router");
const webhookRouter=require("./router/webhook-router");
const { FRONTEND_URLS } = require("./constants");
const connectDb = require("./utils/db");
const errorMiddleWare = require("./middlewares/error-middleware");

// const configuredOrigins = process.env.CLIENT_URLS
//     ? process.env.CLIENT_URLS.split(",").map((origin) => origin.trim()).filter(Boolean)
//     : process.env.FRONTEND_URL
//         ? [process.env.FRONTEND_URL.trim()]
//         : [];

// const allowedOrigins = new Set([
//     ...FRONTEND_URLS,
//     ...configuredOrigins,
// ]);

const corsOptions={
    origin:"http://localhost:5173",
    methods:"GET,POST,PUT ,DELETE,PATCH,HEAD,OPTIONS",
    credentials:true
}
app.use(cors(corsOptions));
// app.options(/.*/, cors(corsOptions));
app.use(express.json());

app.use("/api/auth",authRouter);


app.use(errorMiddleWare);

const PORT = Number(process.env.PORT) || 5001;

connectDb().then(()=>{
    app.listen(PORT,()=>{
        console.log(`Port is running at ${PORT}`);
    })
});

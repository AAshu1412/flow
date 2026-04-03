import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
const app=express();
import authRouter from "./router/auth-router";
import oauth2Router from "./router/oauth2-router";
import oauth2RedirectRouter from "./router/oauth2-redirect-router";
import { FRONTEND_URLS } from "./constants";
import connectDb from "./utils/db";
import errorMiddleWare from "./middlewares/error-middleware";
import passport from "passport";
import "./strategies/google-strategy.mjs";

// const configuredOrigins = process.env.CLIENT_URLS
//     ? process.env.CLIENT_URLS.split(",").map((origin) => origin.trim()).filter(Boolean)
//     : process.env.FRONTEND_URL
//         ? [process.env.FRONTEND_URL.trim()]
//         : [];

// const allowedOrigins = new Set([
//     ...FRONTEND_URLS,
//     ...configuredOrigins,
// ]);
app.use(session({ secret: process.env.PASSPORT_SECRET!, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

const corsOptions={
    origin:"http://localhost:5173",
    methods:"GET,POST,PUT ,DELETE,PATCH,HEAD,OPTIONS",
    credentials:true
}
app.use(cors(corsOptions));
// app.options(/.*/, cors(corsOptions));
app.use(express.json());

app.use("/api/profile",authRouter);
app.use("/api/auth",oauth2Router);
app.use("/api/auth",oauth2RedirectRouter);

app.use(errorMiddleWare);

const PORT = Number(process.env.PORT) || 5001;

connectDb().then(()=>{
    app.listen(PORT,()=>{
        console.log(`Port is running at ${PORT}`);
    })
});

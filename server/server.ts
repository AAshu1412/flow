import "dotenv/config";
import express from "express";
import cors from "cors";
const app=express();
import authRouter from "./router/auth-router";
import oauth2Router from "./router/oauth2-router";
import oauth2RedirectRouter from "./router/oauth2-redirect-router";
import node_test_router from "./router/node_test-router";
import workflow_router from "./router/workflow-router";
import waitlist_router from "./router/waitlist-router";
import { FRONTEND_URLS } from "./constants";
import connectDb from "./utils/db/db";
import errorMiddleWare from "./middlewares/error-middleware";


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
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods:"GET,POST,PUT ,DELETE,PATCH,HEAD,OPTIONS",
    credentials:true
}
app.use(cors(corsOptions));
// app.options(/.*/, cors(corsOptions));
app.use(express.json());


app.use("/api/profile",authRouter);
app.use("/api/auth",oauth2Router);
app.use("/api/auth",oauth2RedirectRouter);
app.use("/api/node_test",node_test_router);
app.use("/api/workflow",workflow_router);
app.use("/api/waitlist",waitlist_router);

app.use(errorMiddleWare);

const PORT = Number(process.env.PORT) || 5001;

connectDb().then(()=>{
    app.listen(PORT,()=>{
        console.log(`Port is running at ${PORT}`);
    })
});

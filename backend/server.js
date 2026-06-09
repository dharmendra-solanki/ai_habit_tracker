import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import {notFound, errorHandler} from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import habitRoutes from "./routes/habits.js";
import logRoutes from "./routes/logs.js"
import aiRoutes from './routes/ai.js'

const app = express();


// const allowedOrigins = (process.env.CLIENT_URL || "")
//     .split(",")
//     .map((s) => s.trim())
//     .filter(Boolean);


// const corsOptions = {
//     origin(origin, cb){
//         // Allow requests with no origin (curl , same origin , servers-to-servers)
//         if(!origin) return cb(null, true);
//         // Allow any localhost 127.0.0.1 origin in development
//         if(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)){
//             return cb(null, true);
//         }
//         // Allow anything explicitly listed in CLIENT_URL
//         if(allowedOrigins.includes(origin)){
//             return cb(null, true);
//         }
//         // Otherwise , reject
//         cb(new Error("Not allowed by CORS"));
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
// };

// app.use(cors(corsOptions));
// app.options("*", cors(corsOptions));
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Habit Tracker API is running"
    });
});

app.get("/api/health", (req, res) =>
    res.json({status: "ok", timestamp: new Date().toISOString()})
);

app.use("/api/auth", authRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/ai",aiRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 8000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on  http://localhost:${PORT}`);
    });
}).catch((error) => {
    console.error("Failed to connect to database:", error.message);
    process.exit(1);
});
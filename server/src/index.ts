// Imports
import http from "http";
import express from "express";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import userRoutes from "./routes/userRoutes";
import marketRoutes from "./routes/marketRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import portfolioRoutes from './routes/portfolioRoutes';
import leaderboardRoutes from './routes/leaderboardRoutes';
import notificationRoutes from "./routes/notificationRoutes";
import socialRoutes from "./routes/socialRoutes";
import adminRoutes from "./routes/adminRoutes";
import adminConflictRoutes from "./routes/adminConflictRoutes";
import adminAnalyticsRoutes from "./routes/adminAnalyticsRoutes";
import { initializeRealtimeEmitter } from "./services/realtimeService";

const DEFAULT_ALLOWED_ORIGINS = [
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'http://localhost:19006',
    'http://127.0.0.1:19006',
];

const allowedOrigins = (() => {
    const configured = (process.env.CORS_ORIGINS ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (configured.length > 0) {
        return configured;
    }

    return DEFAULT_ALLOWED_ORIGINS;
})();

const isPrivateLanHost = (host: string) => {
    return /^10\./.test(host)
        || /^192\.168\./.test(host)
        || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
};

const isAllowedOrigin = (origin: string) => {
    if (allowedOrigins.includes(origin)) {
        return true;
    }

    try {
        const parsed = new URL(origin);
        const host = parsed.hostname;

        if (host === 'localhost' || host === '127.0.0.1') {
            return true;
        }

        if (process.env.NODE_ENV !== 'production' && isPrivateLanHost(host)) {
            return true;
        }
    } catch {
        return false;
    }

    return false;
};

const corsOriginHandler = (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    // Allow non-browser and local mobile dev calls while blocking unknown web origins.
    if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
        return;
    }

    callback(new Error('CORS origin not allowed'));
};

// Server
const app = express();
app.use(express.json());
app.use(cors({
    origin: corsOriginHandler,
    credentials: true,
}));
const server = http.createServer(app);

const io = new SocketIOServer(server, {
    cors: {
        origin: corsOriginHandler,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

io.on('connection', (socket) => {
    socket.on('subscribe', (channels: unknown) => {
        if (!Array.isArray(channels)) {
            return;
        }

        for (const channel of channels) {
            if (typeof channel === 'string' && channel.trim()) {
                socket.join(channel);
            }
        }
    });

    socket.on('unsubscribe', (channels: unknown) => {
        if (!Array.isArray(channels)) {
            return;
        }

        for (const channel of channels) {
            if (typeof channel === 'string' && channel.trim()) {
                socket.leave(channel);
            }
        }
    });
});

initializeRealtimeEmitter((event, payload) => {
    io.to(event).emit(event, payload);
});

// Root Route
app.get("/", (req, res) => {
    res.send("Prophetize is online!");
});

// Routes - connect routes to server
app.use("/auth", userRoutes);
app.use("/markets", marketRoutes);
app.use("/transaction", transactionRoutes);
app.use('/portfolio', portfolioRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use("/notifications", notificationRoutes);
app.use("/social", socialRoutes);
app.use('/admin', adminRoutes);
app.use('/admin', adminConflictRoutes);
app.use('/admin', adminAnalyticsRoutes);

// Starting server
const PORT = process.env.PORT || 3000;

// EADDRINUSE error handler — prints PID and kill command when port is occupied
server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
        const isWin = process.platform === 'win32';
        console.error(`\n✖ Port ${PORT} is already in use.`);
        try {
            const pidCmd = isWin
                ? `netstat -ano | findstr :${PORT}`
                : `lsof -ti:${PORT}`;
            const stdout = require('child_process').execSync(pidCmd, { encoding: 'utf8', timeout: 5000 });
            const pidLine = stdout.trim().split('\n').pop()?.trim();
            if (pidLine) {
                const pid = isWin ? pidLine.split(/\s+/).pop() : pidLine;
                console.error(`   Occupied by PID: ${pid}`);
                console.error(`\n   To free the port, run:\n`);
                console.error(`   ${isWin ? `taskkill /PID ${pid} /F` : `kill -9 ${pid}`}\n`);
            }
        } catch { /* netstat/lsof failed — just show generic message */ }
        console.error(`   Or run: npm run kill-port\n`);
        process.exit(1);
    }
    console.error('Server error:', err);
    process.exit(1);
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const db = require('./config/db');

const app = express();
const server = http.createServer(app);

// ─── CORS ──────────────────────────────────────────────
const corsOrigins = [
<<<<<<< HEAD
    process.env.CORS_ORIGIN || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:5173',
];
app.use(cors({ origin: corsOrigins, credentials: true }));
=======
    'http://localhost:3000',
    'http://localhost:5173',
    // Allow same origin for containerized environments
];

// In production/containerized environment, allow same origin
if (process.env.NODE_ENV === 'production') {
    corsOrigins.push(true); // Allows same origin
}

app.use(cors({
    origin: corsOrigins,
    credentials: true
}));
>>>>>>> b02e1a7 (updating luminary)

// ─── Body Parsers ──────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Socket.IO ─────────────────────────────────────────
const io = new Server(server, {
<<<<<<< HEAD
    cors: { origin: corsOrigins, methods: ['GET', 'POST'] }
=======
    cors: {
        origin: corsOrigins,
        methods: ['GET', 'POST']
    }
>>>>>>> b02e1a7 (updating luminary)
});

// Make io accessible to routes via req.app
app.set('io', io);

// ═══════════════════════════════════════════════════════
//  ONLINE USERS MANAGEMENT — keyed by USER ID, not socket ID
//  Structure: Map<projectId, Map<userId, { user, socketId }>>
//  This guarantees one entry per user per project
// ═══════════════════════════════════════════════════════
const onlineUsersByProject = new Map();

// Helper: get deduplicated online users list for a project
function getOnlineUsers(projectId) {
    const map = onlineUsersByProject.get(projectId);
    if (!map) return [];
    return Array.from(map.values()).map(entry => entry.user);
}

// Helper: broadcast online users to everyone in a project room
function broadcastOnlineUsers(projectId) {
    io.to(`project-${projectId}`).emit('online_users', getOnlineUsers(projectId));
}

// Helper: find the live socket for a user in a project
function findUserSocket(projectId, userId) {
    const map = onlineUsersByProject.get(projectId);
    if (!map) return null;
    const entry = map.get(userId);
    if (!entry) return null;
    // Verify the socket is still connected
    const sock = io.sockets.sockets.get(entry.socketId);
    return sock || null;
}

// Helper: store which project(s) a socket is in (for cleanup on disconnect)
const socketProjects = new Map(); // socketId -> Set<projectId>

io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join-project', (data) => {
        const { projectId, user } = data;
        if (!user || !user.id) return; // guard

        socket.join(`project-${projectId}`);

        // Initialize project map if needed
        if (!onlineUsersByProject.has(projectId)) {
            onlineUsersByProject.set(projectId, new Map());
        }

        // Store user by USER ID (not socket ID) — overwrites any previous entry
        // for the same user, which solves the duplicate problem
        onlineUsersByProject.get(projectId).set(user.id, {
            user: { ...user, status: user.status || 'online' },
            socketId: socket.id,
        });

        // Track which projects this socket is in (for disconnect cleanup)
        if (!socketProjects.has(socket.id)) {
            socketProjects.set(socket.id, new Set());
        }
        socketProjects.get(socket.id).add(projectId);

        broadcastOnlineUsers(projectId);
        console.log(`User ${user.first_name} (${user.id}) joined project-${projectId} via ${socket.id}`);
    });

    // User status change (online/away/busy/dnd)
    socket.on('set_status', (data) => {
        const { projectId, status } = data;
        const map = onlineUsersByProject.get(projectId);
        if (!map) return;

        // Find which user this socket belongs to
        for (const [userId, entry] of map.entries()) {
            if (entry.socketId === socket.id) {
                entry.user.status = status;
                map.set(userId, entry);
                broadcastOnlineUsers(projectId);
                break;
            }
        }
    });

    socket.on('leave-project', (projectId) => {
        socket.leave(`project-${projectId}`);

        const map = onlineUsersByProject.get(projectId);
        if (map) {
            // Remove user entry only if THIS socket is the current one for that user
            for (const [userId, entry] of map.entries()) {
                if (entry.socketId === socket.id) {
                    map.delete(userId);
                    break;
                }
            }
            broadcastOnlineUsers(projectId);
        }

        // Clean up socket tracking
        socketProjects.get(socket.id)?.delete(projectId);
    });

    // ═══ VIDEO CALL EVENTS ═══════════════════════════════

    socket.on('call_user', (data) => {
        const { projectId, targetUserId, callerName, callerId, channelName } = data;

        const targetSocket = findUserSocket(projectId, targetUserId);
        if (targetSocket) {
            targetSocket.emit('incoming_call', {
                callerName,
                callerId,
                callerSocketId: socket.id,
                channelName,
                projectId,
            });
            console.log(`📞 Call: ${callerName} → user ${targetUserId}`);
        } else {
            socket.emit('call_error', { message: 'User is not online' });
            console.log(`📞 Call failed: user ${targetUserId} not found online`);
        }
    });

    socket.on('answer_call', (data) => {
        const { targetUserId, channelName, projectId } = data;

        const callerSocket = findUserSocket(projectId, targetUserId);
        if (callerSocket) {
            callerSocket.emit('call_answered', { channelName });
            console.log(`📞 Call answered → notifying user ${targetUserId}`);
        } else {
            console.log(`📞 answer_call: caller ${targetUserId} socket not found`);
        }
    });

    socket.on('reject_call', (data) => {
        const { targetUserId, projectId } = data;

        const callerSocket = findUserSocket(projectId, targetUserId);
        if (callerSocket) {
            callerSocket.emit('call_rejected', { reason: 'Call was declined' });
            console.log(`📞 Call rejected → notifying user ${targetUserId}`);
        }
    });

    socket.on('end_call', (data) => {
        const { targetUserId, projectId } = data;

        const targetSocket = findUserSocket(projectId, targetUserId);
        if (targetSocket) {
            targetSocket.emit('call_ended');
            console.log(`📞 Call ended → notifying user ${targetUserId}`);
        }
    });

    // ═══ TYPING INDICATORS ═══════════════════════════════

    socket.on('typing', (data) => {
        const { projectId, user: typingUser } = data;
        if (projectId && typingUser) {
            socket.to(`project-${projectId}`).emit('user_typing', {
                userId: typingUser.id,
                first_name: typingUser.first_name,
            });
        }
    });

    socket.on('stop_typing', (data) => {
        const { projectId, user: typingUser } = data;
        if (projectId && typingUser) {
            socket.to(`project-${projectId}`).emit('user_stop_typing', {
                userId: typingUser.id,
            });
        }
    });

    // ═══ DISCONNECT CLEANUP ══════════════════════════════

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);

        // Get all projects this socket was in
        const projects = socketProjects.get(socket.id) || new Set();

        for (const projectId of projects) {
            const map = onlineUsersByProject.get(projectId);
            if (!map) continue;

            // Only remove user if THIS socket is still their current socket
            // (they might have reconnected with a new socket already)
            for (const [userId, entry] of map.entries()) {
                if (entry.socketId === socket.id) {
                    map.delete(userId);
                    break;
                }
            }

            broadcastOnlineUsers(projectId);
        }

        socketProjects.delete(socket.id);
    });
});

// ─── Routes ────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/polls', require('./routes/polls'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Agora configuration
app.get('/api/config/agora', (req, res) => {
<<<<<<< HEAD
    res.json({ appId: process.env.AGORA_APP_ID || '' });
=======
    res.json({ appId: 'e6061be9565b47e0b9705f86de2a42f5' });
>>>>>>> b02e1a7 (updating luminary)
});

// Runtime config endpoint — frontend fetches this on startup
app.get('/api/config/runtime', (req, res) => {
    res.json({
<<<<<<< HEAD
        agoraAppId: process.env.AGORA_APP_ID || '',
        backendUrl: process.env.BACKEND_PUBLIC_URL || '',
        socketUrl: process.env.SOCKET_PUBLIC_URL || process.env.BACKEND_PUBLIC_URL || '',
=======
        agoraAppId: 'e6061be9565b47e0b9705f86de2a42f5',
        backendUrl: 'http://localhost:5000',
        socketUrl: 'http://localhost:5000',
>>>>>>> b02e1a7 (updating luminary)
    });
});

// Agora token generation
app.get('/api/agora/token', (req, res) => {
<<<<<<< HEAD
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
=======
    const appId = 'e6061be9565b47e0b9705f86de2a42f5';
    const appCertificate = '8bfbd4ed44254e25be4402e84f40d642';
>>>>>>> b02e1a7 (updating luminary)

    if (!appId) {
        return res.status(500).json({ error: 'Agora App ID not configured' });
    }

    // If no certificate, Agora project uses "Testing Mode" (no token needed)
    if (!appCertificate || appCertificate.trim() === '') {
        return res.json({ token: null, mode: 'testing' });
    }

    const channelName = req.query.channelName;
    const uid = parseInt(req.query.uid) || 0;

    if (!channelName) {
        return res.status(400).json({ error: 'channelName is required' });
    }

    try {
        const expirationInSeconds = 3600;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationInSeconds;

        const token = RtcTokenBuilder.buildTokenWithUid(
            appId, appCertificate, channelName, uid,
            RtcRole.PUBLISHER, privilegeExpiredTs
        );

        res.json({ token, expiresIn: expirationInSeconds });
    } catch (err) {
        console.error('Agora token generation error:', err);
        res.status(500).json({ error: 'Failed to generate token' });
    }
});

// ─── Start Server ──────────────────────────────────────
<<<<<<< HEAD
const PORT = process.env.BACKEND_PORT || process.env.PORT || 5000;
=======
const PORT = 5000;
>>>>>>> b02e1a7 (updating luminary)

async function start() {
    try {
        const pool = db.getPool();
        const [rows] = await pool.query('SELECT 1');
        console.log('✅ Database connected');

        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('❌ Failed to start server:', err.message);
        process.exit(1);
    }
}

start();

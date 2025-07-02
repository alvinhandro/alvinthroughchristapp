// A robust router for Cloudflare Workers
import { Router } from 'itty-router';
// We'll need a library to handle JWTs. `jose` is a great modern choice.
// You'll need to `npm install itty-router jose`
import { SignJWT, jwtVerify } from 'jose';

const router = Router();

// --- Utility Functions ---

// Function to create a JWT
async function createToken(userId, secret) {
    return await new SignJWT({ 'sub': userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(new TextEncoder().encode(secret));
}

// Middleware to verify JWT and attach user to the request
async function authMiddleware(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Missing or invalid authorization header' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    const token = authHeader.substring(7);
    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET));
        request.userId = payload.sub; // Attach user ID to the request object
    } catch (err) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
}

// --- API Routes ---

// 1. User Registration
router.post('/api/register', async (request, env) => {
    const { email, username, password } = await request.json();

    if (!email || !username || !password) {
        return new Response('Email, username, and password are required', { status: 400 });
    }

    // Basic password hashing using Web Crypto API (built-in to Workers)
    const passwordBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer);
    const password_hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const id = crypto.randomUUID();

    try {
        await env.DB.prepare(
            'INSERT INTO Users (id, email, username, password_hash, bio) VALUES (?, ?, ?, ?, ?)'
        )
        .bind(id, email, username, password_hash, 'Loves the Word of God.')
        .run();
        
        return new Response(JSON.stringify({ message: 'User created successfully' }), { status: 201, headers: { 'Content-Type': 'application/json' }});
    } catch (e) {
        if (e.message.includes('UNIQUE constraint failed')) {
            return new Response('Email or username already exists', { status: 409 });
        }
        return new Response(e.message, { status: 500 });
    }
});

// 2. User Login
router.post('/api/login', async (request, env) => {
    const { email, password } = await request.json();
    if (!email || !password) {
        return new Response('Email and password are required', { status: 400 });
    }

    const user = await env.DB.prepare('SELECT id, password_hash FROM Users WHERE email = ?').bind(email).first();

    if (!user) {
        return new Response('Invalid credentials', { status: 401 });
    }

    const passwordBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer);
    const providedPasswordHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    if (providedPasswordHash !== user.password_hash) {
        return new Response('Invalid credentials', { status: 401 });
    }

    const token = await createToken(user.id, env.JWT_SECRET);
    return new Response(JSON.stringify({ token }), { headers: { 'Content-Type': 'application/json' } });
});

// 3. Get Verse Interactions (Likes & Comments Count)
router.get('/api/verse/:book/:chapter/:verse', async (request, env) => {
    const { book, chapter, verse } = request.params;
    const verseId = `${book}-${chapter}-${verse}`;
    
    const likesStmt = env.DB.prepare('SELECT COUNT(*) as count FROM Likes WHERE verse_id = ?').bind(verseId);
    const commentsStmt = env.DB.prepare('SELECT COUNT(*) as count FROM Comments WHERE verse_id = ?').bind(verseId);

    const [likesResult, commentsResult] = await Promise.all([likesStmt.first(), commentsStmt.first()]);

    return new Response(JSON.stringify({
        likes: likesResult.count,
        comments: commentsResult.count
    }), { headers: { 'Content-Type': 'application/json' } });
});


// 4. Like/Unlike a Verse (Protected Route)
router.post('/api/verse/:book/:chapter/:verse/like', authMiddleware, async (request, env) => {
    const { book, chapter, verse } = request.params;
    const verseId = `${book}-${chapter}-${verse}`;
    const userId = request.userId;

    // Check if already liked
    const existingLike = await env.DB.prepare('SELECT * FROM Likes WHERE verse_id = ? AND user_id = ?').bind(verseId, userId).first();

    if (existingLike) {
        // Unlike
        await env.DB.prepare('DELETE FROM Likes WHERE verse_id = ? AND user_id = ?').bind(verseId, userId).run();
        return new Response(JSON.stringify({ message: 'Unliked' }), { headers: { 'Content-Type': 'application/json' } });
    } else {
        // Like
        await env.DB.prepare('INSERT INTO Likes (verse_id, user_id) VALUES (?, ?)').bind(verseId, userId).run();
        return new Response(JSON.stringify({ message: 'Liked' }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    }
});


// --- Fallback ---
router.all('*', () => new Response('Not Found.', { status: 404 }));

// The `fetch` handler for the Worker
export default {
    async fetch(request, env, ctx) {
        // You must add a JWT_SECRET to your project's environment variables
        // Go to Pages project > Settings > Environment variables
        // For local dev, create a .dev.vars file with `JWT_SECRET=your-secret-string`
        if (!env.JWT_SECRET) {
            return new Response('JWT_SECRET not configured', { status: 500 });
        }
        return router.handle(request, env, ctx);
    },
};
          

-- Drop tables if they exist to ensure a clean slate
DROP TABLE IF EXISTS Likes;
DROP TABLE IF EXISTS Comments;
DROP TABLE IF EXISTS Messages;
DROP TABLE IF EXISTS Follows;
DROP TABLE IF EXISTS Users;

-- Users Table
CREATE TABLE Users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    bio TEXT,
    is_verified INTEGER DEFAULT 0, -- 0 for false, 1 for true
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Follows Table (Many-to-Many relationship for users)
CREATE TABLE Follows (
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Comments Table
CREATE TABLE Comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    verse_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Likes Table
CREATE TABLE Likes (
    verse_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (verse_id, user_id),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Messages Table
CREATE TABLE Messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL, -- A sorted combination of two user IDs
    sender_id TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_comments_verse_id ON Comments(verse_id);
CREATE INDEX idx_likes_verse_id ON Likes(verse_id);
CREATE INDEX idx_messages_chat_id ON Messages(chat_id);
  

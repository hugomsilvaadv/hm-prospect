-- Módulo editorial independente: não realiza publicações externas.
CREATE TABLE IF NOT EXISTS social_posts (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 title TEXT NOT NULL, format TEXT NOT NULL CHECK(format IN ('carrossel','reel','imagem','story')),
 topic TEXT NOT NULL, hook TEXT NOT NULL DEFAULT '',
 caption TEXT NOT NULL, visual_brief TEXT NOT NULL DEFAULT '',
 hashtags TEXT NOT NULL DEFAULT '', scheduled_at INTEGER,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending_review','approved','rejected')),
 approved_fingerprint TEXT, approved_at INTEGER,
 created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
 version INTEGER NOT NULL DEFAULT 1, origin TEXT NOT NULL DEFAULT 'manual' CHECK(origin IN ('manual','ai'))
);
CREATE INDEX IF NOT EXISTS idx_social_posts_status_schedule ON social_posts(status,scheduled_at);
CREATE TABLE IF NOT EXISTS social_audit (
 id INTEGER PRIMARY KEY AUTOINCREMENT, post_id INTEGER NOT NULL REFERENCES social_posts(id),
 action TEXT NOT NULL, from_status TEXT, to_status TEXT NOT NULL,
 detail TEXT NOT NULL DEFAULT '{}', happened_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_social_audit_post ON social_audit(post_id,happened_at);
CREATE TABLE IF NOT EXISTS social_ai_usage (
 id INTEGER PRIMARY KEY AUTOINCREMENT, model TEXT NOT NULL,
 prompt_tokens INTEGER NOT NULL DEFAULT 0, completion_tokens INTEGER NOT NULL DEFAULT 0,
 created_at INTEGER NOT NULL
);

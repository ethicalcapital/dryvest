PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS dataset_versions (
  version TEXT PRIMARY KEY,
  manifest TEXT NOT NULL,
  schema TEXT NOT NULL,
  fallback_version TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nodes (
  version TEXT NOT NULL,
  id TEXT NOT NULL,
  payload TEXT NOT NULL,
  PRIMARY KEY (version, id),
  FOREIGN KEY (version) REFERENCES dataset_versions(version) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS playlists (
  version TEXT NOT NULL,
  id TEXT NOT NULL,
  payload TEXT NOT NULL,
  PRIMARY KEY (version, id),
  FOREIGN KEY (version) REFERENCES dataset_versions(version) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sources (
  version TEXT NOT NULL,
  id TEXT NOT NULL,
  payload TEXT NOT NULL,
  PRIMARY KEY (version, id),
  FOREIGN KEY (version) REFERENCES dataset_versions(version) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS assertions (
  version TEXT NOT NULL,
  id TEXT NOT NULL,
  payload TEXT NOT NULL,
  PRIMARY KEY (version, id),
  FOREIGN KEY (version) REFERENCES dataset_versions(version) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS entities (
  version TEXT NOT NULL,
  id TEXT NOT NULL,
  payload TEXT NOT NULL,
  PRIMARY KEY (version, id),
  FOREIGN KEY (version) REFERENCES dataset_versions(version) ON DELETE CASCADE
);

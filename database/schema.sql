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

DROP VIEW IF EXISTS nodes_flat;
CREATE VIEW nodes_flat AS
SELECT
  version,
  json_extract(payload, '$.id') AS id,
  json_extract(payload, '$.type') AS type,
  COALESCE(json_extract(payload, '$.title'), json_extract(payload, '$.text'), '') AS title,
  COALESCE(json_extract(payload, '$.body'), json_extract(payload, '$.description'), '') AS content,
  (SELECT group_concat(value, '; ')
     FROM json_each(nodes.payload, '$.citations')) AS citations,
  (SELECT group_concat(value, '; ')
     FROM json_each(nodes.payload, '$.assertions')) AS assertions,
  (SELECT group_concat(value, '; ')
     FROM json_each(nodes.payload, '$.tags')) AS tags,
  (SELECT group_concat(value, '; ')
     FROM json_each(nodes.payload, '$.targets.identity')) AS targets_identity,
  (SELECT group_concat(value, '; ')
     FROM json_each(nodes.payload, '$.targets.audience')) AS targets_audience,
  (SELECT group_concat(value, '; ')
     FROM json_each(nodes.payload, '$.targets.level')) AS targets_level,
  (SELECT group_concat(value, '; ')
     FROM json_each(nodes.payload, '$.targets.motivation')) AS targets_motivation
FROM nodes;

DROP VIEW IF EXISTS playlists_flat;
CREATE VIEW playlists_flat AS
SELECT
  version,
  json_extract(payload, '$.id') AS id,
  json_extract(payload, '$.kind') AS kind,
  json_extract(payload, '$.title') AS title,
  (SELECT group_concat(value, '; ')
     FROM json_each(playlists.payload, '$.targets.identity')) AS targets_identity,
  (SELECT group_concat(value, '; ')
     FROM json_each(playlists.payload, '$.targets.audience')) AS targets_audience,
  (SELECT group_concat(value, '; ')
     FROM json_each(playlists.payload, '$.targets.motivation')) AS targets_motivation,
  json_array_length(json_extract(payload, '$.items')) AS item_count
FROM playlists;

DROP VIEW IF EXISTS sources_flat;
CREATE VIEW sources_flat AS
SELECT
  version,
  json_extract(payload, '$.id') AS id,
  json_extract(payload, '$.label') AS label,
  json_extract(payload, '$.url') AS url,
  json_extract(payload, '$.citationText') AS citation_text,
  (SELECT group_concat(value, '; ')
     FROM json_each(sources.payload, '$.tags')) AS tags
FROM sources;

DROP VIEW IF EXISTS assertions_flat;
CREATE VIEW assertions_flat AS
SELECT
  version,
  json_extract(payload, '$.id') AS id,
  json_extract(payload, '$.title') AS title,
  json_extract(payload, '$.statement') AS statement,
  (SELECT group_concat(value, '; ')
     FROM json_each(assertions.payload, '$.evidence')) AS evidence,
  (SELECT group_concat(value, '; ')
     FROM json_each(assertions.payload, '$.supports')) AS supports,
  json_extract(payload, '$.confidence') AS confidence
FROM assertions;

DROP VIEW IF EXISTS entities_flat;
CREATE VIEW entities_flat AS
SELECT
  version,
  json_extract(payload, '$.id') AS id,
  json_extract(payload, '$.label') AS label,
  json_extract(payload, '$.shortDescription') AS short_description,
  json_extract(payload, '$.timeHorizon') AS time_horizon,
  json_extract(payload, '$.typicalWithdrawal') AS typical_withdrawal,
  json_extract(payload, '$.governanceStyle') AS governance_style,
  (SELECT group_concat(value, '; ')
     FROM json_each(entities.payload, '$.keyConstraints')) AS key_constraints,
  (SELECT group_concat(value, '; ')
     FROM json_each(entities.payload, '$.stakeholders')) AS stakeholders
FROM entities;

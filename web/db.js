var sqlite3 = require('sqlite3');
var mkdirp = require('mkdirp');

mkdirp.sync('./var/db');

var db = new sqlite3.Database('./var/db/uploads.db');

db.serialize(function() {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    hashed_password BLOB,
    status INTEGER,
    salt BLOB,
    name TEXT
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS federated_credentials (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    provider TEXT NOT NULL,
    subject TEXT NOT NULL,
    UNIQUE (provider, subject)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS uploads (
    id INTEGER PRIMARY KEY,
    owner_id INTEGER NOT NULL,
    filename TEXT NOT NULL,
    outpath TEXT NOT NULL,
    status INTEGER
  )`);
});

module.exports = db;
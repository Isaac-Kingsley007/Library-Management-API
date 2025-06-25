const Database = require('better-sqlite3');

const db = new Database('library.db');

module.exports = db;

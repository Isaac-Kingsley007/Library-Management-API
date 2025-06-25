const db = require('./db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS libraries(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    doj TEXT,
    membership_fee INTEGER NOT NULL,
    late_fee INTEGER NOT NULL
  )
`)

db.prepare(`
  CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    library_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    author TEXT,
    count INTEGER DEFAULT 1,
    FOREIGN KEY(library_id) REFERENCES libraries(id)
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    library_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    dob TEXT,
    contact_number TEXT,
    doj TEXT,
    FOREIGN KEY(library_id) REFERENCES libraries(id)
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS borrows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    library_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    book_id INTEGER NOT NULL,
    borrowed_on TEXT DEFAULT (DATE('now')),
    FOREIGN KEY(library_id) REFERENCES libraries(id),
    FOREIGN KEY(member_id) REFERENCES members(id),
    FOREIGN KEY(book_id) REFERENCES books(id)
  )
`).run();

db.prepare(`
  CREATE TABLE IF NOT EXISTS auth (
    library_id INTEGER PRIMARY KEY,
    password TEXT NOT NULL,
    FOREIGN KEY(library_id) REFERENCES libraries(id)
  )
`).run();

console.log('All tables created successfully');

const express = require('express');
const libraryAuth = require('../middleware/requireLibraryAuth');
const db = require('../db')

const router = express.Router()

router.use(libraryAuth);

router.get('/getall', (req, res) => {
    try{
        const books = db.prepare(
            `select id, name, author, count
            from books
            where library_id = ?`
        ).all(req.libraryId);

        res.send(books);
    } catch(error){
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

router.get('/getone/:id', (req, res) => {
    const bookId = parseInt(req.params.id);

    if (!bookId) {
        return res.status(404).send("Book Not Found");
    }

    try {
        const book = db.prepare(`
            SELECT id, name, author, count
            FROM books
            WHERE library_id = ? AND id = ?
        `).get(req.libraryId, bookId);

        if (!book) return res.status(404).send("Book Not Found");

        res.send(book);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

router.get('/getonebyname/:name', (req, res) => {
    const bookName = req.params.name;

    try {
        const books = db.prepare(`
            SELECT id, name, author, count
            FROM books
            WHERE library_id = ? AND name = ?
        `).all(req.libraryId, bookName);

        res.send(books);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

router.post('/addone', (req, res) => {
    const {name, author} = req.body;

    if(!(name && author)){
        return res.status(400).send("'name', 'author' are required");
    }

    const count = req.body.count ?? 1;

    try{
        const bookId = db.prepare(
            `insert into books
            library_id, name, author, count
            values (?, ?, ?, ?)`
        ).run(req.libraryId, name, author, count);

        res.send(bookId);
    } catch(error){
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
});

router.post('/updateone/:id', (req, res) => {

});


module.exports = router;
const express = require('express');
const libraryAuth = require('../middleware/requireLibraryAuth');
const internalError = require('../middleware/internalError');
const db = require('../db');

const router = express.Router()

router.use(libraryAuth);

router.get('/getall', (req, res) => {
    try{
        const books = db.prepare(
            `select id, name, author, count, borrowed_count
            from books
            where library_id = ?`
        ).all(req.libraryId);

        res.send(books);
    } catch(error){
        internalError(res, error);
    }
});

router.get('/getone/:id', (req, res) => {
    const bookId = parseInt(req.params.id);

    if (!bookId) {
        return res.status(404).send("Book Not Found");
    }

    try {
        const book = db.prepare(`
            SELECT id, name, author, count, borrowed_count
            FROM books
            WHERE library_id = ? AND id = ?
        `).get(req.libraryId, bookId);

        if (!book) return res.status(404).send("Book Not Found");

        res.send(book);
    } catch (error) {
        internalError(res, error);
    }
});

router.get('/getbyname/:name', (req, res) => {
    const bookName = req.params.name;

    try {
        const books = db.prepare(`
            SELECT id, name, author, count, borrowed_count
            FROM books
            WHERE library_id = ? AND name = ?
        `).all(req.libraryId, bookName);

        res.send(books);
    } catch (error) {
        internalError(res, error);
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
            (library_id, name, author, count)
            values (?, ?, ?, ?)`
        ).run(req.libraryId, name, author, count);

        res.send(bookId);
    } catch(error){
        internalError(res, error);
    }
});

router.put('/updatecount/:id', (req, res) => {

    const bookId = parseInt(req.params.id);

    const {is_increase, count} = req.body;

    if(typeof is_increase !== "boolean" || !parseInt(count) || parseInt(count) <= 0){
        return res.status(400).send("'is_increase' should be boolean and 'count' should be Integer greater than 0");
    }

    if(is_increase){

        try{
            const changes = db.prepare(
                `update books
                set count = count + ?
                where id = ? and library_id = ?`
            ).run(count, bookId, req.libraryId);

            if(changes.changes === 0){
                return res.status(404).send("Book Not Found");
            }

            res.send(changes);
        } catch(error){
            internalError(res, error);
        }

    } else{

        try{
            const changes = db.prepare(
                `update books
                set count = count - ?
                where id = ? and library_id = ? and count - borrowed_count - ?`
            ).run(count, bookId, req.libraryId, count);

            if(changes.changes === 0){
                return res.status(404).send("Either Book not Found or Recducing more than available");
            }

            res.send(changes);
        } catch(error){
            internalError(res, error);
        }

    }

});

router.patch('/updateone/:id', (req, res) => {
    const bookId = parseInt(req.params.id);

    if(!bookId){
        return res.status(404).send("Invalid Id");
    }

    const bodyStringParams = ['name', 'author'];

    const availableNames = [];
    const values = [];

    for(const param of bodyStringParams){
        if(req.body[param]){
            availableNames.push(param + ' = ?');
            values.push(req.body[param]);
        }
    }
    
    if(req.body.count !== undefined){
        const countInt = parseInt(req.body.count);
        
        if(isNaN(countInt)){
            return res.status(400).send("'count' should be a valid int");
        }

        availableNames.push('count = ?');
        values.push(countInt);
    }
    
    if(availableNames.length === 0){
        return res.status(400).send("Nothing To Update");
    }

    values.push(bookId);
    values.push(req.libraryId);

    try{

        if(req.body.count !== undefined){
            const borrowedCount = db.prepare(
                `select borrowed_count
                from books 
                where id = ? and library_id = ?`
            ).get(bookId, req.libraryId);

            if(!borrowedCount){
                return res.status(404).send("Book Not Found");
            }

            if(parseInt(req.body.count) < borrowedCount.borrowed_count){
                return res.status(400).send("New Could Should be Greater Than are equal to already borrowed Count");
            }
        }

        const numberOfChanges = db.prepare(
            `update books
            set ${availableNames.join(', ')}
            where id = ? and library_id = ?`
        ).run(...values).changes;

        if(numberOfChanges === 0){
            return res.status(404).send("Book Not Found");
        }

        res.send(numberOfChanges);

    } catch(error){
        internalError(res, error);
    }
});


router.delete('/deleteone/:id', (req, res) => {

    const bookId = parseInt(req.params.id);

    if(!bookId){
        return res.status(404).send('Book Id Must be Int');
    }

    try{
        const numberOfChanges = db.prepare(
            `delete from books
            where id = ? and library_id = ?`
        ).run(bookId, req.libraryId).changes;

        if(numberOfChanges === 0){
            return res.status(404).send("Book Not Found");
        }

        res.send(numberOfChanges);
    } catch(error){
        internalError(res, error);
    }
});


module.exports = router;
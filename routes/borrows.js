const express = require('express');
const libraryAuth = require('../middleware/requireLibraryAuth');
const internalError = require('../middleware/internalError');
const idParser = require('../middleware/idParser');
const db = require('../db');

const router = express.Router();

router.use(libraryAuth);

router.get('/', (req, res) => {
    res.send("Borrows Page");
});

router.get('/getall', (req, res) =>{

    try{
        const borrows = db.prepare(
            `select id, member_id, book_id, borrowed_on
            from borrows
            where library_id = ?`
        ).all(req.libraryId);

        res.send(borrows);
    } catch(error){
        internalError(res, error);
    }

});

router.get('/getone/:id', (req, res) => {
    
    const borrowId = idParser(req.params.id, res);
    if(isNaN(borrowId)) return;

    try{
        const borrow = db.prepare(
            `select id, member_id, book_id, borrowed_on
            from borrows
            where id = ? and library_id = ?`
        ).get(borrowId, req.libraryId);

        if(!borrow){
            return res.status(404).send("Borrow Not Found");
        }

        res.send(borrow);
    } catch(error){
        internalError(res, error);
    }

});

router.get('/getid/:member_id/:book_id', (req, res) => {

    const memberId = parseInt(req.params.member_id);
    const bookId = parseInt(req.params.book_id);

    if(isNaN(memberId) || isNaN(bookId)){
        return res.status(404).send("Invalid book or member id");
    }

    try{
        const borrow = db.prepare(
            `select id
            from borrows
            where member_id = ? and book_id = ? and library_id = ?`
        ).get(memberId, bookId, req.libraryId);

        if(!borrow){
            return res.status(404).send("Borrow Not Found");
        }

        res.send(borrow.id);
    } catch(error){
        internalError(res, error);
    }

});

router.post('/borrow', (req, res) => {

    const {member_id, book_id} = req.body;

    if(!(member_id && book_id)){
        return res.status(400).send("'member_id', 'book_id' are required");
    }

    const memberId = parseInt(member_id);
    const bookId = parseInt(book_id);

    if(isNaN(memberId) || isNaN(bookId)){
        return res.status(400).send("Invalid book or member id. 'member_id', 'book_id' should be integers");
    }

    const borrowedOn = new Date().toISOString();

    try{
        const borrowLimit = db.prepare(
            `select borrow_limit
            from libraries
            where id = ?`
        ).get(req.libraryId).borrow_limit;

        const alreadyBorrowed =db.prepare(
            `select count(*) as ab
            from borrows
            where member_id = ? and library_id = ?`
        ).get(memberId, req.libraryId).ab;

        if(alreadyBorrowed >= borrowLimit){
            return res.status(400).send("Aleadry Borrowed Enough Books");
        }

        const available = db.prepare(
            `select count - borrowed_count as available
            from books
            where id = ? and library_id = ?`
        ).get(bookId, req.libraryId).available;

        if(available === 0){ //When Scales Add a column named min shelf capacity replace that instead of 0
            return res.status(409).send("Book Currently Not Avavilable");
        }

        const changes = db.prepare(
            `insert into borrows
            (library_id, member_id, book_id, borrowed_on)
            values (?, ?, ?, ?)`
        ).run(req.libraryId, memberId, bookId, borrowedOn);

        db.prepare(
            `update books
            set borrowed_count = borrowed_count + 1
            where id = ? and library_id = ?`
        ).run(bookId, req.libraryId);

        res.send(changes);
    } catch(error){

        if(error.code === "SQLITE_CONSTRAINT_FOREIGNKEY"){
            return res.status(400).send("Invalid Borrow Request. member_id and book_id should be existing and valid");
        }
    
        internalError(res, error);
    }

});

router.delete('/return/:id', (req, res) =>{
    
    const borrowId = idParser(req.params.id);
    if(isNaN(borrowId)) return;
    const returnDate = new Date();

    try{
        const borrowedOn = db.prepare(
            `select borrowed_on, book_id
            from borrows
            where id = ? and library_id = ?`
        ).get(borrowId, req.libraryId);

        if(!borrowedOn){
            return res.status(404).send("Borrow Not Found");
        }

        db.prepare(
            `delete from borrows
            where id = ? and library_id = ?`
        ).run(borrowId, req.libraryId);

        db.prepare(
            `update books
            set borrowed_count = borrowed_count - 1
            where id = ? and library_id = ?`
        ).run(borrowedOn.book_id, req.libraryId);

        const lateFineData = db.prepare(
            `select late_fee, return_time
            from libraries
            where id = ?`
        ).get(req.libraryId);

        const borrowedOnDate = new Date(borrowedOn.borrowed_on);

        //zero if before or on time else days delayed
        const delayInDays = Math.max(Math.ceil((returnDate - borrowedOnDate) / (1000 * 60 * 60 * 24)) - lateFineData.return_time, 0);
        const fine = delayInDays * lateFineData.late_fee;
        
        return res.send(fine);
    } catch(error){
        internalError(res, error);
    }
});

module.exports = router;
const express = require('express');
const libraryAuth = require('../middleware/requireLibraryAuth');
const internalError = require('../middleware/internalError');
const db = require('../db');

const router = express.Router()

router.use(libraryAuth);

router.get('/', (req, res) => {
    res.send(req.url);
});

router.get('/getall', (req, res) => {

    try{
        const members = db.prepare(
            `select id, name, dob, contact_number, doj
            from members
            where library_id = ?`
        ).all(req.libraryId);

        res.send(members);
    } catch(error){
        internalError(res, error);
    }

});

router.get('/getone/:id', (req, res) => {

    const memberId = parseInt(req.params.id);

    if(!memberId) {
        return res.status(404).send("Need A proper member id");
    }

    try{
        const member = db.prepare(
            `select id, name, dob, contact_number, doj
            from members
            where id = ? and library_id = ?`
        ).get(memberId, req.libraryId);

        if(!member){
            return res.status(404).send("Member Not Found");
        }

        res.send(member);
    } catch(error){
        internalError(res, error);
    }

});

router.post('/addone', (req, res) => {

    const {name, dob, contact_number} = req.body;

    if(!(name && dob && contact_number)){
        return res.status(400).send("'name', 'dob', 'contact_number' is required");
    }

    const dateOfBirth = new Date(dob);
    const dateOfJoining = new Date();

    if(isNaN(dateOfBirth.getTime())){
        return res.status(400).send("invalid 'dob'. Send 'dob' as a ISOString(prefered) or anyother javascript acceptable format");
    }

    try{
        const status = db.prepare(
            `insert into members
            (library_id, name, dob, contact_number, doj)
            values
            (?, ?, ?, ?, ?)`
        ).run(req.libraryId, name, dateOfBirth.toISOString(), contact_number, dateOfJoining.toISOString());
        
        res.send(status);
    } catch(error){
        internalError(res, error);
    }
});


router.patch('/updateone/:id', (req, res) => {

    const memberId = parseInt(req.params.id);

    if(isNaN(memberId)){
        return res.status(404).send("Not Valid Id");
    }

    const availableNames = [];
    const values = [];

    if(req.body.name){
        availableNames.push('name = ?');
        values.push(req.body.name);
    }

    if(req.body.dob){
        const dateOfBirth = new Date(req.body.dob);

        if(isNaN(dateOfBirth.getTime())){
            return res.status(400).send("invalid 'dob'. Send 'dob' as a ISOString(prefered) or anyother javascript acceptable format");
        }

        availableNames.push('dob = ?');
        values.push(dateOfBirth.toISOString());
    }

    if(req.body.contact_number){
        availableNames.push('contact_number = ?');
        values.push(req.body.contact_number);
    }

    if(availableNames.length === 0){
        return res.status(400).send("No Values to Update");
    }

    values.push(memberId);
    values.push(req.libraryId);

    try{
        const changes = db.prepare(
            `update members
            set ${availableNames.join(', ')}
            where id = ? and library_id = ?`
        ).run(...values).changes;

        if(changes === 0){
            return res.status(404).send("No Rows Updated");
        }

        return res.send(changes);
    } catch(error){
        internalError(res, error);
    }

});


router.delete('/deleteone/:id', (req, res) =>{

    const memberId = parseInt(req.params.id);

    if(isNaN(memberId)){
        return res.status(404).send("Invalid Member id");
    }

    try{
        const numberOfChanges = db.prepare(
            `delete from members
            where id = ? and library_id = ?`
        ).run(memberId, req.libraryId).changes;

        if(numberOfChanges === 0){
            return res.status(404).send("Member with Id not found");
        }

        res.send(numberOfChanges);
    } catch(error){
        internalError(req, error);
    }

});

module.exports = router;
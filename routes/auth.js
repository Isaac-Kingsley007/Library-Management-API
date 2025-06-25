const express = require('express');
const db = require('../db')
const bcrypt = require('bcryptjs')

const router = express.Router()

router.post('/signup', (req, res) => {
    const name = req.body.name;
    const membershipFee = req.body.membershipFee;
    const lateFee = req.body.lateFee;
    const password = req.body.password;

    if(!(name && membershipFee && lateFee && password)){
        return res.status(400).send("'name', 'membershipFee', 'lateFee', 'password' are required");
    }

    const membershipFeeInt = parseInt(membershipFee);
    const lateFeeInt = parseInt(lateFee);
    const doj = new Date().toISOString().slice(0, 10);
    const hashedPassword = bcrypt.hashSync(password, 10);

    try{
        const rowId = db.prepare(
            `insert into libraries (name, doj, membership_fee, late_fee)
            values(?, ?, ?, ?)`)
            .run(name, doj, membershipFeeInt, lateFeeInt).lastInsertRowid;
    
        db.prepare("insert into auth values (?, ?)").run(rowId, hashedPassword);

        res.send("Created Library");
    } catch(err){
        console.error(err.message);
        res.status(500).send("Internal Server Error");
    }

});


router.post('/signin', (req, res) => {

    const {name, password} = req.body;

    if(!(name && password)){
        return res.status(400).send("'name', 'password' are required");
    }

    try {

        const libraryId = db.prepare('select id from libraries where name = ?').get(name);
        const storedPassword =db.prepare('select password from auth where library_id = ?').get(libraryId.id);
        const result = bcrypt.compareSync(password, storedPassword.password);

        if(!result) return res.status(401).send("Wrong Creds");

        res.cookie('library_id', libraryId.id, {
            httpOnly: true,        
            maxAge: 24 * 60 * 60 * 1000 
          });

        res.send("Sign In Successfull");

    } catch (error) {

        console.error(error.message);
        res.status(500).send("Internal Server Error");

    }

});

router.post('/signout', (req, res) => {
    res.clearCookie('library_id');
    res.send("Logged out Successfully");
});

module.exports = router;
function internalError(res, error){
    console.log(error.message);
    res.status(500).send("Internal Server Error");
}

module.exports = internalError;
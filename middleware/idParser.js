function idParser(id, res){
    const parsedId = parseInt(id);
    if(isNaN(parsedId)){
        res.status(404).send("Id Invalid should be an Integer");
    }

    return parsedId;
}

module.exports = idParser;
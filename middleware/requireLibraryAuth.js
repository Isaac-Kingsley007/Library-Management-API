function requireLibraryAuth(req, res, next) {
    const libraryId = req.cookies.library_id;

    if (!libraryId) {
        return res.status(401).send("❌ Access denied. Not logged in.");
    }
    req.libraryId = libraryId;
    next();
}
  
module.exports = requireLibraryAuth;

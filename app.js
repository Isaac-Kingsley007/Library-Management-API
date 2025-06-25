const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const booksRoute = require('./routes/books');
const borrowsRoute = require('./routes/borrows');
const membersRoute = require('./routes/members');
const authRoute = require('./routes/auth');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/books', booksRoute);
app.use('/api/members', membersRoute);
app.use('/api/borrows', borrowsRoute);
app.use('/api/auth', authRoute);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.status(404).send("Not found");
});

module.exports = app;

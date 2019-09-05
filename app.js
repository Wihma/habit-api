const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');

require('dotenv-flow').config();

const keys = require('./config/keys.js');

//Configure mongoose's promise to global promise
mongoose.promise = global.Promise;

const app = express();

//Configure our app
app.use(cors());
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'passport-tutorial', cookie: { maxAge: 60000 }, resave: false, saveUninitialized: false }));

if(!process.env.production) {
  app.use(errorHandler());
}

console.log(keys.mongoDB.dbURI);
console.log('Display env variables');
console.log(process.env.PORT);
console.log(process.env.DATABASE_USER);
console.log(process.env.DATABASE_PASS);
console.log(process.env.DATABASE_CLUSTER);
console.log(process.env.DATABASE_NAME);
console.log(process.env.DATABASE_PARAMETERS);

mongoose.connect(keys.mongoDB.dbURI, { useNewUrlParser: true }, () => {
  // this should be a proper winston log
  console.log('connected to mongod');    
});
mongoose.set('debug', true);

//Models & routes
require('./models/Users');
require('./models/Habits');
require('./config/passport');
app.use(require('./routes'));

//Error handlers & middlewares
// error handler
app.use(function(err, req, res, next) {
  // No routes handled the request and no system error, that means 404 issue.
  // Forward to next middleware to handle it.
  if (!err) return next();

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500).send('error');
});

// catch 404. 404 should be consider as a default behavior, not a system error.
app.use(function(req, res, next) {
  res.status(404).send('Not Found');
});

app.listen(process.env.PORT, () => console.log(`Server running on http://localhost: ${process.env.PORT}`));

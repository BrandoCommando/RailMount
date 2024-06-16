const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
var createError = require('http-errors');
const express = require('express');
const bodyParser = require('body-parser');
const { PORT } = require('./config');
const middleware = require('./middleware');
const cookieParser = require('cookie-parser');
const AbortController = require("abort-controller");
const session = require('express-session');
const passport = require('passport');

const SQLiteStore = require('connect-sqlite3')(session);

const app = express();

const indexRouter = require('./routes/index');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
		secret:"yermom",saveUninitialized:false,resave:true
		,cookie:{secure:false,httpOnly:true,maxAge:360000
		,store: new SQLiteStore({ db: 'sessions.db', dir: './var/db' })
  }}));
app.use(cookieParser());
// Parse posted body as JSON
app.use(bodyParser.json({limit:'2mb',verify:(req,res,buf,enc)=>{
	if(buf&&buf.length) req.rawBody = buf.toString(enc||'utf8');}}));
app.use(express.urlencoded({extended:true}));
// Set CORS, security headers, and rate limit
app.use(middleware);
if(!process.env['NO_AUTH'])
  app.use(passport.authenticate('session'));
else app.use((req,res,next)=>{
  req.session.last = new Date();
  req.user = req.sessionID;
  req.isAuthenticated = () => true;
  next();
})
app.use(function(req, res, next) {
  var msgs = req.session.messages || [];
  res.locals.messages = msgs;
  res.locals.hasMessages = !! msgs.length;
  req.session.messages = [];
  next();
});

app.use('/', indexRouter);
if(!process.env['NO_AUTH']&&!!process.env['GOOGLE_CLIENT_ID']&&!!process.env['GOOGLE_CLIENT_SECRET'])
  app.use('/', require('./routes/auth'));
else console.warn("Unable to load Google Auth");

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Init
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

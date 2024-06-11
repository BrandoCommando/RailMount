const fs = require('fs');
var express = require('express');
var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
var db = require('../db');
const multer = require('multer');
const { randomUUID } = require('crypto');
const upload = multer({dest:"public/uploads/"});

var ensureLoggedIn = ensureLogIn();

function fetchUploads(req, res, next) {
  db.all('SELECT * FROM uploads WHERE owner_id = ?', [
    req.user.id
  ], function(err, rows) {
    if (err) { return next(err); }
    
    var uploads = rows.map(function(row) {
      return {
        id: row.id,
        filename: row.filename,
        outpath: row.outpath.replace("public/",""),
        status: row.status,
        url: '/' + row.id
      }
    });
    res.locals.uploads = uploads;
    res.locals.activeCount = uploads.filter(function(todo) { return !todo.status; }).length;
    res.locals.completedCount = uploads.length - res.locals.activeCount;
    next();
  });
}

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  if (!req.user) { return res.render('home'); }
  next();
}, fetchUploads, function(req, res, next) {
  res.locals.filter = null;
  res.render('index', { user: req.user });
});

router.get('/draw/:id?', ensureLoggedIn, fetchUploads, function(req, res, next) {
  if(req.params.id)
    res.locals.drawing = res.locals.uploads.find((up)=>up.id==req.params.id);
  res.render('canvas', { user: req.user, drawing: res.locals.drawing });
});

router.post('/update/:id?', ensureLoggedIn, fetchUploads, function(req, res, next) {
  if(req.params?.id)
    res.locals.drawing = res.locals.uploads.find((up)=>up.id==req.params.id);
  if(req.body?.data)
  {
    if(res.locals.drawing?.outpath)
    {
      var path = res.locals.drawing.outpath;
      if(path.indexOf("public/")==-1)
        path = `public/${path}`;
      fs.writeFile(path, req.body.data, (err)=>{
        if(!!err) throw new Error(err);
      });
    }
    if(req.body.filename && req.params?.id && res.locals.drawing?.filename != req.body.filename)
      db.run('UPDATE uploads SET filename = ? WHERE id = ? AND owner_id = ?', [
        req.body.filename,
        res.locals.drawing.id,
        req.user.id
      ], (err)=>{
        if(!!err) throw new Error(err);
      });
    if(!req.params?.id || !res.locals.drawing)
    {
      const uid = randomUUID();
      const path = `public/uploads/${uid}.svg`;
      fs.writeFile(path, req.body.data, (err)=>{
        if(!!err) throw new Error(err);
      });
      db.run('INSERT INTO uploads (owner_id, filename, outpath, status) VALUES (?, ?, ?, 0)', [
        req.user.id,
        req.body.filename ?? "undefined",
        path.replace('public/', '')
      ], function(err){
        if(!!err) throw new Error(err);
        const newId = this.lastID;
        if(!res.headersSent)
          res.redirect(`/draw/${newId}`);
      });
    }
  }
  if(!res.headersSent&&req.params.id)
  res.redirect(`/draw/${req.params.id}`);
});

router.get('/active', ensureLoggedIn, fetchUploads, function(req, res, next) {
  res.locals.uploads = res.locals.uploads.filter(function(todo) { return todo.status === 0; });
  res.locals.filter = 'active';
  res.render('index', { user: req.user });
});

router.get('/completed', ensureLoggedIn, fetchUploads, function(req, res, next) {
  res.locals.uploads = res.locals.uploads.filter(function(todo) { return todo.status === 1; });
  res.locals.filter = 'completed';
  res.render('index', { user: req.user });
});

router.post('/', ensureLoggedIn, upload.single("file"), function(req, res, next) {
  if (!!req.file) { return next(); }
  return res.redirect('/');
}, function(req, res, next) {
  const ftype = req.file.originalname.substring(req.file.originalname.lastIndexOf("."));
  if(req.file.path.indexOf(ftype)==-1)
  {
    fs.rename(req.file.path, req.file.path + ftype, (err)=>{
      if(err) throw new Error(err);
    });
    req.file.path += ftype;
  }
  db.run('INSERT INTO uploads (owner_id, filename, outpath, status) VALUES (?, ?, ?, ?)', [
    req.user.id,
    req.file.originalname,
    req.file.path.replace('public/',''),
    0
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect('/');
  });
});

router.post('/:id(\\d+)', ensureLoggedIn, function(req, res, next) {
  req.body.title = req.body.title.trim();
  next();
}, function(req, res, next) {
  if (req.body.title !== '') { return next(); }
  db.run('DELETE FROM uploads WHERE id = ? AND owner_id = ?', [
    req.params.id,
    req.user.id
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || ''));
  });
}, function(req, res, next) {
  db.run('UPDATE uploads SET filename = ?, status = ? WHERE id = ? AND owner_id = ?', [
    req.body.filename,
    req.body.completed !== undefined ? 1 : null,
    req.params.id,
    req.user.id
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || ''));
  });
});

router.post('/:id(\\d+)/delete', ensureLoggedIn, function(req, res, next) {
  db.run('DELETE FROM uploads WHERE id = ? AND owner_id = ?', [
    req.params.id,
    req.user.id
  ], function(err) {
    if (err) { return next(err); }
    return res.redirect('/' + (req.body.filter || ''));
  });
});

module.exports = router;
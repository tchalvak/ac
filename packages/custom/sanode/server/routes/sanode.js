'use strict';

// The Package is past automatically as first parameter
module.exports = function(Sanode, app, auth, database) {

  app.get('/sanode/example/anyone', function(req, res, next) {
    res.send('Anyone can access this');
  });

  app.get('/sanode/example/auth', auth.requiresLogin, function(req, res, next) {
    res.send('Only authenticated users can access this');
  });

  app.get('/sanode/example/admin', auth.requiresAdmin, function(req, res, next) {
    res.send('Only users with Admin role can access this');
  });

  app.get('/sanode/example/render', function(req, res, next) {
    Sanode.render('index', {
      package: 'sanode'
    }, function(err, html) {
      //Rendering a view from the Package server/views
      res.send(html);
    });
  });
};

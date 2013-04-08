var passport = require('passport');
var wsfederationResponses = require('./wsfederation-responses');
var nconf = require('nconf');

exports.install = function (app) {

  if (nconf.get('AUTHENTICATION') === 'FORM') {
    app.get('/wsfed', 
      function (req, res, next) {
        if (req.session.user && req.query.wprompt !== 'consent') {
          req.user = req.session.user;
          return wsfederationResponses.token(req, res);
        }
        next();
      },
      function (req, res) {
        var messages = (req.session.messages || []).join('<br />');

        delete req.session.messages;

        return res.render('login', {
          title: nconf.get('SITE_NAME'),
          errors: messages
        });
      });

    app.post('/wsfed', function (req, res, next) {
        passport.authenticate('WindowsAuthentication', {
          failureRedirect: req.url,
          failureMessage: "The username or password you entered is incorrect.",
          session: false
        })(req, res, next);
      }, function (req, res, next) {
        req.session.user = req.user;
        next();
      }, wsfederationResponses.token);

    app.get('/logout', function (req, res) {
      delete req.session;
      res.send('bye');
    });
  }

  app.get('/wsfed/FederationMetadata/2007-06/FederationMetadata.xml',
    wsfederationResponses.metadata());
};
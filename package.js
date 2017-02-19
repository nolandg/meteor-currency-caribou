Package.describe({
  name: 'noland:currency-caribou',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: 'Automatically fetch currency conversion rates to convert, format, and localize currencies.',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/nolandg/meteor-currency-caribou',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.4.2.7');
  api.use('ecmascript');
  api.mainModule('server.js', 'server');
  api.mainModule('client.js', 'client');
});

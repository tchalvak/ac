'use strict';

/*
 * Defining the Package
 */
var Module = require('meanio').Module;

var Sanode = new Module('sanode');

/*
 * All MEAN packages require registration
 * Dependency injection is used to define required modules
 */
Sanode.register(function(app, auth, database) {

  //We enable routing. By default the Package Object is passed to the routes
  Sanode.routes(app, auth, database);

  //We are adding a link to the main menu for all authenticated users
  Sanode.menus.add({
    title: 'sanode example page',
    link: 'sanode example page',
    roles: ['authenticated'],
    menu: 'main'
  });
  
  Sanode.aggregateAsset('css', 'sanode.css');

  /**
    //Uncomment to use. Requires meanio@0.3.7 or above
    // Save settings with callback
    // Use this for saving data from administration pages
    Sanode.settings({
        'someSetting': 'some value'
    }, function(err, settings) {
        //you now have the settings object
    });

    // Another save settings example this time with no callback
    // This writes over the last settings.
    Sanode.settings({
        'anotherSettings': 'some value'
    });

    // Get settings. Retrieves latest saved settigns
    Sanode.settings(function(err, settings) {
        //you now have the settings object
    });
    */

  return Sanode;
});

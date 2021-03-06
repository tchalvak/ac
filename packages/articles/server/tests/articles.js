'use strict';
// Trying out emit when server starts
var mean = require('meanio');

var userTaskHelper = require('../../../../test/mochaHelpers/userTaskHelpers');

describe('server setup', function () {
    var serverUp = false;
    before(function (done) {
        mean.events.on('serverStarted', function () {
            serverUp = true;
            done();
        });
    });

    after(function (done) {
        userTaskHelper.removeUsersAndTasks().then(function () {
            done();
        });
    });

    it('should run the tests only after the server has been started', function () {
        serverUp.should.be.ok;
    });
});

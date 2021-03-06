/*global io:false */
'use strict';

angular.module('mean.acsocket').factory('AcSocketService', ['$rootScope', function ($rootScope) {
    var socket = io.connect('http://' + document.location.hostname + '/');
    return {
        getSocket: function () {
            return socket;
        },
        // Listener
        on: function (eventName, callback) {
            this.getSocket().on(eventName, function () {
                var args = arguments;
                // Simply run the $digest cycle and apply call to socket with args
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        // Emitter
        emit: function (eventName, data, callback) {
            this.getSocket().emit(eventName, data, function () {
                var args = arguments;
                // Run $digest cycle, call callback in context of socket with args
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            });
        }
    };
}]);

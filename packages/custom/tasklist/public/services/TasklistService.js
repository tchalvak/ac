'use strict';

var app = angular.module('mean.tasklist');

// Favorite service for retrieving and creating tasks
app.factory('TasklistService', ['$http', 'SocketService', 'Global', 'LogService', '$q',
                         function ($http, SocketService, Global, LogService, $q) {

    return {
        // Get an initial listing of tasks, return promise
        init: function(){
            var deferred = $q.defer();
            $http.get('/tasklist').then(function (response) {
                deferred.resolve(response.data);
                //return response.data;
            }, function (error) {
                deferred.reject({
                    data: {
                        error: 'Could not resolve $http request to /tasklist'
                    }
                });
            });
            return deferred.promise;
        },
        // Create a new task
        create: function (isValid) {
            if (isValid) {
                var task = {
                    user: Global.user._id,
                    title: this.title,
                    content: this.content
                };
                $http.post('/task', task).
                // On success, emit
                success(function (data, status, headers, config) {
                    SocketService.emit('newTask', {
                        data: task
                    });
                // Error out
                }).error(function (data, status, headers, config) {
                    LogService.error({
                        message: 'Failed to save new task',
                        stackTrace: true
                    });
                });
            } else {
                //$scope.submitted = true;
                console.log('set scope.submitted to true');
            }
        }
    };
}]);
(function () {
'use strict';

var app = angular.module('mean.tasklist');

// For controllerAs syntax, check out: http://toddmotto.com/digging-into-angulars-controller-as-syntax/
app.controller('TasklistController', ['TasklistSocketService', 'TasklistService', 'LogService', '$scope', 'TaskStorageService', 'filterFilter', '$rootScope', 'logger',
function (TasklistSocketService, TasklistService, LogService, $scope, TaskStorageService, filterFilter, $rootScope, logger) {

    var vm = this;

    // Get the initial tasklist
    TasklistService.init().then(function (data) {
        vm.tasks = data;
    }, function (error) {
        // log error to DB
        // TODO Make robust
        LogService.error({
            message: 'Unable to retrieve initial tasks. Error: ' + error.data.error, stackTrace: true
        });
    });

    TasklistSocketService.on('newTask', function (data) {
        if (typeof vm.tasks !== 'undefined' && angular.isArray(vm.tasks)) {
            vm.tasks.unshift(data.data);
        }
    });

    //////////////////////////////////////

    var tasks;
    tasks = $scope.tasks = TaskStorageService.get();
    $scope.newTask = '';
    $scope.remainingCount = filterFilter(tasks, {
        completed: false
    }).length;
    $scope.editedTask = null;
    $scope.statusFilter = {
        completed: false
    };
    $scope.filter = function(filter) {
        switch (filter) {
            case 'all':
                return $scope.statusFilter = '';
            case 'active':
                return $scope.statusFilter = {
                    completed: false
                };
            case 'completed':
                return $scope.statusFilter = {
                    completed: true
                };
        }
    };
    $scope.add = function() {
        var newTask;
        newTask = $scope.newTask.trim();
        if (newTask.length === 0) {
            return;
        }
        tasks.push({
            title: newTask,
            completed: false
        });
        logger.logSuccess('New task: "' + newTask + '" added');
        TaskStorageService.put(tasks);
        $scope.newTask = '';
        return $scope.remainingCount++;
    };
    $scope.edit = function(task) {
        return $scope.editedTask = task;
    };
    $scope.doneEditing = function(task) {
        $scope.editedTask = null;
        task.title = task.title.trim();
        if (!task.title) {
            $scope.remove(task);
        } else {
            logger.log('Task updated');
        }
        return TaskStorageService.put(tasks);
    };
    $scope.remove = function(task) {
        var index;
        $scope.remainingCount -= task.completed ? 0 : 1;
        index = $scope.tasks.indexOf(task);
        $scope.tasks.splice(index, 1);
        TaskStorageService.put(tasks);
        return logger.logError('Task removed');
    };
    $scope.completed = function(task) {
        $scope.remainingCount += task.completed ? -1 : 1;
        TaskStorageService.put(tasks);
        if (task.completed) {
            if ($scope.remainingCount > 0) {
                if ($scope.remainingCount === 1) {
                    return logger.log('Almost there! Only ' + $scope.remainingCount + ' task left');
                } else {
                    return logger.log('Good job! Only ' + $scope.remainingCount + ' tasks left');
                }
            } else {
                return logger.logSuccess('Congrats! All done :)');
            }
        }
    };
    $scope.clearCompleted = function() {
        $scope.tasks = tasks = tasks.filter(function(val) {
            return !val.completed;
        });
        return TaskStorageService.put(tasks);
    };
    $scope.markAll = function(completed) {
        tasks.forEach(function(task) {
            return task.completed = completed;
        });
        $scope.remainingCount = completed ? 0 : tasks.length;
        TaskStorageService.put(tasks);
        if (completed) {
            return logger.logSuccess('Congrats! All done :)');
        }
    };
    $scope.$watch('remainingCount == 0', function(val) {
        return $scope.allChecked = val;
    });
    return $scope.$watch('remainingCount', function(newVal, oldVal) {
        return $rootScope.$broadcast('taskRemaining:changed', newVal);
    });
 }]);
})();
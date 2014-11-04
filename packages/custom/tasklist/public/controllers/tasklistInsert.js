'use strict';

var app = angular.module('mean.tasklist');

app.controller('TasklistInsertController',
// Tasklist here is referring to the Mongo model
['$scope', '$stateParams', '$location', 'Global', 'Tasklist',
 function ($scope, $stateParams, $location, Global, Tasklist) {
     $scope.global = Global;
     $scope.strings = Global.tasklist.strings;

     /**
      * Create a new task
      * @param isValid
      */
     $scope.create = Tasklist.create;
 }]);
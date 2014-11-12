'use strict';

angular.module('mean.sanode').controller('SanodeController', ['$scope', 'Global', 'Sanode',
  function($scope, Global, Sanode) {
    $scope.global = Global;
    $scope.package = {
      name: 'sanode'
    };
  }
]);

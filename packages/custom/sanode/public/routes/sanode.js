'use strict';

angular.module('mean.sanode').config(['$stateProvider',
  function($stateProvider) {
    $stateProvider.state('sanode example page', {
      url: '/sanode/example',
      templateUrl: 'sanode/views/index.html'
    });
  }
]);

/*global angular, cordova, Camera*/
(function () {
    'use strict';

    function ActionMenu($scope, $location, $stateParams) {
        var vm = this;
        
        vm.openSwipeMode = function () {
            $location.path('/event/' + $stateParams.event + '/swipe-photos');
            $scope.closePopover();
        };
    }

    ActionMenu.$inject = ['$scope', '$location', '$stateParams'];

    angular.module('pick-me').controller('actionMenu', ActionMenu);

}());
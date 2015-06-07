/*global angular, cordova, Camera*/
(function () {
    'use strict';

    function SwipeSelection($location, $stateParams) {
        var vm = this;

        vm.goBack = function () {
            $location.path('/event/' + $stateParams.eventId + '/photos');
        };
    }

    SwipeSelection.$inject = ['$location', '$stateParams'];

    angular.module('pick-me').controller('swipeSelection', SwipeSelection);

}());
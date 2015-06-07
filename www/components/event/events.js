/*global angular, cordova, Camera*/
(function () {
    'use strict';

    function Events($location) {
        var vm = this;

        vm.openEvent = function (eventId) {
            $location.path('/event/' + eventId + '/photos');
        };
    }

    Events.$inject = ['$location'];

    angular.module('pick-me').controller('events', Events);

}());
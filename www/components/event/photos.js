/*global angular, cordova, Camera*/
(function () {
    'use strict';

    function EventPhotos($scope, $location, $ionicPopover) {
        var vm = this;

        vm.goBack = function () {
            $location.path('/events');
        };

        vm.popover = $ionicPopover.fromTemplateUrl('components/event/action-menu.html', {
            scope: $scope
        }).then(function(popover) {
            vm.popover = popover;
        });

        $scope.openPopover = function($event) {
            vm.popover.show($event);
        };
        $scope.closePopover = function() {
            vm.popover.hide();
        };
        //Cleanup the popover when we're done with it!
        $scope.$on('$destroy', function() {
            vm.popover.remove();
        });
    }

    EventPhotos.$inject = ['$scope', '$location', '$ionicPopover'];

    angular.module('pick-me').controller('eventPhotos', EventPhotos);

}());
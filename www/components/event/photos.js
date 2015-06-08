/*global angular, cordova, Camera*/
(function () {
    'use strict';

    function EventPhotos($scope, $location, $stateParams, $ionicPopover, eventManager) {
        var vm = this,
            eventId = $stateParams.event;

        vm.photos = [];
        
        vm.goBack = function () {
            $location.path('/events');
        };

        vm.popover = $ionicPopover.fromTemplateUrl('components/event/action-menu.html', {
            scope: $scope
        }).then(function (popover) {
            vm.popover = popover;
        });

        $scope.openPopover = function ($event) {
            vm.popover.show($event);
        };
        $scope.closePopover = function () {
            vm.popover.hide();
        };

        $scope.$on('$destroy', function () {
            vm.popover.remove();
        });

        vm.loadMorePhotos = function () {
            eventManager.getPhotos(eventId, 20).then(function (photos) {
                vm.photos = vm.photos.concat(photos);
                $scope.$broadcast('scroll.infiniteScrollComplete');
            });
        };
    }

    EventPhotos.$inject = ['$scope', '$location', '$stateParams', '$ionicPopover', 'eventManager'];

    angular.module('pick-me').controller('eventPhotos', EventPhotos);

}());
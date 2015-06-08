/*global angular, cordova, Camera*/
(function () {
    'use strict';

    function SwipeSelection($location, $stateParams, eventManager) {
        var vm = this,
            eventId = $stateParams.event;

        vm.goBack = function () {
            $location.path('/event/' + eventId + '/photos');
        };

        vm.cardDestroyed = function (index) {
            vm.cards.splice(index, 1);
            
            var newCard = eventManager.getPhotos(eventId, 1).then(function (photos) {
                vm.cards.splice(0, 0, photos[0]);
            });
        };

        vm.transitionLeft = function (photo) {
            eventManager.discardPhoto();
        };

        vm.transitionRight = function (photo) {
            eventManager.selectPhoto();
        };
        
        eventManager.getPhotos(eventId, 20).then(function (photos) {
            vm.photos = photos;
        });
    }

    SwipeSelection.$inject = ['$location', '$stateParams', 'eventManager'];

    angular.module('pick-me').controller('swipeSelection', SwipeSelection);

}());
/*global angular*/
angular.module('pick-me').service('eventManager', ['$q', '$timeout', 'invoker', function ($q, $timeout, invoker) {
    'use strict';

    var self = this;
    
    self.getPhotos = function (eventId, count) {
        return invoker.invoke('event', 'getPhotos', { results: count }).then(function (result) {
            var photos = [], i;
            
            if (result.data) {
                for (i = 0; i < result.data.results.length; i += 1) {
                    photos.push({
                        description: result.data.results[i].user.location.city + ' - ' + result.data.results[i].user.location.state,
                        photo: result.data.results[i].user.picture.large
                    });
                }
            }
            
            return photos;
        });
    };
    
    self.discardPhoto = function () {
        
    };
    
    self.selectPhoto = function () {
        
    };
    
}]);
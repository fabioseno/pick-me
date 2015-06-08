/*global angular*/
angular.module('pick-me').constant('appConfig', {
    event: {
        getPhotos: {
            url: 'http://api.randomuser.me?results=:results',
            //url: 'http://localhost:8080/full/:sku',
            method: 'GET',
            access_type: 'ONLINE_NO_CACHE'
        }
    }
});
angular.module('pick-me', ['ionic', 'ui.router', 'starter.controllers', 'starter.services', 'ionic.contrib.ui.tinderCards'])

    .run(function($ionicPlatform) {
    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
        // for form inputs)
        if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleLightContent();
        }
    });
}).config(function($stateProvider, $urlRouterProvider) {

    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'components/login/login.html',
        controller: 'login as vm'
    }).state('register', {
        url: '/register',
        templateUrl: 'components/login/register.html',
        controller: 'register as vm'
    }).state('tab', {
        url: "/tab",
        abstract: true,
        templateUrl: "components/navigation/tabs.html"
    }).state('tab.friends', {
        url: '^/friends',
        views: {
            'tab-friends': {
                templateUrl: 'components/friends/friends.html',
                controller: 'friends as vm'
            }
        }
    }).state('tab.events', {
        url: '^/events',
        views: {
            'tab-events': {
                templateUrl: 'components/event/events.html',
                controller: 'events as vm'
            }
        }
    }).state('tab.event-photos', {
        url: '^/event/:event/photos',
        views: {
            'tab-events': {
                templateUrl: 'components/event/photos.html',
                controller: 'eventPhotos as vm'
            }
        }
    }).state('tab.event-swipe-photos', {
        url: '^/event/:event/swipe-photos',
        views: {
            'tab-events': {
                templateUrl: 'components/event/swipe-selection.html',
                controller: 'swipeSelection as vm'
            }
        }
    }).state('tab.dash', {
        url: '/dash',
        views: {
            'tab-dash': {
                templateUrl: 'templates/tab-dash.html',
                controller: 'DashCtrl'
            }
        }
    }).state('tab.chats', {
        url: '/chats',
        views: {
            'tab-chats': {
                templateUrl: 'templates/tab-chats.html',
                controller: 'ChatsCtrl'
            }
        }
    }).state('tab.chat-detail', {
        url: '/chats/:chatId',
        views: {
            'tab-chats': {
                templateUrl: 'templates/chat-detail.html',
                controller: 'ChatDetailCtrl'
            }
        }
    }).state('tab.account', {
        url: '/account',
        views: {
            'tab-account': {
                templateUrl: 'templates/tab-account.html',
                controller: 'AccountCtrl'
            }
        }
    });

    // if none of the above states are matched, use this as the fallback
    $urlRouterProvider.otherwise('/login');

});

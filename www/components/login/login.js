/*global angular*/
(function () {
    'use strict';

    function Login($state) {
        var vm = this;

        vm.login = function () {
            $state.go('tab.friends');
        };
    }

    Login.$inject = ['$state'];

    angular.module('pick-me').controller('login', Login);

}());
/*global angular*/
(function () {
    'use strict';

    function Register($state) {
        var vm = this;

        vm.register = function () {
            $state.go('tab.friends');
        };
    }

    Register.$inject = ['$state'];

    angular.module('pick-me').controller('register', Register);

}());
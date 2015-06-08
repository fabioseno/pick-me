/*global angular, CacheHandlerProvider*/

/**
    The wt-core module provides basic functionality present in most applications.

    @name Core
**/
angular.module('wt-core', []).config(['$httpProvider', function ($httpProvider) {
    'use strict';

    $httpProvider.interceptors.push('connectivityInterceptor');
    $httpProvider.interceptors.push('authenticationInterceptor');
    $httpProvider.interceptors.push('accessDeniedInterceptor');

}]).run(['cacheHandler', function (cacheHandler) {
    'use strict';
    
    cacheHandler.setProvider('localStorageProxy');
}]);
/*global angular*/

/**
    Set of operations to manipulate json data.

    @class jsonFormatter
**/
angular.module('wt-core').service('jsonFormatter', function () {
    'use strict';
    
    /**
        Validate if the data passed is a valid json.
    
        @name isJSON
        @param {String | Object} data Object to be validated.
    **/
    this.isJSON = function (data) {
        var isValid = true;
        
        if (typeof (data) !== 'object') {
            try {
                JSON.parse(data);
            } catch (e) {
                isValid = false;
            }
        }
        
        return isValid;
    };
    
    /**
        Convert data in json format to its string representation.
    
        @name wrap
        @param {String | Object} data Value to be converted.
    **/
    this.wrap = function (data) {
        return (angular.isString(data) ? data : JSON.stringify(data));
    };
    
    /**
        Convert data from string format to its json representation.
    
        @name unwrap
        @param {String | Object} data Value to be converted.
    **/
    this.unwrap = function (data) {
        return (this.isJSON(data) ? JSON.parse(data) : data);
    };
    
});
/*jslint nomen: true*/
/*global angular*/

/**
 * @name cacheHandler
 * @description The 'cacheHandler' service provides mechanism to cache data and reduce requests roundtrips.
 *
**/
angular.module('wt-core').service('cacheHandler', ['$injector', function ($injector) {
    'use strict';

    var cacheProviderName,
        cacheProvider,
        cacheRules = [],
        self = this,
        rule,
        now,
        i;

    /**
        @name setProvider
        @description Define which provider will be used to cache data. Should implement get and add methods

        @param {String} providerName Name of the provider.
    **/
    self.setProvider = function (providerName) {
        cacheProviderName = providerName;
        cacheProvider = $injector.get(cacheProviderName);
    };

    /**
        @name setCacheRules
        @description Define set of rules that will determine the cache expiration time.

        Expiration in minutes 
        [ 
            { 
                key: 'value1', 
                expiration: 5 
            }, 
            { 
                key: 'value2',
                expiration: 10
            }
        ]

        @param {Object} rules Object containing expiration times for different request.
    **/
    self.setCacheRules = function (rules) {
        cacheRules = rules;
    };

    /**
        @name setCacheRules
        @description Get the cached data considering its expiration time.

        @param {Object} key Value that uniquely identifies the data stored.
        @param {Object} data Object that represents the cached data.
    **/
    self.filterData = function (key, value) {
        var result;
        
        if (value && value.data) {
            result = value.data;
            
            if (cacheRules.length > 0) {
                now = new Date().getTime();

                for (i = 0; i < cacheRules.length; i += 1) {
                    rule = cacheRules[i];

                    if (key.indexOf(rule.key) >= 0) {
                        if (now - value.timestamp > rule.expiration * 60000) {
                            result = undefined;
                        }

                        break;
                    }
                }
            } else {
                result = value.data;
            }
        }

        return result;
    };

    /**
        @name thod cacheData
        @description Add data to the cache.

        @param {Object} cacheKey Value that uniquely identifies the data stored.
        @param {Object} data Object that represents the cached data.
    **/
    self.cacheData = function (cacheKey, data) {
        cacheProvider.add(cacheKey, { timestamp: new Date().getTime(), data: data });
    };

    /**
        @name getCachedData
        @description Get data from the cache.

        @param {Object} cacheKey Value that uniquely identifies the data stored.
    **/
    self.getCachedData = function (cacheKey) {
        var cachedData = cacheProvider.get(cacheKey);

        return self.filterData(cacheKey, cachedData);
    };

    /**
        @name clearCache
        @description Clear all data from the cache.
    **/
    self.clearCache = function () {
        cacheProvider.clear();
    };

}]);
/*global angular*/

/**
    The connectivity interceptor detects if an http request failed due to connection problems.

    @name connectivityInterceptor
**/
angular.module('wt-core').factory('connectivityInterceptor', ['$rootScope', '$q', function ($rootScope, $q) {
    'use strict';

    return {

        responseError: function (response) {
            if (response.status === 0) {
                $rootScope.$broadcast('DICONNECTED', response);
            }

            return $q.reject(response);
        }

    };

}]);
/*global angular*/

/**
    The eventHub service logs and broadcasts all events used throughout the application.
    
    @name eventHub
**/
angular.module('wt-core').service('eventHub', ['$rootScope', '$log', 'jsonFormatter', function ($rootScope, $log, jsonFormatter) {
    'use strict';
    
    this.fire = function (eventName, params) {
        var paramsMessage = '';
        
        if (arguments.length === 1) {
            paramsMessage = ' with no arguments';
        } else {
            paramsMessage = ' with arguments ' + jsonFormatter.wrap(Array.prototype.slice.call(arguments, 1));
        }
        
        $log.debug('[EVENT] - Calling event [' + eventName + ']' + paramsMessage);
        
        $rootScope.$broadcast.apply($rootScope, arguments);
    };
    
}]);
/*global angular*/

/**
    The 'httpProxy' service provides operations to access resources using the http protocol.

    @class httpProxy
**/
angular.module('wt-core').service('httpProxy', ['$http', '$cacheFactory', '$q', '$timeout', 'cacheHandler', 'jsonFormatter', function ($http, $cacheFactory, $q, $timeout, cacheHandler, jsonFormatter) {
    'use strict';

    /**
        Store the list of all http promise groups;
    **/
    var httpGroups = $cacheFactory('REQUEST_GROUPS'),

        /**
            Store the list of all http request defer objects;
        **/
        requests = [];

    /**
        Create a new object based on parameters returned by the response.

        @name packResponse
        @private
        @param {Object} data Response body.
        @param {Number} status Http status code of the response.
        @param {Object} headers Header getter function.
        @param {Object} config Configuration object used to generate the request.
    **/
    function packResponse(data, status, headers, config) {
        return {
            data: data,
            status: status,
            headers: headers,
            config: config
        };
    }

    function enqueueRequest(cacheKey, cacheable) {
        var defer = $q.defer();

        requests.push({ cacheKey: cacheKey, value: { defer: defer, cacheable: cacheable } });

        return defer.promise;
    }

    function dequeueRequest(success, cacheKey, promiseResult) {
        var cachedData = cacheHandler.getCachedData(cacheKey),
            request,
            i;
        
        for (i = requests.length - 1; i >= 0; i -= 1) {
            if (requests[i].cacheKey === cacheKey) {
                if (success) {
                    requests[i].value.defer.resolve(promiseResult);
                } else {
                    requests[i].value.defer.reject(promiseResult);
                }

                // clean up queue
                requests.splice(i, 1);
            }
        }
    }

    /**
        Success callback associated with the request. It caches response data if indicated to do so in the request config options.

        @name onSuccess
        @private
        @param {Object} data Response body.
        @param {Number} status Http status code of the response.
        @param {Object} headers Header getter function.
        @param {Object} config Configuration object used to generate the request.
    **/
    function onSuccess(data, status, headers, config) {
        var request,
            i;
        
        for (i = 0; i < requests.length; i += 1) {
            if (requests[i].cacheKey === config.cacheKey) {
                if (requests[i].value.cacheable === true) {
                    cacheHandler.cacheData(config.cacheKey, data);
                }

                dequeueRequest(true, config.cacheKey, packResponse(data, status, headers, config));
            }
        }
    }

    /**
        Error callback associated with the request

        @name onError
        @private
        @param {Object} data Response body.
        @param {Number} status Http status code of the response.
        @param {Object} headers Header getter function.
        @param {Object} config Configuration object used to generate the request.
    **/
    function onError(data, status, headers, config) {
        dequeueRequest(false, config.cacheKey, packResponse(data, status, headers, config));
    }

    /**
        Convert the http request options to a string representation to be used as a unique identifier (except for the same requests) in the cache key.

        @name buildKey
        @private
        @param {Object} config Request configuration.
    **/
    this.buildKey = function (config) {

        if (!config.data) {
            config.data = '';
        }

        var token = config.url + jsonFormatter.wrap(config.data);
        return token;
    };

    /**
        Execute the http request.

        @name hit
        @param {Object} options Configuration object used to generate the request.
        @param {boolean} forceHit Force request ignoring cached data.
        @param {boolean} updateCache Update cache after data is retrieved.
    **/
    this.hit = function (options, forceHit, updateCache) {

        options.cacheKey = this.buildKey(options);
        
        var cachedData = cacheHandler.getCachedData(options.cacheKey),
            defer,
            group,
            i;

        //updateCache = forceHit || updateCache;
        forceHit = forceHit || !cachedData;

        if (updateCache) {
            options.cacheable = updateCache;
        }
        
        if (!options.timeout) {
            if (!options.groupName) {
                options.groupName = 'default';
            }

            group = httpGroups.get(options.groupName);
            
            if (!group) {
                defer = $q.defer();

                httpGroups.put(options.groupName, { defer: defer });
            } else {
                defer = group.defer;
            }

            options.timeout = defer.promise;
        }

        if (forceHit) {
            $http(options).success(onSuccess).error(onError);
        } else {
            $timeout(function () {
                dequeueRequest(true, options.cacheKey, packResponse(cachedData, 304, angular.noop, options));
            });
        }

        return enqueueRequest(options.cacheKey, updateCache);
    };

    this.cancelHit = function (groupName) {
        var group, i;

        if (!groupName) {
            groupName = 'default';
        }

        group = httpGroups.get(groupName);
        
        if (group) {
            group.defer.resolve('Http request cancelled!');
            httpGroups.remove(groupName);
        }
    };

}]);
/*global angular*/
angular.module('wt-core').service('invoker', ['httpProxy', 'eventHub', function (httpProxy, eventHub) {
    'use strict';

    var configuration;

    function mapParameters(url, parameters) {
        var extra = [],
            param,
            result = url.replace(/:(\w+)/g, function (substring, match) {
                parameters = parameters || {};

                var routeValue = parameters[match];
                if (!routeValue) {
                    routeValue = ':' + match;
                }
                return routeValue;
            });

        // if we missed a value completely, then throw again
        if (result.indexOf("/:") > 0) {
            throw "not all route values were matched";
        }

        // finally attach query string parameters if necessary
        return (extra.length === 0) ? result : result + "?" + extra.join("&");
    }

    this.setConfiguration = function (config) {
        configuration = config;
    };

    this.invoke = function (service, action, data, onStart) {

        if (!configuration) {
            return;
        }

        var parameters = configuration[service][action],
            forceHit = false,
            updateCache = false,
            config = {
                url: parameters.url,
                method: parameters.method,
                data: data
            },
            promise,
            param,
            invokerPromise;

        // replace route paramaters with parameters coming from post parameters
        config.url = mapParameters(config.url, data);

        // default value for access type
        if (!parameters.access_type) {
            parameters.access_type = 'ONLINE';
        }

        if (parameters.access_type === 'ONLINE') {
            forceHit = true;
        } else if (parameters.access_type === 'ONLINE_WITH_CACHE') {
            updateCache = true;
        }
        
        if (onStart) {
            onStart();
        }

        return httpProxy.hit(config, forceHit, updateCache);

//        invokerPromise = {
//            success: function (onSuccess) {
//                promise.then(function (result) {
//                    onSuccess(result.data);
//                });
//
//                return invokerPromise;
//            },
//
//            error: function (onError) {
//                promise.then(null, function (error) {
//                    onError(error.data);
//                });
//
//                return invokerPromise;
//            },
//
//            end: function (onEnd) {
//                promise['finally'](onEnd);
//
//                return invokerPromise;
//            }
//        };
//
//        return invokerPromise;
    };
}]);
/*global angular*/

/**
    The '$exceptionHandler' service overrides the default Angular's exception handler behaviour.
    This service is purposely named with the same name as the Angular's exception handler service (ng.$exceptionHandler) which allows the default service behaviour to be extended.

    @name exceptionHandler
**/
angular.module('wt-core').factory('$exceptionHandler', ['$injector', function ($injector) {
    'use strict';

    return function (exception, cause) {

        var $log = $injector.get('$log'),
            eventHub = $injector.get('eventHub');

        $log.error(exception.message);
        eventHub.fire('APPLICATION_ERROR', exception.message, exception.stack);
    };
}]);
/*global angular*/

/**
    The accessDeniedInterceptor detects if a http request was unauthorized.

    @name accessDeniedInterceptor
**/
angular.module('wt-core').factory('accessDeniedInterceptor', ['$rootScope', '$q', function ($rootScope, $q) {
    'use strict';

    return {

        responseError: function (response) {
            if (response.status === 401) {
                $rootScope.$broadcast('UNAUTHORIZED', response);
            }

            return $q.reject(response);
        }

    };

}]);
/*global angular*/

/**
    The authentication service is a client proxy to the server authentication mechanism.

    @name authentication
**/
angular.module('wt-core').service('authentication', function () {
    'use strict';
    
    var sessionId = '';
    
    this.getSessionId = function () {
        return sessionId;
    };
    
    this.setSessionId = function (id) {
        sessionId = id;
    };
    
    this.context = {};
    
    this.clearSession = function () {
        sessionId = '';
        this.context = {};
    };
    
});
/*global angular*/

/**
    The authenticationInterceptor wraps up the session id expected by the server.

    @name authenticationInterceptor
**/
angular.module('wt-core').factory('authenticationInterceptor', ['authentication', function (authentication) {
    'use strict';
    
    return {
        
        request: function (config) {
            var sessionId = authentication.getSessionId();
            
            if (sessionId) {
                config.headers.SessionId = sessionId;
            }
            
            return config;
        }
        
    };
    
}]);
/*global angular*/

/**
    Provide operations for the new HTML5 local storage feature.

    @class localStorageProxy
**/
angular.module('wt-core').service('localStorageProxy', ['$window', 'jsonFormatter', function ($window, jsonFormatter) {
    'use strict';
    
    /**
        Clear all entries in the local storage.
    
        @name clear
    **/
    this.clear = function () {
        $window.localStorage.clear();
    };
    
    /**
        Retrieve a specific entry in the local storage.
    
        @name get
        @param {Object} key Value that uniquely identifies the data stored.
        @return {Object} Value stored in the session storage entry.
    **/
    this.get = function (key) {
        return jsonFormatter.unwrap($window.localStorage.getItem(jsonFormatter.wrap(key)));
    };
    
    /**
        Retrieve all entries in the local storage.
    
        @name getAll
        @return {Object} Object containing all the values stored in the local storage.
    **/
    this.getAll = function () {
        var i, result = {}, key;
        
        for (i = 0; i < $window.localStorage.length; i += 1) {
            key = $window.localStorage.key(i);
            
            result[key] = $window.localStorage.getItem(key);
        }
        
        return result;
    };
    
    /**
        Add an entry to the local storage.
    
        @name add
        @param {String | Object} key Value that uniquely identifies the data stored.
        @param {Object} value Object that represents the object stored.
    **/
    this.add = function (key, value) {
        $window.localStorage.setItem(jsonFormatter.wrap(key), jsonFormatter.wrap(value));
    };
    
    /**
        Remove an entry from the local storage.
    
        @name remove
        @param {String | Object} key Value that uniquely identifies the data stored.
    **/
    this.remove = function (key) {
        $window.localStorage.removeItem(jsonFormatter.wrap(key));
    };
    
}]);
/*global angular*/

/**
    Provide operations for the new HTML5 session storage feature.

    @class sessionStorageProxy
**/
angular.module('wt-core').service('sessionStorageProxy', ['$window', 'jsonFormatter', function ($window, jsonFormatter) {
    'use strict';
    
    /**
        Clear all entries in the session storage.
    
        @name clear
    **/
    this.clear = function () {
        $window.sessionStorage.clear();
    };
    
    /**
        Retrieve a specific entry in the session storage.
    
        @name get
        @param {Object} key Value that uniquely identifies the data stored.
        @return {Object} Value stored in the session storage entry.
    **/
    this.get = function (key) {
        return jsonFormatter.unwrap($window.sessionStorage.getItem(jsonFormatter.wrap(key)));
    };
    
    /**
        Retrieve all entries in the session storage.
    
        @name getAll
        @return {Object} Object containing all the values stored in the session storage.
    **/
    this.getAll = function () {
        var i, result = {}, key;
        
        for (i = 0; i < $window.sessionStorage.length; i += 1) {
            key = $window.sessionStorage.key(i);
            
            result[key] = $window.sessionStorage.getItem(key);
        }
        
        return result;
    };
    
    /**
        Add an entry to the session storage.
    
        @name add
        @param {String | Object} key Value that uniquely identifies the data stored.
        @param {Object} value Object that represents the object stored.
    **/
    this.add = function (key, value) {
        $window.sessionStorage.setItem(jsonFormatter.wrap(key), jsonFormatter.wrap(value));
    };
    
    /**
        Remove an entry from the session storage.
    
        @name remove
        @param {String | Object} key Value that uniquely identifies the data stored.
    **/
    this.remove = function (key) {
        $window.sessionStorage.removeItem(jsonFormatter.wrap(key));
    };
    
}]);
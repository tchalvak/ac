/*
 Simple mock for socket.io
 see: https://github.com/btford/angular-socket-io-seed/issues/4
 thanks to https://github.com/southdesign for the idea
 */
var SocketMock = function($rootScope) {
    this.events = {};
    this.emits = {};
    var that = this;
    return {
        init: function () {},
        on: function (eventName, callback) {
            if (!that.events[eventName]) that.events[eventName] = [];
            that.events[eventName].push(callback);
        },
        emit: function (eventName) {
            var args = Array.prototype.slice.call(arguments, 1);

            if (!that.emits[eventName])
                that.emits[eventName] = [];
            that.emits[eventName].push(args);
        },
        receive: function (eventName) {
            var args = Array.prototype.slice.call(arguments, 1);

            if (that.events[eventName]) {
                angular.forEach(that.events[eventName], function (callback) {
                    $rootScope.$apply(function () {
                        callback.apply(that, args);
                    });
                });
            }
        }
    };
};

/**
* Mock the initial querying of tasks
*
* @param $q
*/
var MockTasklistService = function ($q) {
    this.data = [
        {
            __v: 0,
            _id: "5458888a70b39cf36ca711e7",
            content: "testContent",
            created: "2014-11-04T08:04:26.526Z",
            title: "testTitle",
            user: {
                _id: "5434f0215d1bbcf87764b996",
                name: "Logan Etherton",
                username: "loganetherton"
            },
            team: 1,
            $$hashKey: 'object:12'
        },
        {
            __v: 0,
            _id: "545882cc37f38bcf69f0b82d",
            content: "testContent2",
            created: "2014-11-04T08:04:26.526Z",
            title: "testTitle2",
            user: {
                _id: "5434f0215d1bbcf87764b996",
                name: "Logan Etherton",
                username: "loganetherton"
            },
            team: 2,
            $$hashKey: 'object:13'
        }
    ];

    var that = this;

    return {
        // Mock init method
        init: function () {
            var defer = $q.defer();
            defer.resolve(that.data);
            return defer.promise;
        }
    };
};

/**
 * Mock task insertion
 * @param $q
 * @returns {{create: Function}}
 * @constructor
 */
var MockTaskInsertService = function ($q) {
    // Fake something to return
    this.created = {user: "5434f0215d1bbcf87764b996", title: "mock title", content: "mock content", dependencies: []};
    var that = this;

    return {
        // Mock the create method
        create: function () {
            var deferred = $q.defer();
            deferred.resolve(that.created);
            return deferred.promise;
        }
    };
};
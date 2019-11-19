(function(angular) {
'use strict';

// ToDo:
// Management of Notifications:
// A) Use console (eventually reportStatus or reportError)
// B) Log php messages
// C) Provide consistent error codes

// Popover will be removed again...
// Find appropriate place for AuthService status popover
// Check report of Http - failures

// See:
// https://angular.io/guide/styleguide

var app = angular.module('globalModule');



////////////////////////////////////////////////////////////////////////////////
app.factory('AuthService', function($http, $rootScope) {

    var loginToken = '';

    ////////////////////////////////////////////////////////////////////////////
    // Surveillance of last http-response-status
    ////////////////////////////////////////////////////////////////////////////
    var httpResponseStatus = {
        success: false,
        code: 0,
        file: '',
        line: 0,
        insertId: 0,
        message: ''
    };

    var resetResponseStatus = function(){
        httpResponseStatus.success = false;
        httpResponseStatus.code = 0;
        httpResponseStatus.file = ' ';
        httpResponseStatus.line = 0;
        httpResponseStatus.insertId = 0;
        httpResponseStatus.message = ' ';
    }
    
    var setResponseStatus = function(response, success) {
        var status = response.data.status;
        
        httpResponseStatus.success = success;
        httpResponseStatus.code = status.code;
        httpResponseStatus.file = status.file;
        httpResponseStatus.line = status.line;
        httpResponseStatus.insertId = status.insert_id;
        httpResponseStatus.message = status.message;
        
        notifyStatusObservers();
    }
    
    
    // Required for authStatusPopover
    var statusObserver = [];
    var notifyStatusObservers = function(){
        angular.forEach(statusObserver, function(callback){
            callback();
        });
    }
    
    var registerStatusObserver = function(callback){
        statusObserver.push(callback);
    }
    
    var deRegisterStatusObserver = function(callback){
            statusObserver = statusObserver.filter(function(e){
                                return e != callback; });
    }
    
    
    ////////////////////////////////////////////////////////////////////////////
    // User data
    ////////////////////////////////////////////////////////////////////////////
    var userData = {
        activeUsers : [],
        allUsers : [],
        userRoles : [],
        defaultUserRole : undefined,
        userDataSet : []
    };
    


    ////////////////////////////////////////////////////////////////////////////
    // Eventually watch activeUserNames 
    // Active users:  expirdate > curdate
    ////////////////////////////////////////////////////////////////////////////
    
    var getActiveUsers = function(){
        
        var data = { 
            action: 'get_active_user_names' 
        };
        
        $http.post('authActions.php', data).then(function(response){
            userData.activeUsers = response.data.result;
        }, function(response){
            console.warn('[AuthService] getActiveUsers failed: ' 
                + response.status + ' (' + response.statusText + ')');
        }, function(response){
            console.info('[AuthService] getActiveUsers: Notification');
        }).catch(function (error) {
            console.error('[AuthService] getActiveUsers exception: ' + error.status);
        });
    }

    // All users (including expired accounts)
    var getAllUsers = function(){
        
        var data = { 
            action: 'get_user_table' 
        };
        
        $http.post('authActions.php', data).then(function(response){
                userData.allUsers = response.data.result;
                //notifyRegisteredUserObservers();
            }, function(response){
                console.warn('[AuthService] getAllUsers failed: '
                    + response.status + ' (' + response.statusText + ')');
        });
    }
    
    
    var getUserRoles = function(){
        
        var data = { 
            action: 'get_user_roles' 
        };
        
        $http.post('authActions.php', data).then(function(response){
            userData.userRoles = response.data.result;
            // ToDo: Default user role should possible be defined somewhere else
            userData.defaultUserRole = userData.userRoles[4];
        },function(response){
            console.warn('[AuthService] getUserRoles failed: '
                + response.status + ' (' + response.statusText + ')');
        });
    }


    
    ////////////////////////////////////////////////////////////////////////////
    // Post and receive data via http
    ////////////////////////////////////////////////////////////////////////////
    
    var updateUserData = function(u) {
        
        var user = {
            userId: u.id,
            userName : u.userName,
            userExpirDate : u.expirDate,
            userRole : u.role,
            userFirstName: u.firstName,
            userLastName: u.lastName,
            userExternalId: u.externalId
        };

        var data = {
            action: 'update_user_registration',
            user: user
        };
        
        $http.post('authActions.php', data).then(function(response){
            setResponseStatus(response, true);
            getAllUsers();      // notifies userDataTable
        }, function(response){
            setResponseStatus(response, false);
            console.warn('[AuthService] updateUserData failed: (' 
                        + response.status + ') ' + response.statusText);
        });
    }
    
    var registerNewUser = function(userName, userRole, userFirstName,
            userLastName, userExternalId, accountExpirDate,
            callback){
            
        var user = {
            userName: userName,
            userRole: userRole,
            firstName: userFirstName,
            lastName: userLastName,
            externalId: userExternalId,
            expirDate: accountExpirDate
        };
        
        var data = {
            action: 'register_new_user',
            user: user
        };
        
        $http.post('authActions.php', data).then(function(response){
            
                setResponseStatus(response, true);
                
                // Registration success
                if(response.data.result.insert){
                    // Typeaheads
                    getActiveUsers();
                    // userDataTable will be notified upon ???
                    getAllUsers();
                    var result = {
                        insert: true,
                        userId : response.data.status.insert_id,
                        passWord : response.data.result.passWord,
                        message : 'User registration success'
                    };
                    callback(result);
                } else {
                    var result = {
                        insert: false,
                        userId : -1,
                        passWord : '',
                        exist : response.data.result.exist,
                        message: response.data.result.message
                    };
                    callback(result);
                    console.warn('[AuthService]: ' + response.data.result.message);
                }
                
            },function(response){
                setResponseStatus(response, false);
                console.warn('[AuthService] registerNewUser failed: (' 
                    + response.status + ') ' + response.statusText);
                    
                var result = {
                    insert: false,
                    userId : -1,
                    passWord : '',
                    message: response.data.result.message
                };
                callback(result);
        });
    }
    
    
    var updateUserPassword = function(userId, oldPassWord, newPassWord){
        
        var user = {
            userId: userId,
            oldPassWord : oldPassWord,
            newPassWord : newPassWord
        };
        
        var data = {
            action: 'update_user_password',
            user: user
        };
        
        var result = {
            update : false,
            message: ''
        }
        
        $http.post('authActions.php', data).then(function(response){
            setResponseStatus(response, true);
            console.debug('[AuthService] updateUserPassword updated: ' 
                + response.data.result.update 
                + ' (' + response.data.status.message + ')');
                
                result.update = response.data.result.update;
                result.message = response.data.status.message;
                result.failed = !result.update;
                
            }, function(response){
                setResponseStatus(response, false);
                console.warn('[AuthService] updateUserPassword failed: (' 
                    + response.status + ') ' + response.statusText);
            }
        );
        
        return result;
    }
    
    
    var resetUserPassword = function(userId, callback){
    
        var data = {
            action: 'reset_user_password',
            data: { userId: userId }
        };
        
        $http.post('authActions.php', data).then(function(response){
            callback(response.data.result);
            setResponseStatus(response, true);
        }, function(response){
            setResponseStatus(response, true);
            console.warn('[AuthService] resetUserPassword failed: (' 
                + response.status + ') ' + response.statusText);
        });
    }

    
    ////////////////////////////////////////////////////////////////////////////
    // User data
    ////////////////////////////////////////////////////////////////////////////

    
    var getUserDataSet = function(userId, callback){
        
        var userData = {
            userId : userId
        };
        
        var data = {
            action: 'get_user_data',
            userData: userData
        };
        
        $http.post('authActions.php', data).then(function(response){
            setResponseStatus(response, true);
            callback(response.data.result);
        }, function(response){
            console.warn('[AuthService] getUserDataSet failed: (' 
                + response.status + ') ' + response.statusText);
            console.debug(response);
        });
    }

    var getUserLoginTable = function(userId, callback){
        
        var data = {
            action: 'get_user_login_table',
            userData: { userId : userId }
        };
        
        $http.post('authActions.php', data).then(function(response){
            setResponseStatus(response, true);
            if(response.data.result === null){
                callback(null);
            } else {
                callback(response.data.result);
            }
            
        }, function(response){
            setResponseStatus(response, false);
            console.log('[AuthService] getUserLoginTable Error:');
            console.log(response);
            
        });
    }


    // Clients will be notified upon user changes
    var registeredUserObserver = [];
    var notifyRegisteredUserObservers = function(){
        angular.forEach(registeredUserObserver, function(callback){
            callback();
        });
    };
    var registerUserObserver = function(callback){
        registeredUserObserver.push(callback);
    };
    var deRegisterUserObserver = function(callback){
        registeredUserObserver = registeredUserObserver.filter(function(e){ 
            return e != callback;
        });
    };
    



    ////////////////////////////////////////////////////////////////////////////
    // Manage login status
    ////////////////////////////////////////////////////////////////////////////
    
    var checkLastLogin = function(){
        
        var data = {
            action: 'check_last_login',
            loginToken : loginToken
        }
    
        $http.post('authActions.php', data).then(function(response){
            
            console.debug('[checkLastLogin]:');
            console.debug(response);

        }, function(response){
            console.warn('[checkLastLogin] failed: (' 
                + response.status + ') ' + response.statusText);
        });
    }

    var refreshLoginTimer = function(){
        
        var data = {
            action: 'reset_login_expir',
            loginToken : loginToken
        }
    
        $http.post('authActions.php', data).then(function(response){
            
            console.debug('[refreshLoginTimer]:');
            console.debug(response);

        }, function(response){
            console.warn('[refreshLoginTimer] failed: (' 
                + response.status + ') ' + response.statusText);
        });
    }
    
    var saveLogin = function(userName, password, callback){
            
        var loginData = {
            userName : userName,
            password : password
        };
        
        var data = {
            action: 'user_login',
            loginData: loginData
        };
        
        $http.post('authActions.php', data).then(function(response){
            setResponseStatus(response, true);
            
            // ToDo: Check this
            loginToken = response.data.result.loginToken;
            // response.data.result.login = true | false
            callback(response.data.result);

            
        }, function(response){
            console.warn('[AuthService] login failed: (' 
                + response.status + ') ' + response.statusText);
            console.debug(response);
            
            // ToDo: Logout?
        });
        
    };

    
    var saveLogout = function(){
        var data = {
            action: 'user_logout'
        }
        
        $http.post('authActions.php', data).then(function(response){
            loginToken = '';
        }, function(response){
            console.warn('[logout] failed: (' 
                + response.status + ') ' + response.statusText);
        });
        
        // ToDo: logout must only be called from Session
        // Session.logout();
        
    }
    
    

    
    return {
        getUserData: function() { return userData; },
        saveLogin: saveLogin,
        saveLogout: saveLogout,
        responseStatus: httpResponseStatus,
        getUserDataSet: getUserDataSet,
        updateUserData: updateUserData,
        getUserLoginTable : getUserLoginTable,
        getUserRoles: function() { return userRoles; },
        registerNewUser: registerNewUser,
        updateUserPassword: updateUserPassword,
        resetUserPassword: resetUserPassword,
        refreshLoginTimer: refreshLoginTimer,
        // Register observers of httpResponseStatus
        registerStatusObserver: registerStatusObserver,
        deRegisterStatusObserver: deRegisterStatusObserver, 
        // For test purposes
        checkLastLogin : checkLastLogin,
        
        getActiveUsers: getActiveUsers,
        getAllUsers: getAllUsers,   // Triggers retrieval of table
        getUserRoles: getUserRoles,
        getUser : function(userName) {
            var idx = users.findIndex(user => user.name == userName);
            if(idx < 0)
                return null;
            return users[idx];
        },
        registerUserObserver : registerUserObserver,
        deRegisterUserObserver : deRegisterUserObserver

    }
});




////////////////////////////////////////////////////////////////////////////////
app.factory('Session', function(AuthService, $interval){
    
    // Session status
    var status = {

        login : false,
        message : '',
        loginToken : '',
        timer : '00:00',
        
        credentials: {
            userId: 0,
            userName : '(logout)',
            roleId : 0,
            roleName : '(logout)',
            roleNames : ['anonymous']
        }
    };

    var setLogin = function(data) {
        status.login = data.login;
        status.message = 'Login success';
        status.loginToken = data.loginToken;
        
        status.credentials.userId = data.userId;
        status.credentials.userName = data.userName;
        status.credentials.roleId = data.roleId;
        status.credentials.roleName = data.roleName;
        status.credentials.roleNames = data.roleNames;
        startCountDown();
    };

    var setLogout = function(){
        status.login = false;
        status.message = 'User logout';
        status.loginToken = '';
        status.loginexpire = new Date();
        
        status.credentials.userId = 0;
        status.credentials.userName = '(logout)';
        status.credentials.roleId = 0;
        status.credentials.roleName = '(logout)';
        status.credentials.roleNames = ['anonymous'];
        stopCountDown();
    }
    
    ////////////////////////////////////////////////////////////////////////////
    // Notification of clients (e.g. login or logout)
    ////////////////////////////////////////////////////////////////////////////
    var statusObserver = [];
    var notifyStatusObservers = function(){
        angular.forEach(statusObserver, function(callback){
            callback();
        });
    }
    var registerStatusObserver = function(callback){
        statusObserver.push(callback);
    }
    
    var deRegisterStatusObserver = function(callback){
        statusObserver = statusObserver.filter(function(e){
            return e != callback; });
    }
    
    
    ////////////////////////////////////////////////////////////////////////////
    // Session timer
    ////////////////////////////////////////////////////////////////////////////
    const sessionTimeout = 600 // seconds
    
    var restTime = 0;
    var intervalId = 0;
    
    // Adds leading zero when required
    var refreshTimer = function(){
        var min = Math.trunc(restTime/60);
        var sec = restTime - (min * 60);
        status.timer = ('0' + min).slice(-2) + ':' + ('0' + sec).slice(-2);
    }

    // Seconds-counter; will periodically be called
    var tick = function() {
        restTime -= 1;
        refreshTimer();
        if(restTime <= 0){
            logout();
        }
    }
    
    // Will be called upon login and timer-reset
    var startCountDown = function(){
        restTime = sessionTimeout;
        refreshTimer();
        if(intervalId){
            $interval.cancel(intervalId);
        }
        intervalId = $interval(tick, 1000);
    }

    // Will be called upon logout
    var stopCountDown = function(){
        if(intervalId){
            $interval.cancel(intervalId);
            intervalId = 0;
        }
        restTime = 0;
        status.timer = '00:00';
    }
    
    var resetSessionTimer = function(){
        if(status.login){
            startCountDown();
        }
    }
    
    var refreshLoginTimer = function(){
        if(!status.login){
            return;
        }
        startCountDown();
        AuthService.refreshLoginTimer();
    }
    
    ////////////////////////////////////////////////////////////////////////////
    // User data
    ////////////////////////////////////////////////////////////////////////////
    
    var userData = AuthService.getUserData();
    
    var getActiveUsers = function(){
        if(userData.activeUsers.length == 0){
            AuthService.getActiveUsers();
        }
        return userData;
    }
    
    var getAllUsers = function(){
        
        // User table will be inserted asynchronically into 
        // AuthService object.
        if(userData.allUsers.length == 0){
            AuthService.getAllUsers();
        }
        return userData;
    }
    
    // Only executed upon init, as currently there is no way to add roles
    // via html
    var getUserRoles = function(){
        if(userData.userRoles.length==0){
            AuthService.getUserRoles();
        }
        return userData;
    }
    
    
    ////////////////////////////////////////////////////////////////////////////
    var userLoginTable = { logins : [] };
    
    var setUserLoginTable = function(response){
        userLoginTable.logins = response;
    }
    
    var clearUserLoginTable = function(){
        userLoginTable.logins = [];
    }
    
    var getUserLoginTable = function(){
        
        if(status.credentials.userId > 0){
            AuthService.getUserLoginTable(status.credentials.userId, 
                setUserLoginTable);
        } else {
            clearUserLoginTable();
        }
    }
    getUserLoginTable();
    registerStatusObserver(getUserLoginTable);
    



    
    ////////////////////////////////////////////////////////////////////////////
    // Public functions
    ////////////////////////////////////////////////////////////////////////////
    
    var authorised = function(requiredRole){
        if(!status.login)
            return false;
        // Returns true, when the required role is listed in user-roles
        return status.credentials.roleNames.indexOf(requiredRole) !== -1;
    }

    
    
    var logout = function(){
        setLogout();
        AuthService.saveLogout();
        notifyStatusObservers();
    }
    
    var sessionLogin = function(data){
        
        if(data.login){
            setLogin(data);
        } else {
            setLogout();
            status.message = data.message;
        }
        notifyStatusObservers();
    }
    
    var login = function(userName, passWord){
        AuthService.saveLogin(userName, passWord, sessionLogin);
    }
    
    
    
    return {
        getStatus: function() { return status; },
        login : login,
        logout : logout,
        authorised : authorised,
        getLoginToken : function() { return status.loginToken; },
        getCredentials : function() { return status.credentials; },
        isLogin : function() { return status.login; },
        unCertified : function() { return !status.login; },
        resetSessionTimer : resetSessionTimer,
        userId : function() { return status.credentials.userId; },
        userName : function() { return status.credentials.userName; },
        userRoleId : function() { return status.credentials.roleId; },
        userRoleName: function() { return status.credentials.roleName; },
        usrAuthRoles: function() { return status.credentials.roleNames; },
        
        getUserData : function() { return userData; },
        getUserLoginTable : function() { return userLoginTable; },
        registerStatusObserver: registerStatusObserver,
        deRegisterStatusObserver: deRegisterStatusObserver,
        getActiveUsers: getActiveUsers,
        getAllUsers: getAllUsers,
        getUserRoles : getUserRoles,
        registerUserObserver : AuthService.registerUserObserver,
        deRegisterUserObserver : AuthService.deRegisterUserObserver,
        updateUserPassword: AuthService.updateUserPassword,
        getUserDataSet: function(callback) {
            return AuthService.getUserDataSet(status.credentials.userId, callback);
        },
        updateUserData : AuthService.updateUserData,
        resetUserPassword : AuthService.resetUserPassword,
        refreshLoginTimer: refreshLoginTimer,
        checkLastLogin: AuthService.checkLastLogin,
        registerNewUser: AuthService.registerNewUser
    };
});


})(window.angular);


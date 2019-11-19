(function(angular) {
'use strict';

var app = angular.module('globalModule');

var getBlockNodes = function (nodes) {
    var node = nodes[0];
    var endNode = nodes[nodes.length - 1];
    var blockNodes = [node];

    do {
        node = node.nextSibling;
        if (!node) break;
        blockNodes.push(node);
    } while (node !== endNode);

    return angular.element(blockNodes);
}


////////////////////////////////////////////////////////////////////////////////
app.directive('authStatusPopover', function(AuthService){
    return {
        restrict: 'A',
        scope: true,
        link: function(scope, element, attr){
            
            scope.status = AuthService.responseStatus;
            
            scope.updateSessionStatus = function(){
                scope.content = '<div style="width:500px"><div class="row">'
                + '<div class="col-2">Success</div><div class="col-10">' 
                + scope.status.success
                + '</div></div><div class="row"><div class="col-2">Code</div><div class="col-10">'
                + scope.status.code
                + '</div></div><div class="row"><div class="col-2">File</div><div class="col-10">'
                + scope.status.file
                + '</div></div><div class="row"><div class="col-2">Line</div><div class="col-10">'
                + scope.status.line
                + '</div></div><div class="row"><div class="col-2">Insert-id</div><div class="col-10">'
                + scope.status.insertId
                + '</div></div><div class="row"><div class="col-2">Message</div><div class="col-10">'
                + scope.status.message
                + '</div></div></div>';
                
                element.attr('data-content', scope.content);
            }
            
            element.popover({
                trigger: 'hover',
                title: '<strong>Authentification Service status</strong>',
                html: true,
                placement: 'right',
                container: 'body'
            });
            
            AuthService.registerStatusObserver(scope.updateSessionStatus);
            scope.updateSessionStatus();
        }
    };
});

////////////////////////////////////////////////////////////////////////////////
app.directive('authIfLogin', function($animate, $compile, Session){
    return {
        multiElement: true,
        transclude: 'element',
        priority: 600,
        terminal: true,
        restrict: 'A',
        $$tlb: true,
        link: function($scope, $element, $attr, ctrl, $transclude) {
            var block, childScope, previousElements;
            var authStatus = Session.getStatus();
            var attrLogin = ($attr.authIfLogin.toLowerCase() === 'true');

            var includeElement = function(){
                if (!childScope) {
                    $transclude(function(clone, newScope) {
                        childScope = newScope;
                        clone[clone.length++] = $compile.$$createComment('end authIfLogin', $attr.authIfLogin);
                        block = {
                            clone: clone
                        };
                        $animate.enter(clone, $element.parent(), $element);
                    });
                }
            }
            
            var removeElement = function() {
                
                if (previousElements) {
                    previousElements.remove();
                    previousElements = null;
                }
                if (childScope) {
                    childScope.$destroy();
                    childScope = null;
                }
                if (block) {
                    previousElements = getBlockNodes(block.clone);
                    $animate.leave(previousElements).then(function() {
                        previousElements = null;
                    });
                    block = null;
                }
            }

            var loginChange = function() {
                if(attrLogin){
                    if(authStatus.login){
                        includeElement();
                    } else {
                        removeElement();
                    }
                } else {
                    if(authStatus.login){
                        removeElement();
                    } else {
                        includeElement();
                    }
                }
            };
            Session.registerStatusObserver(loginChange);
            loginChange();
        }   // link
    };      // return 
});   



////////////////////////////////////////////////////////////////////////////////
app.directive('authRoleEnable', function(Session){
    return {
        resrict: 'A',
        scope: true,
        link: function(scope, element, attr){
            var loginChange = function(){
                if(Session.authorised(attr.authRoleEnable)) {
                    element.attr('disabled', false);
                } else {
                    element.attr('disabled', true);
                }
            };
            Session.registerStatusObserver(loginChange);
            loginChange();
        }
    }
});

////////////////////////////////////////////////////////////////////////////////
app.directive('authIfRole', function($animate, $compile, Session) {
    return {
        multiElement: true,
        transclude: 'element',
        priority: 600,
        terminal: true,
        restrict: 'A',
        $$tlb: true,
        link: function($scope, $element, $attr, ctrl, $transclude) {
            var block, childScope, previousElements;
            var auth = Session.getCredentials();
            var requiredRole = $attr.authIfRole;
            
            var includeElement = function(){
                if (!childScope) {
                    $transclude(function(clone, newScope) {
                        childScope = newScope;
                        clone[clone.length++] = $compile.$$createComment('end authIfRole', $attr.authIfRole);
                        block = {
                            clone: clone
                        };
                        $animate.enter(clone, $element.parent(), $element);
                    });
                }
            }
            
            var removeElement = function() {
                if (previousElements) {
                    previousElements.remove();
                    previousElements = null;
                }
                if (childScope) {
                    childScope.$destroy();
                    childScope = null;
                }
                if (block) {
                    previousElements = getBlockNodes(block.clone);
                    $animate.leave(previousElements).then(function() {
                        previousElements = null;
                    });
                    block = null;
                }
            }

            var loginChange = function(){
                if(Session.authorised(requiredRole)) {
                    includeElement();
                } else {
                    removeElement();
                }

            };
            Session.registerStatusObserver(loginChange);
            loginChange();
        }   // link
    };      // return
});         // directive




////////////////////////////////////////////////////////////////////////////////
app.directive('loginStatusPopover', function(Session){
    return {
        restrict: 'A',
        scope: true,
        link: function(scope, element, attr){
            
            scope.status = Session.getStatus();
            
            scope.updateSessionStatus = function(){
                scope.content = '<div class="row" style="width:300px"><div class="col-md-4">'
                + '<div>Login</div><div>User role</div><div>Message</div></div>'
                + '<div class="col-md-8"><div>' 
                + scope.status.login
                + '</div><div>'
                + scope.status.credentials.roleName
                + '</div><div>'
                + scope.status.message
                + '</div></div></div>';
                
                element.attr('data-content', scope.content);
            }
            
            element.popover({
                trigger: 'hover',
                title: '<strong>Last login</strong>',
                html: true,
                placement: 'right',
                container: 'body'
            });
            
            Session.registerStatusObserver(scope.updateSessionStatus);
            scope.updateSessionStatus();
        }
    };
});

////////////////////////////////////////////////////////////////////////////////
app.directive('userName', function(Session){
    return {
        restrict: 'A',
        template: '{{ credentials.userName }}',
        link: function(scope, element, attrs){
            scope.credentials = Session.getCredentials();
        }
    }
});

////////////////////////////////////////////////////////////////////////////////
app.directive('loginStatusMessage', function(Session){
    return {
        restrict: 'A',
        template: '{{ status.response.message }}',
        link: function(scope, element, attrs){
            scope.status = Session.getStatus();
        }
    }
});

////////////////////////////////////////////////////////////////////////////////
app.directive('userRoleName', function(Session){
    return {
        restrict: 'A',
        template: '{{ credentials.roleName }}',
        link: function(scope, element, attrs){
            scope.credentials = Session.getCredentials();
        }
    }
});


////////////////////////////////////////////////////////////////////////////////
app.directive('sessionLogOut', function(Session, $rootScope){
    return {
        restrict: 'A',
        link: function(scope, element, attrs){
            element.on('click', function() {
                Session.logout();
                $rootScope.$apply();
            });
        }
    }
});

////////////////////////////////////////////////////////////////////////////////
app.directive('refreshLogin', function(Session, $rootScope){
    return {
        restrict: 'A',
        link: function(scope, element, attrs){
            element.on('click', function() {
                Session.refreshLoginTimer();
            });
        }
    }
});



////////////////////////////////////////////////////////////////////////////////
app.directive('sessionStatus', function(Session){
    return {
        restrict: 'A',
        link: function(scope, element, attr){
            scope.status = Session.getStatus()
        }
    }
});



////////////////////////////////////////////////////////////////////////////////
app.directive('modalLogin', function(Session) {
    return {
        restrict: 'E',
        scope: true,
        templateUrl: 'modalLogin.element.html',
        controller: function($scope, $element, $attrs){
            $scope.data = { visible: false };
            // Make data visible for child directive
            this.data = $scope.data;
            
        },
        link: function(scope, element, attr){
            
            scope.click = function(){
                scope.data.visible = !scope.data.visible;
            }
        }
    }
});


////////////////////////////////////////////////////////////////////////////////
app.directive('staticLoginForm', function(Session){
    return {
        restrict: 'E',
        templateUrl: 'staticLogin.form.html',
        scope: true,
        controller: function($scope, $element, $attrs){},
        link: function(scope, element, attrs){
            
            scope.userData = Session.getUserData();
            
            scope.clearForm = function(){
                scope.staticLoginUserName = '';
                scope.staticLoginPassword = '';
            }
            
            scope.submit = function(){
                var userName = scope.staticLoginUserName;
                var userPassword = scope.staticLoginPassword;
                Session.login(userName, userPassword);
                scope.clearForm();
            }
            
            scope.logout = function() { Session.logout(); }
            
        }
    }
});

////////////////////////////////////////////////////////////////////////////////
app.directive('navbarNavLoginForm', function(Session){
    return {
        restrict: 'E',
        scope: true,
        templateUrl: 'navbarNavLogin.form.html',
        controller: function($scope, $element, $attrs){
        },
        link: function(scope, element, attrs){
            
            // Triggers html-post when table is empty
            scope.userData = Session.getActiveUsers();
            
            scope.clearForm = function(){
                scope.navbarNavLoginUserName = '';
                scope.navbarNavLoginUserPassword = '';
            }
            
            scope.validateForm = function(){
                return true;
            }
            
            scope.submit = function(){
                var userName = scope.navbarNavLoginUserName;
                var userPassword = scope.navbarNavLoginUserPassword;
                Session.login(userName, userPassword);
                scope.clearForm();
            }
            
            scope.logout = function() { Session.logout(); }
        }
    }
});

////////////////////////////////////////////////////////////////////////////////
app.directive('userLoginTable', function($http, Session){
    
    var responseStatus = {
        status: '',
        message: ''
    };
    
    var credentials = Session.getCredentials();
    
    return {
        restrict: 'E',
        templateUrl: 'userLogin.table.html',
        controller: function($scope, $element, $attrs, $http){
        },
        link: function(scope, element, attrs){
            
            scope.userLoginTable = Session.getUserLoginTable();
            scope.toDate = function(str) {
                return new Date(str);
            }
        }
    }
});

////////////////////////////////////////////////////////////////////////////////
app.directive('clientDataUpdateStaticForm', function(Session){
    return {
        restrict: 'E',
        scope: true,
        templateUrl: 'clientUpdateDataStatic.form.html',
        link: function(scope, element, attrs){
            
            scope.clearForm = function() {
                scope.userId = '';
                scope.userName = '';
                scope.userOldPassword = '';
                scope.userNewPassword = '';
                scope.repeatNewPassword = '';
                scope.clientUpdateStaticForm.$setPristine();
                
            }
            
            scope.initializeForm = function(){
                scope.credentials = Session.getCredentials();
                scope.userId = scope.credentials.userId;
                scope.userName = scope.credentials.userName;
                scope.userOldPassword = '';
                scope.userNewPassword = '';
                scope.repeatNewPassword = '';
            }
            
            scope.validateForm = function(){
                if(scope.userNewPassword != scope.repeatNewPassword) {
                    alert("Unequal Passwords!");
                    // Clear input fields
                    scope.userNewPassword = '';
                    scope.repeatNewPassword = '';
                    return false;
                }
                
                if(scope.userNewPassword < 3){
                    alert("Password too short (minimum 3 characters)");
                    return false;
                }
                return true;
            }
            
            // Will be updated asynchronously upon submission....
            scope.submitStatus = {
                update : false,
                failed : false,
                message: ''
            }
            
            scope.submit = function(){
                if(scope.validateForm()){
                    scope.submitStatus = Session.updateUserPassword(scope.credentials.userId, 
                            scope.userOldPassword , scope.userNewPassword);
                }
                scope.clearForm();
            }
            Session.registerStatusObserver(scope.initializeForm);
        }, // link
        controller: function($scope, $element, $attrs){
            

            $scope.$watch('clientUpdateStaticForm.$dirty', function(newVal, oldVal){
                if(newVal){
                    $scope.submitStatus.failed = false;
                    $scope.submitStatus.update = false;
                }
            });
        }
    }
});

////////////////////////////////////////////////////////////////////////////////
app.directive('modalClientEditData', function (Session) {
    return {
        restrict: 'E',
        scope: true,
        templateUrl: 'modalClientDataEdit.form.html',
        controller: function($scope, $element, $attrs){
            $scope.data = { visible: false };
            // Visible for child directive
            this.data = $scope.data;
        }
    }
});

////////////////////////////////////////////////////////////////////////////////
app.directive('modalClientEditDataForm', function(Session){
    return {
        restrict: 'E',
        require: '^^modalClientEditData',
        templateUrl: 'clientEditDataModal.form.html',
        replace: true, // required for element.modal to work
        link: function(scope, element, attr, ctrl){
            
            //------------------------------------------------------------//
            // Visibility of modal form
            //------------------------------------------------------------//
            scope.data = ctrl.data;
            
            scope.initFormData = function(user){
                scope.modalClientEditUserId = user.userId;
                scope.modalClientEditUserName = user.userName;
                scope.modalClientEditUserRole = user.userRole;
                scope.modalClientEditFirstName = user.firstName;
                scope.modalClientEditLastName = user.lastName;
                scope.modalClientEditExternalId = user.externalId;
                scope.modalClientEditExpirDate = user.expirDate;
            }
            
            scope.click = function(){
                scope.data.visible = !scope.data.visible;
                if(scope.data.visible){
                    Session.getUserDataSet(scope.initFormData);
                }
            }
            
            scope.show = function(){
                scope.data.visible = true;
            }
            scope.hide = function(){
                scope.data.visible = false;
            }

            scope.cancel = function() {
                scope.hide();
            }
            
            scope.$watch('data.visible', function(newVal, oldVal, scope){
                element.modal(newVal ? 'show' : 'hide');
            });
            
            
            //------------------------------------------------------------//
            // Submit edited data
            //------------------------------------------------------------//
            scope.submit = function() {
                var exd = moment(scope.modalClientEditExpirDate, "DD.MM.YYYY");
                var user = {
                    id: scope.modalClientEditUserId,
                    userName : scope.modalClientEditUserName,
                    expirDate : exd.format("YYYYMMDD"),
                    role: scope.modalClientEditUserRole,
                    firstName: scope.modalClientEditFirstName,
                    lastName: scope.modalClientEditLastName,
                    externalId: scope.modalClientEditExternalId
                };
                Session.updateUserData(user);
                scope.hide();
            }
        }
    }
});

////////////////////////////////////////////////////////////////////////////////
app.directive('userDataTable', function (Session) {
    return {
        restrict: 'E',
        scope: true,
        templateUrl: 'userData.table.html',
        link: function(scope, element, attr){
            
            scope.showEditUserDataForm = function(user){
                scope.data.visible = !scope.data.visible;
                scope.data.user = user;
            }
            
            scope.showResetForm = function(user) {
                scope.pwdReset.visible = !scope.pwdReset.visible;
                scope.pwdReset.user = user;
            }
            
            // Triggers retrieval of table when empty
            scope.userData = Session.getAllUsers();
        },
        controller: function($scope, $element, $attrs){

            
            // Edit user data
            $scope.data = { 
                visible: false,
                user: null
            };
            this.data = $scope.data;

            // Password reset form
            $scope.pwdReset = { 
                visible: false, 
                user: null
            };            
            this.pwdData = $scope.pwdReset;
            
        }
    }
});

////////////////////////////////////////////////////////////////////////////////
app.directive('modalUserResetPassword', function(Session){
    return {
        restrict: 'E',
        scope : {},
        require: '^^userDataTable',
        templateUrl: 'modalUserResetPassword.form.html',
        replace: true, // required for element.modal to work
        link: function(scope, element, attr, ctrl){
                        
            scope.data = ctrl.pwdData;
            
            scope.$watch('data.visible', function(newVal, oldVal, scope){
                element.modal(newVal ? 'show' : 'hide');
            });
            
            scope.hide = function(){
                scope.data.visible = false;
                scope.newPassword = '';
                scope.message = '';
                scope.success = false;
                scope.failed = false;
            }
            scope.hide();
            
            scope.callback = function(data) {
                scope.newPassword = data.password;
                scope.success = data.reset;
                scope.failed = !data.reset;
                scope.message = data.message;
            }
            
            scope.doResetPassword = function(userId) {
                Session.resetUserPassword(userId, scope.callback);
            }
        }
    }
});

////////////////////////////////////////////////////////////////////////////////
app.directive('modalUserEditForm', function(Session){
    return {
        restrict: 'E',
        require: '^^userDataTable',
        templateUrl: 'modalUserEdit.form.html',
        replace: true, // required for element.modal to work
        controller: function($scope, $element, $attrs){

        },
        link: function(scope, element, attr, ctrl){
            //------------------------------------------------------------//
            // Visibility of modal form
            //------------------------------------------------------------//
            scope.data = ctrl.data;
            
            
            var userData = Session.getUserData();
            
            scope.initFormValues = function(){
                
                scope.modalUserEditUserId = scope.data.user.id;
                scope.modalUserEditUserName = scope.data.user.username;
                scope.modalUserEditFirstName = scope.data.user.firstname;
                scope.modalUserEditLastName = scope.data.user.lastname;
                scope.modalUserEditExternalId = scope.data.user.externalid;
                scope.modalUserEditExpirDate = scope.data.user.expirdate;
                
                var roleIndex = scope.userData.userRoles
                    .findIndex(role => role.name == scope.data.user.role);
                scope.modalUserEditUserRole = scope.userData.userRoles[roleIndex];
            }
            
            scope.hide = function(){
                scope.data.visible = false;
            }
            
            scope.$watch('data.visible', function(newVal, oldVal, scope){
                element.modal(newVal ? 'show' : 'hide');
                if(scope.data.user != null){
                    scope.initFormValues();
                }
            });
            

            
            //------------------------------------------------------------//
            // Login submit
            //------------------------------------------------------------//
            
            scope.submit = function(){
                
                // Check expiration date
                var exd = moment(scope.modalUserEditExpirDate, "DD.MM.YYYY");
                if(!exd.isValid()) {
                    alert("Invalid expiration date (DD.MM.YYYY): " + expirDate);
                    return;
                }

                // Check expiration date
                var exd = moment(scope.modalUserEditExpirDate, "DD.MM.YYYY");
                if(!exd.isValid()) {
                    alert("Invalid expiration date (DD.MM.YYYY): " + expirDate);
                    return;
                }

                var user = {
                    id: scope.modalUserEditUserId,
                    userName : $.trim(scope.modalUserEditUserName),
                    expirDate : exd.format("YYYYMMDD"),
                    role : scope.modalUserEditUserRole.id,
                    firstName : scope.modalUserEditFirstName,
                    lastName : scope.modalUserEditLastName,
                    externalId : scope.modalUserEditExternalId
                };
                
                Session.updateUserData(user);
                scope.hide();
            }
        }
    }
});

////////////////////////////////////////////////////////////////////////////////
app.directive('modalUserRegistration', function () {
    return {
        restrict: 'E',
        scope: true,
        templateUrl: 'modalUserRegistration.element.html',
        controller: function($scope, $element, $attrs){
            $scope.data = { visible: false };
            // Make data visible for child directive
            this.data = $scope.data;
        },
        link: function(scope, element, attr){
            
            scope.click = function(){
                scope.data.visible = !scope.data.visible;
            }
        }
    }
});

////////////////////////////////////////////////////////////////////////////////
app.directive('modalUserRegForm', function(Session){
return {
    restrict: 'E',
    scope: true,
    require: '^^modalUserRegistration',
    templateUrl: 'modalUserRegistration.form.html',
    replace: true, // required for element.modal to work
    controller: function($scope, $element, $attrs){
        
    },
    link: function(scope, element, attr, ctrl){
        
        var default_expirDate = "31.12.2099";
        
        // Mangage visibility of modal form
        scope.data = ctrl.data;
        scope.$watch('data.visible', function(newVal, oldVal, scope){
            element.modal(newVal ? 'show' : 'hide');
        });
        
        scope.userData = Session.getUserRoles();
        
        // Status flags used for user-feedback
        scope.status = {
            submitted : false,
            success : false,
            failed : false,
            userExist : false,
            message : ''
        };
        
        scope.user = {
            userName : '',
            firstName : '',
            lastName : '',
            externalId : '',
            role : null,
            expirDate : default_expirDate,
            id : -1,
            passWord : ''
        };
        
        var clearForm = function(){
            scope.user.userName = '';
            scope.user.role = null;
            scope.user.firstName = '';
            scope.user.lastName = '';
            scope.user.externalId = '';
            scope.user.expirDate = default_expirDate;
            
            scope.user.id = -1;
            scope.user.passWord = '';
            
            scope.status.submitted = false;
            scope.status.success = false;
            scope.status.failed = false;
            scope.status.userExist = false;
            scope.status.message = '';
        }
        
        var successMessage = function(result){
            return 'Registrierung erfolgt. User-ID: ' 
                + scope.user.id + '. ' + result.message;
        }
        
        var failMessage = function(result){
            return 'Registrierung fehlgeschlagen: '
                + result.message;
        }
        
        var callback = function(result){
            scope.user.id = result.userId;
            scope.user.passWord = result.passWord;
            if(result.insert){
                scope.status.success = true;
                scope.status.failed = false;
                scope.status.userExist = false;
                scope.status.message = successMessage(result);
                scope.status.submitted = true;
            } else {
                scope.status.success = false;
                scope.status.failed = true;
                scope.status.userExist = result.exist;
                scope.status.message = failMessage(result);
                scope.status.submitted = false;
            }
        }
        
        scope.click = function(){
            scope.data.visible = !scope.data.visible;
        }
        
        scope.show = function(){
            scope.data.visible = true;
        }
        scope.hide = function(){
            scope.data.visible = false;
            clearForm();
        }
        

        
        // ToDo: 
        // define 'submitted' status
        // show Password field only upon success
        // remove submit button after success. Add cancel button
        // Message  + close button shall replace submit + cancel
        // Show close button only upon success
        // Show message and cancel button in one line
        
        //------------------------------------------------------------//
        // Login submit
        //------------------------------------------------------------//
        
        scope.submit = function(){
            // Check expiration date
            var exd = moment(scope.user.expirDate, "DD.MM.YYYY");
            if(!exd.isValid()) {
                alert("Invalid expiration date (DD.MM.YYYY): " + 
                            scope.user.expirDate);
                return;
            }
            
            var result = Session.registerNewUser(
                    $.trim(scope.user.userName), scope.user.role.id, 
                    scope.user.firstName, scope.user.lastName, 
                    scope.user.externalId,
                    exd.format("YYYYMMDD"), callback);
        }
    }
}});


app.directive('modal', function () {
    return {
        templateUrl: 'modal.html',
        restrict: 'E',
        transclude: true,
        replace:true,
        scope:true,
        link: function postLink(scope, element, attrs) {
            scope.title = attrs.title;

            scope.$watch(attrs.visible, function(value){
                element.modal(value ? 'show' : 'hide');
            });


            $(element).on('shown.bs.modal', function(){
                scope.$apply(function(){
                    scope.$parent[attrs.visible] = true;
                });
            });

            $(element).on('hidden.bs.modal', function(){
                scope.$apply(function(){
                    scope.$parent[attrs.visible] = false;
                });
            });
        }
    };
});


})(window.angular);


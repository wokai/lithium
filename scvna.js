(function(angular) {
'use strict';

    var app = angular.module('globalModule');
    
    
    app.directive('indicator', function(){
        return {
            restrict: 'E',
            scope: {
                dirty : '@dirty',
                valid: '@valid',
                label : '@label',
                size : '@size'
            },
            template: '<div class="text-secondary mr-1" style="display: inline-block; vertical-align: top;" >{{label}}</div>'
                + '<div class="{{bgclass}} mt-1 mr-3" style="height:{{size}}px; width:{{size}}px; border-radius:50%; display: inline-block;"></div>',
            controller : function($scope, $element, $attrs){
            },
            link : function(scope, element, attrs){
                
                var prist_inval = 'bg-secondary';
                var prist_val   = 'bg-success';
                var dirty_inval = 'bg-warning';
                var dirty_val   = 'bg-primary';
                
                var dirty = false;
                var valid = false;
                
                scope.bgclass = prist_inval;
                
                var setClass = function(){
                    if(dirty){
                        if(valid){
                            scope.bgclass = dirty_val;
                        } else {
                            scope.bgclass = dirty_inval;
                        }
                    } else {
                        if(valid){
                            scope.bgclass = prist_val;
                        } else {
                            scope.bgclass = prist_inval;
                        }
                    }
                }
                
                if(scope.size == undefined){
                    scope.size = 15;
                }
                
                if(scope.label == undefined){
                    scope.label = '';
                }
                
                attrs.$observe('dirty', function(value){
                    if(value == 'true'){
                        dirty = true;
                        setClass();
                    } else {
                        dirty = false;
                        setClass();
                    }
                });
                
                attrs.$observe('valid', function(value){
                    if(value == 'true'){
                        valid = true;
                        setClass();
                    } else {
                        valid = false;
                        setClass();
                    }
                });
            }
        }
    });
    
    ////////////////////////////////////////////////////////////////////////////
    // Parent directive
    ////////////////////////////////////////////////////////////////////////////
    app.directive('scvna', function(){
        return {
            restrict: 'E',
            scope: true,
            templateUrl: 'scvna.html',
            controller : function($scope, $element, $attrs){
                
                $scope.subject = { id: 0 };
                
                // make accessible for child elements
                this.subject = $scope.subject;
                
                this.setRecord = function(id){
                    $scope.$broadcast('SCVNA_RECORD_ID_CHANGED', id);
                };
                
                this.notifyNewRecord = function(id){
                    $scope.$broadcast('SCVNA_NEW_RECORD', id);
                }
                
            },
            link: function(scope, element, attr){}
        }
    });

    ////////////////////////////////////////////////////////////////////////////
    // Static record table
    ////////////////////////////////////////////////////////////////////////////
    
    app.directive('scvnaRecordTable', function ($http, Session) {
        return {
            restrict: 'E',
            scope: true,
            require: '^scvna',
            templateUrl: 'scvnaRecord.table.html',
            link: function(scope, element, attr, ctrl){
                
                scope.result = '(empty)';
                scope.setRecord = ctrl.setRecord;
                scope.permission = ctrl.permission;
                
                var tableDateFormat = 'DD.MM.YY';
                
                scope.formatDate = function(date){
                    return moment().format(tableDateFormat);
                }
                
                scope.getRecordTable = function(){
                    
                    var data = {
                        table : 'scvna',
                        params : [ 'id', 'mrn', 'opcase', 'date'],   // leave out params for '*'
                        order : 'desc'
                        //id : 18 // leave out for all records
                    };
                    
                    var request = {
                        action : 'science_db_select',
                        data : data
                    };
                    
                    $http.post('scienceActions.php', request).then(function(response){
                        
                        console.log('[scvna] Db select : ' 
                            + response.status
                            + ' (' + response.data.status.message + ')' );
                        
                        scope.recordTable = response.data.result;
                        
                        }, function(response){
                            console.warn('[scvna] getRecordTable failed: ' 
                                + response.status + ' (' + response.statusText + ')');
                    });
                }
                scope.getRecordTable();
                
            }, // link
            controller: function($scope, $element, $attrs){
                $scope.$on('SCVNA_NEW_RECORD', function(e, data){
                    $scope.getRecordTable();
                });
            }
        }
    })
    
    
    ////////////////////////////////////////////////////////////////////////////
    // Static input form
    ////////////////////////////////////////////////////////////////////////////
    
    app.directive('scvnaInputForm', function ($http, Session) {
        return {
            restrict: 'E',
            scope: true,
            require: '^scvna',
            templateUrl: 'scvnaStaticInput.form.html',
            link: function(scope, element, attr, ctrl){
                
                ////////////////////////////////////////////////////////////////
                // Global form status
                ////////////////////////////////////////////////////////////////

                const status = {
                    create : 'create',
                    edit : 'edit',
                    final : 'final'
                }
                
                scope.formStatus = status.create;
                scope.formEditable = false;
                scope.subjectVisible = false;
                
                ////////////////////////////////////////////////////////////////
                // Definition for user-permissions on form
                ////////////////////////////////////////////////////////////////
                
                var permission = {
                    admin : false,
                    write : false,
                    read : false
                };
                
                scope.userPermission = permission;
                
                scope.updateFormStatus = function(){
                                        
                    if(Session.unCertified()){
                        permission.admin = false;
                        permission.write = false;
                        permission.read = false;
                    } else if(Session.authorised('scvna_admin')){
                        permission.admin = true;
                        permission.write = true;
                        permission.read = true;
                    } else if(Session.authorised('scvna_write')){
                        permission.admin = false;
                        permission.write = true;
                        permission.read = true;
                    } else if(Session.authorised('scvna_read')){
                        permission.admin = false;
                        permission.write = false;
                        permission.read = true;
                    } else {
                        permission.admin = false;
                        permission.write = false;
                        permission.read = false;
                    }
                    
                    scope.formEditable = scope.userPermission.admin ||
                        scope.userPermission.write &&
                            (scope.formStatus != status.final);
                                
                    scope.subjectVisible = scope.userPermission.write &&
                        (scope.formStatus == status.create);

                }
                
                Session.registerStatusObserver(scope.updateFormStatus);
                scope.$on('$destroy', function() {
                    Session.deRegisterStatusObserver(scope.updateFormStatus);
                });
                
                scope.setFormStatus = function(status){
                    if(status !== undefined){
                        scope.formStatus = status;
                        scope.updateFormStatus();
                    }
                }


                ////////////////////////////////////////////////////////////////
                // Input field specific logic
                ////////////////////////////////////////////////////////////////
                var timeFormat = 'HH:mm';
                var formDateFormat = 'DD.MM.YYYY';
                var defaultDate = '1900-01-01';
                
                
                var createTime = function(date, time){
                    if(date == null || time == null){
                        return defaultDate;
                    }
                    return moment(date, formDateFormat).format("YYYY-MM-DD")
                            + ' ' + moment(time, "hh:mm").format("hh:mm:ss");
                }
                
                var formatInputDate = function(date){
                    if(date == null)
                        return defaultDate;
                        
                    return moment(date, formDateFormat).format("YYYYMMDD");
                }
                
                
                var numeric = function(value) {
                    if(value == null){
                        ////////////////////////////////////////////////////////
                        // ubiquitous indicator for missing value:
                        // Required because generic construction of 
                        // prepared statements will throw errors
                        ////////////////////////////////////////////////////////
                        return -1;
                    }
                    
                    if(!Number.isInteger(value)){
                        var parsed = parseInt(value);
                        if(isNaN(parsed))
                            return -1;
                            
                        return parsed;
                    }
                    return value;
                }
                
                var string = function(value) {
                    if(value == null)
                        return '';
                        
                    return value.toString();
                }
                
                
                scope.calculateSubjectAge = function() {
                    if(scope.scvnaSubjectAge == undefined){
                        if(scope.scvnaBirthDate != undefined && scope.scvnaDate != undefined){
                            var b = moment(scope.scvnaBirthDate, formDateFormat, 'years');
                            var o = moment(scope.scvnaDate, formDateFormat, 'years');
                            scope.scvnaSubjectAge = o.diff(b, 'years');
                        }
                    }
                }
                

                
                ////////////////////////////////////////////////////////////////
                // Save data to database
                ////////////////////////////////////////////////////////////////
                
                scope.notifyNewRecord = ctrl.notifyNewRecord;
                scope.subject = ctrl.subject;
                scope.recordId = 0;
                scope.subjectId = 0;
                
                scope.responseStatus = {
                    status : 0,
                    message : ''
                }
                
                
                // Date-Time related functions
                scope.getCurrentTime = function(){
                    return moment().format(timeFormat);
                }

                scope.getCurrentDate = function(){
                    return moment().format(formDateFormat);
                }
                
                ////////////////////////////////////////////////////////////////
                // Collect data from ng-model
                ////////////////////////////////////////////////////////////////
                
                scope.prepareSubjectData = function() {
                    
                    if(!(scope.scvnaMrn && scope.scvnaOpcase)){
                        console.warn('[scvnaInputForm] prepareSubjectData Error: MRN or Op-case missing.');
                        return null;
                    }
                    
                    var params = {
                        // Patient parameters:              isssssss | 8
                        mrn: numeric(scope.scvnaMrn),
                        opcase: string(scope.scvnaOpcase),
                        lastname: string(scope.scvnaLastName),
                        firstname: string(scope.scvnaFirstName),
                        gender: 'f',
                        birthdate: formatInputDate(scope.scvnaBirthDate),
                        project_name: 'scvna',
                        table_name: 'scvna'
                    };
                    
                    var types = 'isssssss';
                    
                    var data = {
                        table : 'subject',
                        params : params,
                        types : types
                    };
                    
                    return data;
                }
                
                scope.prepareScvnaData = function() {
                    
                    var params = {
                        // Patient parameters:              iissiiiii | 9 | 9
                        subject: numeric(scope.subjectId),
                        mrn: numeric(scope.scvnaMrn),
                        status: string(scope.formStatus),
                        opcase: string(scope.scvnaOpcase),
                        age: numeric(scope.scvnaSubjectAge),
                        weight: numeric(scope.scvnaWeight),
                        height: numeric(scope.scvnaHeight),
                        gestage: numeric(scope.scvnaGestAge),
                        preecl: numeric(scope.scvnaPreEclamp),
                        
                        // OP-case parameters:              ssssss | 6 | 15
                        date: formatInputDate(scope.scvnaDate),
                        annam : string(scope.scvnaAnnam),
                        injection : createTime(scope.scvnaDate, scope.scvnaInjection),
                        beginop : createTime(scope.scvnaDate, scope.scvnaBeginOp),
                        birth : createTime(scope.scvnaDate, scope.scvnaBirth),
                        endop : createTime(scope.scvnaDate, scope.scvnaEndOp),
                        
                        // Anaesthesia parameters:          ssisiissi | 9 | 24
                        spseg : string(scope.scvnaSpSeg),
                        lasub : string(scope.scvnaLaSub),
                        ladose : numeric(scope.scvnaLaDose),
                        opsub : string(scope.scvnaOpSub),
                        opdose : numeric(scope.scvnaOpDose),
                        spalch : numeric(scope.scvnaSpaLocChange),
                        splat : string(scope.scvnaApproach),
                        spq : string(scope.scvnaSpq),
                        ltilt: numeric(scope.scvnaSpaLeftTilt),
                        
                        // iisiiiiissssssssisiissi
                        
                        // Blood pressure parameters:       iiiiiiiii | 9 | 33
                        rrsyspreop : numeric(scope.scvnaRrSysPre),
                        rrmeanpreop : numeric(scope.scvnaRrMeanPre),
                        rrdiapreop : numeric(scope.scvnaRrDiaPre),
                        rrsysmin : numeric(scope.scvnaRrSysMin),
                        rrmeanmin : numeric(scope.scvnaRrMeanMin),
                        rrdiamin : numeric(scope.scvnaRrDiaMin),
                        rrsysmax : numeric(scope.scvnaRrSysMax),
                        rrmeanmax : numeric(scope.scvnaRrMeanMax),
                        rrdiamax : numeric(scope.scvnaRrDiaMax),
                        
                        // Clinical observations of mother: iiiiiiiiii | 10 | 43
                        nausea : numeric(scope.scvnaNausea),
                        vomit : numeric(scope.scvnaVomit),
                        dizziness : numeric(scope.scvnaDizziness),
                        doseonda : numeric(scope.scvnaOndaDose),
                        doseakri : numeric(scope.scvnaDoseAkri),
                        namin : numeric(scope.scvnaNaMin),
                        namax : numeric(scope.scvnaNaMax),
                        natot : numeric(scope.scvnaNaTotal),
                        naend : numeric(scope.scvnaNaOpEnd),
                        antihtn: numeric(scope.scvnaAntiHtn),
                        
                        // Newborn observations:            iiii | 4 | 47
                        apgar1 : numeric(scope.scvnaApgar1),
                        apgar2 : numeric(scope.scvnaApgar2),
                        apgar3 : numeric(scope.scvnaApgar3),
                        nbweight : numeric(scope.scvnaNbWeight),
                        
                        // Postoperative observations       iiiiiiis | 8 | 55
                        iobl : numeric(scope.scvnaIobl),
                        ioblv : numeric(scope.scvnaIoblv),
                        pobl : numeric(scope.scvnaPobl),
                        poblv : numeric(scope.scvnaPoblv),
                        diiop : numeric(scope.scvnaDiiop),
                        dipinf : numeric(scope.scvnaDipinf),
                        popiri : numeric(scope.scvnaPopiri),
                        anlevel : string(scope.scvnaAnlevel)
                        
                    };
                    
                    //          0    5   10   15   20   25   30   35   40   45   50   55
                    //               +    |    +    |    +    |    +    |    +    |    +
                    var types = 'iissiiiiissssssssisiissiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiis';
                    
                    var data = {
                        table : 'scvna',
                        params : params,
                        types : types
                    };
                    
                    return data;
                }


                ////////////////////////////////////////////////////////////////
                // Send data via Http to server
                ////////////////////////////////////////////////////////////////
                
                scope.insertNewScvnaRecord = function(){
                    
                    var request = {
                        action: 'science_db_insert',
                        data : scope.prepareScvnaData()
                    };
                    
                    $http.post('scienceActions.php', request).then(function(response){
                        
                        console.debug('[scvna] Db insert scvna status: ' 
                            + response.status
                            + ' (' + response.data.status.message + '), Record ID: '
                            + response.data.status.insert_id);
                        
                        scope.responseStatus.status = response.status;
                        scope.responseStatus.message = response.data.status.message;
                        scope.recordId = response.data.status.insert_id;
                        scope.setFormStatus(status.edit);
                        
                        // Informs record table
                        scope.notifyNewRecord(scope.recordId);
                        
                        scope.scvnaPatientForm.$setSubmitted();
                    }, function(response){
                        console.warn('[UserService] insertNewScvnaRecord failed:' 
                            + response.status + ' (' + response.statusText + ')');
                        scope.responseStatus.status = response.status;
                        scope.responseStatus.message = response.statusText;
                    });
                }
                
                scope.insertNewRecord = function(){
                    
                    
                    // 1) Write (protected) subject data to database
                    var request = {
                        action: 'science_db_insert',
                        data : scope.prepareSubjectData()
                    };
                    
                    $http.post('scienceActions.php', request).then(function(response){
                        
                        console.debug('[insertNewRecord] Success: ' 
                            + response.status
                            + ' (' + response.data.status.message + '), ID: '
                            + response.data.status.insert_id);
                        
                        scope.responseStatus.status = response.status;
                        scope.responseStatus.message = response.data.status.message;
                        scope.subjectId = response.data.status.insert_id;
                        scope.subject.id = scope.subjectId;
                        scope.scvnaForm.$setPristine();
                        
                        // 2) Write rest of form-data into database
                        scope.insertNewScvnaRecord();
                        
                    }, function(response){
                        console.warn('[insertNewRecord] Failed:' 
                            + response.status + ' (' + response.statusText + ')');
                        scope.responseStatus.status = response.status;
                        scope.responseStatus.message = response.statusText;
                    });
                }

                scope.updateScvnaRecord = function(){
                    
                    // Update subject
                    if(!scope.subjectId ) {
                        
                        console.debug('[updateScvnaRecord] Db update status: ' 
                            + 'Error!'
                            + ' (No valid subject-id provided)' );
                        return;
                    }
                    
                    var request = {
                        action : 'science_db_update',
                        data : scope.prepareSubjectData(),
                        id : scope.subjectId
                    };
                    
                    $http.post('scienceActions.php', request).then(function(response){
                        
                        console.debug('[updateScvnaRecord] Db update subject status: ' 
                            + response.status
                            + ' (' + response.data.status.message + ')' );
                        
                        scope.responseStatus.status = response.status;
                        scope.responseStatus.message = response.data.status.message;
                        scope.scvnaForm.$setPristine();
                        
                        }, function(response){
                            console.warn('[updateScvnaRecord] updateScvnaRecord failed:' 
                                + response.status + ' (' + response.statusText + ')');
                            scope.responseStatus.status = response.status;
                            scope.responseStatus.message = response.statusText;
                    });
                    
                    
                    // Update scvna
                    if(!scope.recordId) {
                        console.warn('[updateScvnaRecord] updateScvnaRecord failed: ' 
                            + ' No valid record-id (>0) provided!' );
                        return;
                    }
                    
                    var request = {
                        action : 'science_db_update',
                        data : scope.prepareScvnaData(),
                        id : scope.recordId
                    };
                    
                    $http.post('scienceActions.php', request).then(function(response){
                        
                        console.debug('[updateScvnaRecord] updateScvnaRecord: ' 
                            + response.status
                            + ' (' + response.data.status.message + ')' );
                        
                        scope.responseStatus.status = response.status;
                        scope.responseStatus.message = response.data.status.message;
                        
                        }, function(response){
                            console.warn('[updateScvnaRecord] updateScvnaRecord failed:' 
                                + response.status + ' (' + response.statusText + ')');
                            scope.responseStatus.status = response.status;
                            scope.responseStatus.message = response.statusText;
                    });
                }

                scope.saveScvnaRecord = function(){
                    if(scope.recordId > 0){
                        scope.updateScvnaRecord();
                    } else {
                        scope.insertNewRecord();
                    }
                }
                
                scope.finalizeRecord = function() {
                    scope.setFormStatus(status.final);
                    scope.saveScvnaRecord();
                }


                ////////////////////////////////////////////////////////////////
                // Retrieve single scvna - record from database
                ////////////////////////////////////////////////////////////////
                
                scope.clearScvnaForm = function(){

                    if(scope.scvnaForm.$dirty){
                        if(!confirm('Löschen ohne Speichern?')){
                            return;
                        }
                    }

                    // Patient parameters:              iisiiiii | 8 | 8
                    scope.recordId = 0;
                    scope.subjectId = 0;
                    scope.scvnaMrn = undefined;
                    scope.formStatus = status.create;
                    scope.scvnaOpcase = undefined;
                    scope.scvnaSubjectAge = undefined;
                    scope.scvnaWeight = undefined;
                    scope.scvnaHeight = undefined;
                    scope.scvnaGestAge = undefined;
                    scope.scvnaPreEclamp = undefined;
                    scope.scvnaLastName = undefined;
                    scope.scvnaFirstName = undefined;
                    scope.scvnaBirthDate = undefined;
                    
                    // OP-case parameters:              ssssss | 6 | 14
                    scope.scvnaDate = new Date();
                    scope.scvnaAnnam = Session.getCredentials().userName;
                    scope.scvnaInjection = undefined;
                    scope.scvnaBeginOp = undefined;
                    scope.scvnaBirth = undefined;
                    scope.scvnaEndOp = undefined;
                    
                    // Anaesthesia parameters:          ssisiissi | 9 | 23
                    scope.scvnaSpSeg = undefined;
                    scope.scvnaLaSub = undefined;
                    scope.scvnaLaDose = undefined;
                    scope.scvnaOpSub = undefined;
                    scope.scvnaOpDose = undefined;
                    scope.scvnaSpaLocChange = undefined;
                    scope.scvnaApproach = undefined;
                    scope.scvnaSpq = undefined;
                    scope.scvnaSpaLeftTilt = undefined;

                    // Blood pressure parameters:       iiiiiiiii | 9 | 32
                    scope.scvnaRrSysPre = undefined;
                    scope.scvnaRrMeanPre = undefined;
                    scope.scvnaRrDiaPre = undefined;
                    scope.scvnaRrSysMin = undefined;
                    scope.scvnaRrMeanMin = undefined;
                    scope.scvnaRrDiaMin = undefined;
                    scope.scvnaRrSysMax = undefined;
                    scope.scvnaRrMeanMax = undefined;
                    scope.scvnaRrDiaMax = undefined;
                    
                    
                    // Clinical observations of mother: iiiiiiiiii | 10 | 42
                    scope.scvnaNausea = undefined;
                    scope.scvnaVomit = undefined;
                    scope.scvnaDizziness = undefined;
                    scope.scvnaOndaDose = undefined;
                    scope.scvnaDoseAkri = undefined;
                    scope.scvnaNaMin = undefined;
                    scope.scvnaNaMax = undefined;
                    scope.scvnaNaTotal = undefined;
                    scope.scvnaNaOpEnd = undefined;
                    scope.scvnaAntiHtn = undefined;

                    // Newborn observations:            iiii | 4 | 46
                    scope.scvnaApgar1 = undefined;
                    scope.scvnaApgar2 = undefined;
                    scope.scvnaApgar3 = undefined;
                    scope.scvnaNbWeight = undefined;

                    // Postoperative observations       iiiiiiis | 8 | 54
                    scope.scvnaIobl = undefined;
                    scope.scvnaIoblv = undefined;
                    scope.scvnaPobl = undefined;
                    scope.scvnaPoblv = undefined;
                    scope.scvnaDiiop = undefined;
                    scope.scvnaDipinf = undefined;
                    scope.scvnaPopiri = undefined;
                    scope.scvnaAnlevel = undefined;
                    
                    scope.scvnaForm.$setPristine();
                }

                scope.fillScvnaForm = function(data){

                    // Patient parameters:              iisiiiii | 8 | 8
                    scope.recordId = numeric(data.id);
                    scope.subjectId = numeric(data.subject);
                    scope.scvnaMrn = numeric(data.mrn);
                    scope.formStatus = data.status;
                    scope.scvnaOpcase = data.opcase;
                    scope.scvnaSubjectAge = numeric(data.age);
                    scope.scvnaWeight = numeric(data.weight);
                    scope.scvnaHeight = numeric(data.height);
                    scope.scvnaGestAge = numeric(data.gestage);
                    scope.scvnaPreEclamp = data.preecl;


                    // OP-case parameters:              ssssss | 6 | 14
                    scope.scvnaDate = new Date(data.date);
                    scope.scvnaAnnam = data.annam;
                    scope.scvnaInjection = new Date(data.injection);
                    scope.scvnaBeginOp = new Date(data.beginop);
                    scope.scvnaBirth = new Date(data.birth);
                    scope.scvnaEndOp = new Date(data.endop);
                    
                    // Anaesthesia parameters:          ssisiissi | 9 | 23
                    scope.scvnaSpSeg = data.spseg;
                    scope.scvnaLaSub = data.lasub;
                    scope.scvnaLaDose = numeric(data.ladose);
                    scope.scvnaOpSub = data.opsub;
                    scope.scvnaOpDose = numeric(data.opdose);
                    scope.scvnaSpaLocChange = data.spalch;
                    scope.scvnaApproach = data.splat;
                    scope.scvnaSpq = data.spq;
                    scope.scvnaSpaLeftTilt = data.ltilt;

                    // Blood pressure parameters:       iiiiiiiii | 9 | 32
                    scope.scvnaRrSysPre = numeric(data.rrsyspreop);
                    scope.scvnaRrMeanPre = numeric(data.rrmeanpreop);
                    scope.scvnaRrDiaPre = numeric(data.rrdiapreop);
                    scope.scvnaRrSysMin = numeric(data.rrsysmin);
                    scope.scvnaRrMeanMin = numeric(data.rrmeanmin);
                    scope.scvnaRrDiaMin = numeric(data.rrdiamin);
                    scope.scvnaRrSysMax = numeric(data.rrsysmax);
                    scope.scvnaRrMeanMax = numeric(data.rrmeanmax);
                    scope.scvnaRrDiaMax = numeric(data.rrdiamax);
                    
                    // Clinical observations of mother: iiiiiiiiii | 10 | 42
                    scope.scvnaNausea = data.nausea;
                    scope.scvnaVomit = data.vomit;
                    scope.scvnaDizziness = data.dizziness;
                    scope.scvnaOndaDose = numeric(data.doseonda);
                    scope.scvnaDoseAkri = numeric(data.doseakri);
                    scope.scvnaNaMin = numeric(data.namin);
                    scope.scvnaNaMax = numeric(data.namax);
                    scope.scvnaNaTotal = numeric(data.natot);
                    scope.scvnaNaOpEnd = numeric(data.naend);
                    scope.scvnaAntiHtn = data.antihtn;

                    // Newborn observations:            iiii | 4 | 46
                    scope.scvnaApgar1 = numeric(data.apgar1);
                    scope.scvnaApgar2 = numeric(data.apgar2);
                    scope.scvnaApgar3 = numeric(data.apgar3);
                    scope.scvnaNbWeight = numeric(data.nbweight);

                    // Postoperative observations       iiiiiiis | 8 | 54
                    scope.scvnaIobl = numeric(data.iobl);
                    scope.scvnaIoblv = numeric(data.ioblv);
                    scope.scvnaPobl = numeric(data.pobl);
                    scope.scvnaPoblv = numeric(data.poblv);
                    scope.scvnaDiiop = data.diiop;
                    scope.scvnaDipinf = data.dipinf;
                    scope.scvnaPopiri = data.popiri;
                    scope.scvnaAnlevel = data.anlevel;
                    
                    scope.scvnaForm.$setPristine();
                }

                
                scope.getScvnaRecord = function(id){
                    
                    var data = {
                        table : 'scvna', // no params -> SELECT *
                        id : id
                    };
                    
                    var request = {
                        action : 'science_db_select',
                        data : data
                    };
                    
                    $http.post('scienceActions.php', request).then(function(response){
                        
                        console.debug('[svcna] getScvnaRecord : ' 
                            + response.status
                            + ' (' + response.data.status.message + ')' );
                        scope.fillScvnaForm(response.data.result);
                        
                        }, function(response){
                            console.warn('[UserService] getScvnaRecord failed:' 
                                + response.status + ' (' + response.statusText + ')');
                            scope.responseStatus.status = response.status;
                            scope.responseStatus.message = response.statusText;
                    });
                }

            //================================================================//
            // End of link function
            //================================================================//
            },
            controller: function($scope, $element, $attrs){
                
                $scope.keyPressDate = function(event){
                    
                    if(event.keyCode == 104) { 
                        $scope.scvnaDate = new Date();      // 'h' key pressed
                        
                    } else if(angular.isDate($scope.scvnaDate)){
                        
                        if(event.keyCode == 43) {           // '+' key - pressed
                            var d = new Date($scope.scvnaDate);
                            $scope.scvnaDate = new Date(new Date().setDate(d.getDate() + 1));
                            
                        } else if(event.keyCode == 45) {    // '-' - key pressed
                            var d = new Date($scope.scvnaDate);
                            $scope.scvnaDate = new Date(new Date().setDate(d.getDate() - 1));
                            
                        }
                    }
                }

                
                $scope.$on('SCVNA_RECORD_ID_CHANGED', function(e, data){
                    $scope.getScvnaRecord(data);
                    console.debug('[scvna] record-id changed: ' + data);
                })
            }   // controller
        }       // returned object
    })          // directive : static-input-form
    
    



})(window.angular);


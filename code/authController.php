<?php
/*******************************************************************************
 * The MIT License
 * Copyright 2019, Wolfgang Kaisers
 * Permission is hereby granted, free of charge, to any person obtaining a 
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included 
 * in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 ******************************************************************************/


require_once(__DIR__.'/vendor/autoload.php');
require_once(__DIR__.'/authDbConnection.php');
require_once(__DIR__.'/userRoleModel.php');

use Monolog\Handler\StreamHandler;
use Monolog\Logger;

class AuthController{
    
    private static $defaultRole = 'anonymous';
    private static $expirationInterval = 'PT10M'; // 10 Minutes
    private $logger;
    private $connection;
    private $session;
    private $sessionId;
    private $ok;
    private $roleModel;
    
    public function __construct() {
        
        // Initialise logger
        $this->logger = new Logger('AuthController');
        $log_file = '/var/log/monolog/auth_controller_'.date('Y-m-d').'.log';
        $logstream = new StreamHandler($log_file, Logger::DEBUG);
        $this->logger->pushHandler($logstream);
        
        $this->ok = true;
        
        $this->connection = new AuthDbConnection();
        if(!$this->connection->ok()){
            $this->logger->warn('Auth-Database opening failed');
            $this->ok = false;
        }
        
        $this->roleModel = new UserRoleModel();
        if(!$this->roleModel->ok()){
            $this->logger->warn('Reading role-model failed');
            $this->ok = false;
        }
        
        
    }
    
    public function ok(){
        return $this->ok;
    }

    ////////////////////////////////////////////////////////////////////////////
    // Private server-side authentication
    ////////////////////////////////////////////////////////////////////////////

    private function checkLoginExpired(&$loginData){
        // Check whether login is expired
        $expirtime = new DateTime($loginData['expiration']);
        $now = new DateTime('now');
        
        if($expirtime < $now){
            $this->connection->userLogout();
            $loginData['logout'] = true;
            $loginData['expired'] = true;
            $this->logger->info('Login is expired : '.$expirtime->format('d.m.Y H:i:s'));
            return true;
        } else {
            $loginData['expired'] = false;
            $this->logger->info('Login is not expired : '.$expirtime->format('d.m.Y H:i:s'));
            return false;
        }
    }

    public function resetLoginExpirationTime($loginToken){
        
        $expirtime = new DateTime(); 
        $expirtime->add(new DateInterval(self::$expirationInterval));

        $result = $this->connection->setLoginExpirationTime($loginToken, $expirtime);
        if($result['result']['update'] === true){
            $this->logger->info('Login expiration time updated to '.$expirtime->format('d.m.Y H:i:s'). ' for token: ' .$loginToken);
        } else {
            $this->logger->info('Expirtime not updated');
        }
        return $result;
    }
    
    public function checkLogin($loginToken){
        
        // No login-token provided (default at launch)
        if(strlen($loginToken) == 0){
            return [ self::$defaultRole ];
        }

        $loginData = $this->connection->getLoginData($loginToken);
        
        // No login this login-token (and session-id) known
        if(count($loginData) == 0){
            return [ self::$defaultRole ];

        // Login exists, but had been logged out before
        } else if($loginData['logout']){
            return [ self::$defaultRole ];

        // Valid login exists
        } else {

            // When expired -> perform logout
            if($this->checkLoginExpired($loginData)){
                return [ self::$defaultRole ];
            }

            // Return array with authenticated roles
            return $this->roleModel->getSubRoleArray($loginData['roleName']);
        }
    }


    ////////////////////////////////////////////////////////////////////////////
    // Public user interface
    ////////////////////////////////////////////////////////////////////////////
    
    public function getActiveUserNames(){
        return $this->connection->getActiveUserNames();
    }
    
    public function getActiveUserTable(){
        return $this->connection->getActiveUserTable();
    }
    
    public function getUserData($userId){
        return $this->connection->getUserData($userId);
    }
    
    public function getUserLoginTable($userId){
        return $this->connection->getUserLoginTable($userId);
    }
    
    public function getUserTable(){
        return $this->connection->getUserTable();
    }
    
    public function getRoleNames(){
        return $this->connection->getRoleNames();
    }
    
    public function resetUserPassword($userId){
        $this->logger->debug('Password reset for user-id: ' .$userId);
        return $this->connection->resetUserPassword($userId);
    }
    
    public function updateUserRegistration($data){
        
        // Definition of user imported by authDbConnection.php
        $user = new User();
        $user->id = $data->userId;
        $user->userName = $data->userName;
        $user->userRole = $data->userRole;
        $user->firstName = $data->userFirstName;
        $user->lastName = $data->userLastName;
        $user->externalId = $data->userExternalId;
        $user->expirDate = $data->userExpirDate;
        
        $result = $this->connection->updateUserRegistration($user);
        $this->logger->info('Update user data done for userId '.$data->userId);
        return $result;
    }
    
    public function registerNewUser($data){
        
        $result = $this->connection->checkUserExist($data->userName);
        if($result['result']['exist']){
            $result['result']['insert'] = false;
            $result['result']['message'] = 'User-name already exists';
            $this->logger->info('User registration failed '
                .'because user-name already exists in database.');
                
            return $result;
        }
        
        $user = new User();
        $user->userName = $data->userName;
        $user->userRole = $data->userRole;
        $user->firstName = $data->firstName;
        $user->lastName = $data->lastName;
        $user->externalId = $data->externalId;
        $user->expirDate = $data->expirDate;
        $user->passWord = uniqid();
        
        $result = $this->connection->registerNewUser($user);

        // MySqlConnection reports boolean 'insert' field.
        if($result['result']['insert']){
            $result['result']['passWord'] = $user->passWord;
            $this->logger->info('User registration success.');
        } else {
            $result['result']['message'] = 'User registration failure '
                .'due to database constraints.';
            $this->logger->info('User registration failure '
                .'due to database constraints.');
        }

        return $result;
    }
    
    public function updateUserPassword($data){
        $result = $this->connection->updateUserPassword($data->userId, 
                    $data->oldPassWord, $data->newPassWord);
        
        $this->logger->info('Update user password requested for userId '
                .$data->userId);
        
        return $result;
    }
    
    public function userLogin($userName, $passWord){
        
        $expirtime = new DateTime(); 
        $expirtime->add(new DateInterval(self::$expirationInterval));
        
        $result = $this->connection->userLogin($userName, $passWord, $expirtime);
        
        // - status
        // - result 
        //      - login
        //      - roleName
        
        if($result['result']['login']){
            $model = new UserRoleModel();
            $roleNames = $model->getSubRoleArray($result['result']['roleName']);
            $result['result']['roleNames'] = $roleNames;
            $this->logger->debug('Login success for user: ' 
                .$userName . '. Has role: ' . $result['result']['roleName']);
        } else {
            $this->logger->debug('Login failure for user: ' .$userName);
        }
        
        return $result;
    }

    
    public function userLogout(){
        $this->logger->debug('User logout');
        return $this->connection->userLogout();
    }
    
    public function reportDbStatus(){
        return $this->connection->reportStatus();
    }
    
}

?>

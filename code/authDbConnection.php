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

require_once(__DIR__.'/user.php');
require_once(__DIR__.'/mySqlConnection.php');
require_once(__DIR__.'/session.php');
require_once(__DIR__.'/mysqlSessionHandler.php');
require_once(__DIR__.'/loginData.php');


class AuthDbConnection extends MySqlConnection {

    private static $loginTableLimit = 5;
    private $session;

    public function __construct() {
        parent::__construct('localhost',
            LoginData::auth_database,
            LoginData::auth_user,
            LoginData::auth_password);
        
        $handler = new MySqlSessionHandler($this->connection);
        $this->session = Session::getInstance($handler);
    }

    public function getRoleNames() {
        return $this->query('SELECT id, name FROM role');
    }
    
    public function getLoginTable() {
        $sql = 'SELECT id, userid, sessionid, '
            .'DATE_FORMAT(date, "%d.%m.%Y %H:%i") as date '
            .'FROM login ORDER BY id DESC LIMIT '
            .self::$loginTableLimit;
            
        return $this->query($sql);
    }
    
    public function getUserTable() {
        $sql = 'SELECT user.id, user.username, user.firstname, user.lastname,'
            .' user.lastname, user.externalid,'
            .' DATE_FORMAT(expirdate, "%d.%m.%Y") AS expirdate, role.name AS role'
            .' FROM user LEFT JOIN role ON user.role = role.id';
            
        return $this->query($sql);
    }
    
    public function getActiveUserTable() {
        $sql = 'SELECT user.id, username,'
            .' DATE_FORMAT(expirdate, "%d.%m.%Y") as expirdate, role.name AS role'
            .' FROM user  LEFT JOIN role ON user.role = role.id'
            .' WHERE expirdate > curdate()';
        return $this->query($sql);
    }
    
    public function getActiveUserNames() {
        $sql = 'SELECT username AS name FROM user WHERE expirdate > curdate()';
        // data.result
        return $this->query($sql);
    }
    
    public function getUserLoginTable(int $userId) {
        $sql = 'SELECT id, date FROM login WHERE (userid=?) '
                .'ORDER BY id DESC LIMIT '
                .self::$loginTableLimit;
        return $this->query($sql, $userId, 'i');
    }
    
    public function getLoginData(string $loginToken){
        $sql = 'SELECT roleid, role.name as roleName, logout, expiration '
            .'FROM login LEFT JOIN role ON login.roleid = role.id '
            .'WHERE (token=?) AND (sessionid=?)';
        $params = [
            'token' => $loginToken,
            'sessionid' => $this->session->getSessionId()
        ];
        return $this->execute($sql, $params, 'ss', true);
    }

    public function setLoginExpirationTime($loginToken, $expirTime){
        
        $sql = 'UPDATE login SET expiration=? '
            .'WHERE (token=?) AND (sessionid=?)';

        $params = [
            'expiration' => $expirTime->format('Y-m-d H:i:s'),
            'token' => $loginToken,
            'sessionid' => $this->session->getSessionId(),
        ];
        
        // 'UPDATE' returns NULL
        $this->execute($sql, $params, 'sss', true);
        
        if($this->ok()) {
            return $this->report(array('update' => true));
        } else {
            return $this->report(array('update' => false));
        }
        
    }
    
    public function getUserData(string $userId) {
        $sql = 'SELECT user.id AS userId, user.role AS userRole,'
            .' user.username as userName, '
            .' role.name AS roleName, firstname as firstName,'
            .' lastname as lastName, externalid as externalId,'
            .' password as passwordHash,'
            .' DATE_FORMAT(expirdate, "%d.%m.%Y") AS expirDate'
            .' FROM user LEFT JOIN role ON user.role = role.id WHERE (user.id = ?)';
        // data.result (array) || NULL when unkown
        return $this->query($sql, $userId, 'i', true);
    }

    public function saveNewUser(string $userName, int $userRole, 
        string $firstName, string $lastName, string $externalId, 
        string $password, string $expirdate="2097-01-01") {
    
        if(!$this->ok())
            return $this->report(false);
        
        $params = [
            'username' => $userName,
            'role' => $userRole,
            'firstname' => $firstName,
            'lastname' => $lastName,
            'externalid' => $externalId,
            'password' => password_hash($password, PASSWORD_DEFAULT),
            'expirdate' => $expirdate
        ];
        // No prior checking for existence
        return $this->insert('user', $params, 'sisssss');
    }

    public function updateUserRegistration(User $user){
        try {

            if(empty($user->id) || $user->id < 0) {
                throw new Exception('User ID missing or invalid.', 1000);
            }

            if(empty($user->expirDate)) {
                // ToDo: check date for validity
                throw new Exception('User expiration date missing.', 1000);
            }

            if($this->otherUserExist($user->userName, $user->id)) {
                throw new Exception('Other user already uses this name.', 1000);
            }

            $params = [
                'username' => $user->userName,
                'firstname' => $user->firstName,
                'lastname' => $user->lastName,
                'externalid' => $user->externalId,
                'expirdate' => $user->expirDate,
                'role' => $user->userRole
            ];
        
            return $this->update('user', $user->id, $params, 'sssssi');
            
        } catch(Exception $e) {
            $this->setError($e);
            return $this->reportStatus();
        }

        return $this->reportStatus();
    }

    public function registerNewUser(User $user) {
        
        if(!$this->ok())
            return $this->report(false);
        
        $params = [
            'username' => $user->userName,
            'role' => $user->userRole,
            'password' => password_hash($user->passWord, PASSWORD_DEFAULT),
            'firstname' => $user->firstName,
            'lastname' => $user->lastName,
            'externalid' => $user->externalId,
            'expirdate' => $user->expirDate
        ];
        
        return $this->insert('user', $params, 'ssssssi');
    }

    private function verifyUserPassword(int $userId, string $password) {
        $sql = 'SELECT password FROM user WHERE id = ?';
        $result = $this->execute($sql, array($userId), 'i', true);
        return password_verify($password, $result['password']); // boolean
    }
    
    public function updateUserPassword(int $userId, string $oldPassword, string $newPassword) {

        if(!$this->ok())
            return $this->report(false);
        
        if($this->verifyUserPassword($userId, $oldPassword)) {
            $pHash = password_hash($newPassword, PASSWORD_DEFAULT);
            return $this->update('user', $userId, array('password' => $pHash));
        } else {
            $this->query_status['message'] = 'Old password not verified';
            return $this->report(array('update' => false, 'reason' => 'Old password not verified'));
        }
    }
    
    public function resetUserPassword(int $userId){
        
        if(!$this->ok())
            return $this->report(false);
            
        $sql = 'SELECT role FROM user WHERE (id = ?)';
        $qarray = $this->execute($sql, $userId, 's', true);
        
        // Reports additional message as feedback for user.
        if($qarray['role'] < 3){
            $this->query_status['message'] = 'Password reset not allowed for administrative users';
            return $this->report(array('reset' => false, 'message' => 'Not allowed for administrative users', 'password' => ''));
        }
        
        $newPassword = uniqid();
        $pHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $this->update('user', $userId, array('password' => $pHash));
        
        if($this->ok()){
            return $this->report(array('reset' => true, 'message' => 'New password has been set', 'password' => $newPassword));
        } else {
            return $this->report(array('reset' => false, 'message' => 'Database error', 'password' => ''));
        }
    }

    public function verifyPassword(int $userId, string $password) {
        $verified = $this->verifyUserPassword($userId, $password);
        return $this->report(array('verified' => $verified));
    }
    

    ////////////////////////////////////////////////////////////////////////////
    // Check if userName exists (via userId)
    ////////////////////////////////////////////////////////////////////////////
    public function getUserId(string $userName) {
        if(!$this->ok())
            return $this->report(false);
        
        $sql = 'SELECT id FROM user WHERE (username = ?)';
        // data.result.id || 0 when userName is unknown
        return $this->query($sql, $userName, 's', true);
    }

    // Private: returns boolean ..
    private function userExist(string $userName) {
        $qry = $this->getUserId($userName);
        return !is_null($qry['result']);
    }

    // Public wrapper
    public function checkUserExist(string $userName) {
        if($this->userExist($userName)){
            return $this->report(array('exist' => true, 'userName' => $userName));
        } else {
            return $this->report(array('exist' => false, 'userName' => $userName));
        }
    }

    ////////////////////////////////////////////////////////////////////////////
    // Check whether another user has my (future) new name
    ////////////////////////////////////////////////////////////////////////////
    private function otherUserExist(string $userName, int $userId) {
        
        $sql = 'SELECT id FROM user WHERE (username = ? AND NOT (id = ?))';
        $params = [
            'username' => $userName,
            'id' => $userId
        ];
        $qry = $this->query($sql, $params, 'si', true);
        return !is_null($qry['result']);
    }

    public function checkOtherUserNames(string $userName, int $userId) {
        if($this->otherUserExist($userName, $userId)){
            return $this->report(array('exist' => true, 'userName' => $userName, 'id' => $userId));
        } else {
            return $this->report(array('exist' => false, 'userName' => $userName, 'id' => $userId));
        }
    }
    
    public function create_sid (){
        return bin2hex(openssl_random_pseudo_bytes(16));
    }
    
    private function saveLogin(int $userId, int $roleId, DateTime $expirtime){
        
        $loginToken =  uniqid();
        
        $params = [
            'userid' => $userId,
            'roleid' => $roleId,
            'sessionid' => $this->session->getSessionId(),
            'ipaddress' => $this->session->getClientIpAdress(),
            'token' => $loginToken,
            'expiration' => $expirtime->format('Y-m-d H:i:s')
        ];
        
        $result = $this->insert('login', $params, 'iissss');
        return $loginToken;
    }
    
    // Verify password for user, save login data to database and 
    // reply login token 
    public function userLogin(string $userName, string $password, DateTime $expirtime){
        
        if(!$this->ok()){
            return $this->report(array('login' => false));
        }
        
        // Get all required user data from database
        $sql = 'SELECT user.id AS id, '
            .'user.role AS role, role.name AS roleName, '
            .'firstname, lastname, externalid, password, '
            .'DATE_FORMAT(expirdate, "%d.%m.%Y") '
            .'FROM user LEFT JOIN role ON user.role = role.id'
            .' WHERE (username = ?)';

        $result = $this->execute($sql, $userName, 's', true);
        
        if(is_null($result)){
            
            return $this->report(array(
                'login' => false, 
                'message' => 'User does not exist'
            ));
            
        }
        
        if(password_verify($password, $result['password'])){
            
            $loginToken = $this->saveLogin($result['id'], $result['role'], $expirtime);
            
            return $this->report(array(
                'login' => true,
                'userId' => $result['id'],
                'userName' => $userName,
                'message' => 'Login success',
                // Determines user credentials in authService.Session.setLogin
                'roleId' => $result['role'],
                'roleName' => $result['roleName'],
                'loginToken' => $loginToken
            ));
                
        } else {
            
            return $this->report(array(
                'login' => false, 
                'message' => 'Password verification failed'
            ));
            
        }
    }
    
    public function userLogout(){
        // Marks all login's from current session as logged-out
        $session = $this->session->getSessionId();
        $sql = 'UPDATE login set logout = 1 WHERE sessionid =?;';
        return $this->execute($sql, array($session), 's');
    }
    
}


?>

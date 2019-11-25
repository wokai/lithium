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


/*
    Singleton schema
    https://stackoverflow.com/questions/8419332/proper-session-hijacking-prevention-in-php
    * 
    * SPA best practices for authenication (stackoverflow)
    * 
    * Server side authentification model:
    *   1) User login using session id -> Server stores user-role 
    *           (default: anonymous)
    *   2) Data request by client includes session id
    *   3) Server decides whether array is filled with database data, 
    *           on depending user-auth associated with session id
    *   4) Session id expires after some inactive time span
    *   5) Logout or login of other user causes expiration of old session and
    *           creation of new session
    * 
    * User permissions:
    *   1) Create role and permission table
    *   2) 
*/

////////////////////////////////////////////////////////////////////////////////
// Usage:
// $session = Session::getInstance();
//
// There is no start and no destroy function and no internal session state
// indicator, because an existing session object assumes an active php-session.
////////////////////////////////////////////////////////////////////////////////

class Session
{   
    // The single instance
    private static $instance;
    private static $sessionHandler;
    
    // Store last session 
    private $oldSessionId;
   
    // Disallow constructing instances
    private function __construct() {
        if(!is_null(self::$sessionHandler)){
            session_set_save_handler(self::$sessionHandler);
        }
        session_start();
    }
      
    public static function getInstance(SessionHandlerInterface $handler = null)
    {
        // The SessionHandler is not renewed upon subsequent call of
        // getInstance ....
        if(!isset(self::$instance))
        {
            self::$sessionHandler = $handler;
            self::$instance = new self;
        }
        return self::$instance;
    }
   
    ////////////////////////////////////////////////////////////////////////////
    // Manually regenerate session
    ////////////////////////////////////////////////////////////////////////////
    
    public function regenerate(){
        
        $this->oldSessionId = $this->getSessionId();
        //session_start();
        session_unset();
        session_destroy();
        session_write_close();
        setcookie(session_name(), '', 0, '/');
        session_regenerate_id(true);
    }
    
    public function isStarted(){
        return (session_status() === PHP_SESSION_ACTIVE);
    }
    
    public function isDisabled(){
        return (session_status() === PHP_SESSION_DISABLED);
    }
    
    public function isSessionNone(){
        return (session_status() === PHP_SESSION_NONE);
    }
    
    // Session id: varchar(32) not null unique key 'id';
    public function getSessionId(){
        return session_id();
    }
   
    ////////////////////////////////////////////////////////////////////////////
    // Public accessors
    ////////////////////////////////////////////////////////////////////////////
    public function __set($param , $val)
    {
        // $session->foo = "bar";
        $_SESSION[$param] = $val;
    }
    
    public function __get($name)
    {
        // $session->foo;
        if (isset($_SESSION[$name]))
        {
            return $_SESSION[$name];
        }
        return null;
    }
   
    // Check for existence
    public function __isset($name)
    {
        return isset($_SESSION[$name]);
    }
   
    // Remove item
    public function __unset($name)
    {
        unset($_SESSION[$name]);
    }

    ////////////////////////////////////////////////////////////////////////////
    // External data accessors
    ////////////////////////////////////////////////////////////////////////////
    
    public function getClientIpAdress()
    {
        // IPv6 up to 39 bytes as string: varchar(39)
        // Wrapper function. May be extended later...
        if(isset($_SERVER['REMOTE_ADDR'])){
            return  $_SERVER['REMOTE_ADDR'];
        }
        return '';
    }
    
    public function gethostname(){
        return gethostname();
    }
}


?>

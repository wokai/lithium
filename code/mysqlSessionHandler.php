<?php

////////////////////////////////////////////////////////////////////////////////
// See:
// https://github.com/php/php-src/blob/master/ext/session/session.c
// Maximal session_id length:
// PS_MAX_SID_LENGTH 256
//
//
// Create database table:
// CREATE TABLE php_session (id VARCHAR(255) CHARACTER SET utf8 NOT NULL PRIMARY KEY , data TEXT, timestamp INT UNSIGNED NOT NULL, date DATETIME DEFAULT CURRENT_TIMESTAMP);
// Background: MariaDB (10.1.26-MariaDB-0+deb9u1 ) throws error:
// ERROR 1071 (42000): Specified key was too long; max key length is 767 bytes
// See:
// http://mysql.rjweb.org/doc.php/limits#767_limit_in_innodb_indexes
// Standard size of sesson_id: 33 characters.
//
// 
// Usage:
// var $handler = new SessionHandler();
// session_set_save_handler($handler, true);
// session_start();
////////////////////////////////////////////////////////////////////////////////



class MySqlSessionHandler implements SessionHandlerInterface
{
    private $connection;
    const dbTable = 'php_session';
    
    public function __construct($dbCon){
        $this->connection = $dbCon;
    }

    public function __destruct() {
        // Destructor
    }
    
    ////////////////////////////////////////////////////////////////////////////
    // IMplementation of interface
    ////////////////////////////////////////////////////////////////////////////

    // @param   string session id
    // @return  bool
    public function open($save_path, $session_name){
        $limit = time() - (3600 * 24);
        $sql = sprintf("DELETE FROM %s WHERE (timestamp < ?)", self::dbTable);
        $stmt = $this->connection->prepare($sql);
        $stmt->bind_param("s", $limit);
        return $stmt->execute();
    }
    
    public function close()
    {
        return true;
    }

    // @param   string session id
    // @return  string
    public function read($session_id){
        $sql = sprintf("SELECT data FROM %s WHERE (id = ?)", self::dbTable);
        $stmt = $this->connection->prepare($sql);
        $stmt->bind_param("s", $session_id);
        $session = $stmt->fetch();
        
        if($session){
            return $session['data'];
        }
        return '';
    }

    // @param   string session_id
    // @param   string session_data
    // @return  bool

    public function write($session_id, $session_data){
        $sql = sprintf("REPLACE INTO %s (id, data, timestamp) VALUES (?, ?, ?)", self::dbTable);
        $stmt = $this->connection->prepare($sql);
        $stmt->bind_param("ssi", $session_id, $session_data, time());
        $ret = $stmt->execute();
        return $ret;
    }

    // @param   string session id
    // @return  bool
    public function destroy($session_id){
        $sql = sprintf("DELETE FROM %s WHERE (id = ?)", self::dbTable);
        $stmt = $this->connection->prepare($sql);
        $stmt->bind_param("s", $session_id);
        return $stmt->execute();
    }

    // @param   int maxlifetime: life time (in seconds)
    // @return  int
    public function gc($maxlifetime){
        $sql = sprintf("DELETE FROM %s WHERE (timestamp < ?)", self::dbTable);
        //$sql = "DELETE FROM php_session WHERE (timestamp < ?)";
        $stmt = $this->connection->prepare($sql);
        $stmt->bind_param("s", time() - intval(maxlifetime));
        return $stmt->execute();
    }
    
    ////////////////////////////////////////////////////////////////////////////
    // Extra functions
    ////////////////////////////////////////////////////////////////////////////
        
    // Will be called when session_regenerate_id() is invoked.
    // Maybe there is no need to override this ?
    /*
     * @param void
     * @return string
     */
    public function create_sid (){
        return bin2hex(openssl_random_pseudo_bytes(16));
    }
}

    /*
    * @param int life time (sec.)
    * @return int
    *
    * To implement sessions in a secure and resilient way, one should strongly
    * consider thinking of session destruction as nothing more than setting as 
    * setting session data as invalid. 
    * That session data might need to remain in order to handle things such as
    * race conditions from asynchronous requests, such that you can maintain
    * good user experience in your application. 
    * Most mature implementations require setting of timestamp-based controls
    * around data validity and a separate process for data deletion.
    *
    * So here your destroy() function might simply update a field on the record
    * that the data is no longer valid and setting a TTL (maybe a few seconds,
    * maybe longer depending on your application needs) on when the data should
    * be eligible for final deletion via garbage collection.
    * Your gc() method should then look to delete either active sessions where
    * last update is past maximum lifetime or inactive records that have passed
    * the data validity TTL (time to live).
    * 
    * See also PHP documentation: session_regenerate_id
    * 
    * 
    */

?>

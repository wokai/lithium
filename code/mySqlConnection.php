<?php

////////////////////////////////////////////////////////////////////////////////
// Syslog (numerical codes)
// https://tools.ietf.org/html/rfc5424
//
////////////////////////////////////////////////////////////////////////////////
// 1) Install composer on debian
// 2) Run 'composer require monolog/monolog' inside 
//      projects/html/angular/auth/code, which will create the vendor
//      directory (+ content)
// 3) Create /var/log/monolog directory and make accesible for apache-user:
//      chown www-data:www-data /var/log/monolog
////////////////////////////////////////////////////////////////////////////////
require_once(__DIR__.'/vendor/autoload.php');

use Monolog\Handler\StreamHandler;
use Monolog\Logger;


class MySQlConnection {

    // Status of mySql-connection
    private $ok;
    
    protected $logger;

    // Status of last query
    protected $query_status = array(
        'message' => '',
        'code' => 0,
        'file' => '',
        'line' => '',
        'affected_rows' => 0,
        'insert_id' => 0
    );
    
    // mysqli obj
    protected $connection;
    
    ////////////////////////////////////////////////////////////////////////////
    // Status related functions
    ////////////////////////////////////////////////////////////////////////////

    private function setError(Exception $e){
        $this->query_status['message'] = $e->getMessage();
        $this->query_status['code'] = $e->getCode();
        $this->query_status['file'] = $e->getFile();
        $this->query_status['line'] = $e->getLine();
        $this->query_status['affected_rows'] = 0;
        $this->query_status['insert_id'] = 0;
    }

    // Report query success...
    private function setOK(string $message = 'OK') {

        if( ($this->connection->info) != '') {
            $message = $this->connection->info;
        }
        
        $this->query_status['message'] = $message;
        $this->query_status['code'] = 0;
        $this->query_status['file'] = '';
        $this->query_status['line'] = '';
        $this->query_status['affected_rows'] = $this->connection->affected_rows;
        $this->query_status['insert_id'] = $this->connection->insert_id;
    }
        

    ////////////////////////////////////////////////////////////////////////////
    // Constructor and destructor
    ////////////////////////////////////////////////////////////////////////////

    public function __construct(string $hostName, string $dataBase, 
                                string $userName, string $passWord) {
                                    
        $this->logger = new Logger('MySqlConnection');
        
        $log_file = '/var/log/monolog/mySql_'.date('Y-m-d').'.log';
        // Catch all messages:
        $logstream = new StreamHandler($log_file, Logger::DEBUG);
        $this->logger->pushHandler($logstream);
        
        try {
            mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
            $this->connection = new mysqli($hostName, $userName, $passWord, $dataBase);
            $this->connection->set_charset("utf8mb4");
            $this->ok = true;
            $this->logger->info('Login success. Database: '.$dataBase.', User: '.$userName);
            
        }  catch(mysqli_sql_exception $e) {
            $this->ok = false;
            $this->setError($e);
            $this->logger->error('Login failure. Database: '.$dataBase.', User: '.$userName);
        }
    }

    public function __destruct() {
        $this->connection->close();
    }
    
    ////////////////////////////////////////////////////////////////////
    // Prepares string for usage in SQL
    ////////////////////////////////////////////////////////////////////
    public function prepareString(string $text){
        if($this->errno !=0)
            return null;
        
        // Removes backslashes added by the addslashes() function
        if(get_magic_quotes_gpc()){
            $text = stripcslashes($text);
        }
        
        // Escapes characters in order to create a legal SQL string
        return $this->connection->real_escape_string($text);
    }
    
    ////////////////////////////////////////////////////////////////////////////
    // Protected interface
    ////////////////////////////////////////////////////////////////////////////
    
    protected function fetchArray($query, $row = false)
    {
        try {
            
            $result = $this->connection->query($query);
            $this->setOK();

            // TRUE when CREATE, INSERT, DELETE, ...
            if(!$result || $result === TRUE)
                return null;
            
            $qarray = array();
            //$qarray = $result->fetch_all(MYSQLI_ASSOC);
            if($row) {
                // Return data from a single row
                $qarray = $result->fetch_array(MYSQLI_ASSOC);
            } else {
                $qarray = $result->fetch_all(MYSQLI_ASSOC);
            }
            
            $result->free();
            $this->logger->info('fetchArray. Sql: '.$query);
            return $qarray;
            
        } catch(mysqli_sql_exception $e) {
            $this->setError($e);
            $this->logger->error('fetchArray. Sql: '.$query);
            return false;
        }
    }
    
    
    protected function execute(string $sql, $params = [], string $types = '', $row = false) {
        
        if(!is_array($params))
            $params = [$params];

        // Default type: string
        if(!$types) 
            $types = str_repeat('s', count($params));
        

        try {
            $stmt = $this->connection->prepare($sql);
            call_user_func_array(array($stmt, "bind_param"), array_merge(array($types), $params));
            $stmt->execute();
            $result = $stmt->get_result();
            $this->setOK();
            
            if(!$result)
                return null;
                
            $qarray = array();
            
            if($row) {
                // Return data from a single row
                $qarray = $result->fetch_array(MYSQLI_ASSOC);
            } else {
                $qarray = $result->fetch_all(MYSQLI_ASSOC);
            }
            
            $this->logger->info('Execute. Sql: '.$sql);
            $result->free();
            return $qarray;
            
        } catch(mysqli_sql_exception $e) {
            $this->setError($e);
            $this->logger->error('Execute error: '.$e->getMessage().' SQL: '.$sql);
            return false;
        }
    }
    
    ////////////////////////////////////////////////////////////////////////////
    // May be used by derived connections for reporting of error message
    // and insert_id
    ////////////////////////////////////////////////////////////////////////////
    protected function report($result) {
        return array(
            'status' => $this->query_status,
            'result' => $result
        );
    }
    
    public function reportStatus() {
        if($this->ok()) {
            return $this->report(array('status' => 'OK' , 'whoami' => exec('whoami')));
        } else {
            return $this->report(array('status' => 'Error'));
        }
    }
    
    ////////////////////////////////////////////////////////////////////////////
    // Simplified interface for sql - INSERT
    // Used for creation of large records from input forms
    ////////////////////////////////////////////////////////////////////////////
    protected function insert(string $table, $params = [], $types = '') {
        
        if(!is_array($params) || array_keys($params) == null) {
            throw new Exception('No array keys provided', 1166);
        }
        
        $table = $this->prepareString($table);
        
        // Read column names from array keys
        $column_names = implode(', ', array_keys($params));
        $question_marks = implode(',', array_fill(0, count($params), '?') );
        
        // Prepare sql statement
        $sql = 'INSERT INTO '.$table
            .' ('.$column_names.') VALUES ('.$question_marks.')';
        
        // Prepared statement, returns 0 upon failure
        $this->execute($sql, $params, $types);
        
        // 'INSERT' returns NULL
        if($this->ok()) {
            return $this->report(array('insert' => true));
        } else {
            return $this->report(array('insert' => false));
        }
    }

    ////////////////////////////////////////////////////////////////////////////
    // Simplified interface for sql - UPDATE
    // Requires 'id' column
    ////////////////////////////////////////////////////////////////////////////
    protected function update(string $table, int $id=0, $params=[], $types='') {

        if(!is_array($params) || array_keys($params) == null) {
            throw new Exception('No array keys provided', 1166);
        }
        
        $table = $this->prepareString($table);

        $keys = array_keys($params);
        $set = $keys[0].' = ?';
        for($i = 1; $i < count($params); $i++) {
            $set .= ', '.$keys[$i].' = ?';
        }
        $sql = 'UPDATE '.$table.' SET '.$set.' WHERE (id = '.$id.');';
        $this->execute($sql, $params, $types);
        
        // 'UPDATE' returns NULL
        if($this->ok()) {
            return $this->report(array('update' => true));
        } else {
            return $this->report(array('update' => false));
        }
    }
    
    ////////////////////////////////////////////////////////////////////////////
    // Simplified interface for sql - SELECT
    ////////////////////////////////////////////////////////////////////////////
    protected function select(string $table, $params=[], int $id=NULL, string $order=NULL, int $limit=NULL){
        
        $table = $this->prepareString($table);
        
        if(empty($params)){
            $columns = '*';
        } else {
            $columns = $this->prepareString(implode(', ', $params));
        }
        
        $sql = 'SELECT '.$columns.' FROM '.$table;
        if($id != NULL){
            $sql .= ' WHERE id='.$id;
            return $this->report($this->fetchArray($sql, true));
        } else {
            if($order != NULL){
                
                if($order == 'desc'){
                    $sql .= ' ORDER BY id DESC';
                } else if ($order == 'asc'){
                    $sql .= ' ORDER BY id ASC';
                }
            }
        
            if($limit != NULL){
                $sql .= ' LIMIT '.$limit;
            }
            return $this->report($this->fetchArray($sql, false));
        }
        

    }


    ////////////////////////////////////////////////////////////////////////////
    // Public interface
    ////////////////////////////////////////////////////////////////////////////
    
    public function ok() {
        if(!$this->ok)
            return false;
            
        return $this->query_status['code'] == 0;
    }

    public function getStatus(){
        return $this->query_status;
    }

    // $row = true will fetch a single row which then can be accessed
    // using e.g. result.id instead of result[0].id
    public function query(string $sql, $params=[], string $types='', bool $row=false) {

        if(!$this->ok)
            return false;

        if(empty($params)) {
            // Simple query without parameters
            return $this->report($this->fetchArray($sql));
        }

        // Prepared statement
        return $this->report($this->execute($sql, $params, $types, $row));
    }


}
?>

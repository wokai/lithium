<?php
// Should be located in the same directory as me
require_once(__DIR__.'/mySqlConnection.php');


////////////////////////////////////////////////////////////////////////////////
// Setup database for scientific data:
// CREATE DATABASE sciencedb;
////////////////////////////////////////////////////////////////////////////////

class ScienceDbConnection extends MySqlConnection {

    private static $loginTableLimit = 5;

    public function __construct() {
        parent::__construct('localhost', 'sciencedb', 'xxx', 'xxxxx');
    }

    // Provide generic database actions
    public function insert(string $table, $params = [], $types = '') {
        return parent::insert($table, $params, $types);
    }
    
    public function update(string $table, int $id=0, $params=[], $types='') {
        return parent::update($table, $id, $params, $types);
    }

    public function select(string $table, $params=[], int $id=NULL, string $order=NULL, int $limit=NULL){
        return parent::select($table, $params, $id, $order, $limit);
    }

}


?>

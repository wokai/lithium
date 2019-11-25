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

// Includes Scvna.php
require_once(__DIR__.'/code/scienceDbConnection.php');
require_once(__DIR__.'/code/vendor/autoload.php');

use Monolog\Handler\StreamHandler;
use Monolog\Logger;

$logger = new Logger('scienceActions');
$log_file = '/var/log/monolog/science_actions_'.date('Y-m-d').'.log';
// Catch all messages:
$logstream = new StreamHandler($log_file, Logger::DEBUG);
$logger->pushHandler($logstream);


$postdata = file_get_contents("php://input", true);
$request = json_decode($postdata, true);


$connection = new ScienceDbConnection();
if(!$connection->ok())
{
    http_response_code(404);
    echo json_encode($connection->reportStatus());
    exit;
}


$action = $request['action'];
$data = $request['data'];

switch ($action) {
    case 'science_db_insert':
        $result =  $connection->insert($data['table'], $data['params'], $data['types']);
        $logger->info('Database insert requested for table '.$data['table']);
        break;
        
    case 'science_db_update':
        $result = $connection->update($data['table'], $request['id'], $data['params'], $data['types']);
        $logger->info('Database update requested for table '.$data['table']);
        break;
        
    case 'science_db_select':
        $result = $connection->select($data['table'], $data['params'], $data['id'], $data['order'], $data['limit']);
        $logger->info('Database select requested for table '.$data['table']);
        break;
    
    default:
        $result = $connection->reportStatus();
}

if(!$connection->ok())
{
    http_response_code(404);
    echo json_encode($connection->reportStatus());
    exit;
}

echo json_encode($result);
?>

<?php
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

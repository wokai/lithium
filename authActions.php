<?php
// Should be located in 'code' subdirectory ...
// Includes User.php
require_once(__DIR__.'/code/authController.php');

$postdata = file_get_contents("php://input", true);
$request = json_decode($postdata);
$controller = new AuthController();

if(!$controller->ok())
{
    http_response_code(404);
    echo json_encode($controller->reportStatus());
    exit;
}

switch ($request->action) {

    case 'reset_login_expir':
        $result = $controller->resetLoginExpirationTime($request->loginToken);
        break;
        
    case 'get_active_user_names':
        // user-name in response.data.result -> user.name
        $result = $controller->getActiveUserNames();
        break;
    
    case 'get_active_user_table':
        $result = $controller->getActiveUserTable();
        break;
        
    case 'user_login':
        $data = $request->loginData;
        $result = $controller->userLogin($data->userName, $data->password);
        break;
        
    case 'user_logout':
        $result = $controller->userLogout();
        break;

    case 'get_user_data':
        $result = $controller->getUserData($request->userData->userId);
        break;
        
    case 'get_user_login_table':
        $result = $controller->getUserLoginTable($request->userData->userId);
        break;
    
    case 'get_user_table':
        $result = $controller->getUserTable();
        break;
        
    case 'get_user_roles':
        $result = $controller->getRoleNames();
        break;
        
    case 'reset_user_password':
        $result = $controller->resetUserPassword($request->data->userId);
        break;

    case 'update_user_registration':
        $result = $controller->updateUserRegistration($request->user);
        break;
        
    case 'register_new_user':
        $result = $controller->registerNewUser($request->user);
        break;
        
    case 'update_user_password':
        $result = $controller->updateUserPassword($request->user);
        break;
        
    case 'check_last_login':
        $result = $controller->checkLogin($request->loginToken);
        break;
    
    default:
        $result = $controller->reportStatus();
}


if(!$controller->ok())
{
    http_response_code(404);
    echo json_encode($controller->reportStatus());
    exit;
}


////////////////////////////////////////////////////////////////////////////////
// MySqlConnection->report:
// $result  -> status   -> message
//                      -> code
//                      -> file
//                      -> line
//                      -> affected_rows
//                      -> insert_id
//
//          -> result   -> array(...)
////////////////////////////////////////////////////////////////////////////////

echo json_encode($result);
?>

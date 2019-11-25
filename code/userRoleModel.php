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

use Monolog\Handler\StreamHandler;
use Monolog\Logger;

class UserRoleModel{
    
    private static $fileName = __DIR__.'/userRoleDefinition.xml';
    // Name of role-elements in XML file
    private static $xmlRoleElement = 'role';
    // XML attribute denoting role-name
    private static $xmlNameAttribute = 'name';
    
    private $xml;       // SimpleXMLElement
    private $logger;
    
    
    public function __construct() {
        
        // Initialise logger
        $this->logger = new Logger('UserRoleModel');
        $log_file = '/var/log/monolog/user_role_model_'.date('Y-m-d').'.log';
        // Catch all messages:
        $logstream = new StreamHandler($log_file, Logger::DEBUG);
        $this->logger->pushHandler($logstream);
        
        // Import role-model from role_definition XML file
        libxml_use_internal_errors(true);
        $this->xml = simplexml_load_file(self::$fileName);
        if($this->xml === false){
            $this->logger->error('UserRoleModel constructor: Parser returned false.');
            $this->checkXmlErrors();
        }
    }
    
    private function checkXmlErrors(){
        $errors = libxml_get_errors();
        foreach((array)$errors as $error) {
            $this->logger->error('XML parsing error. Level: '
                .$error->level.' Code: ' .$error->code 
                .' File: ' .$error->file 
                .' Line: ' .$error->line
                .'\nMessage: ' .$error->message);
        }
        libxml_clear_errors();
    }
    
    public function ok(){
        return $this->xml !== false;
    }
    
    ////////////////////////////////////////////////////////////////////////////
    // Recursively finds given role name in XML-defined roles and then 
    // collects all sub-roles into provided array.
    // The returned array contains the given role name and names of all 
    // sub-roles defined in the 'role_definition.xml' file.
    ////////////////////////////////////////////////////////////////////////////
    private function checkRoleNames(&$array, &$sxe, $name){
        if($sxe->getName() == self::$xmlRoleElement){
            if($sxe[self::$xmlNameAttribute] == $name){
                $this->pushRoleNames($array, $sxe);
            } else {
                foreach($sxe->children() as $x){
                    $this->checkRoleNames($array, $x, $name); 
                }
            }
        }
    }

    // Recursively collects all sub-roles from XML role-elements into 
    // provided array
    private function pushRoleNames(&$array, &$sxe){
        if($sxe->getName() == self::$xmlRoleElement){
            $array[] = (string)$sxe[self::$xmlNameAttribute];
            foreach($sxe->children() as $x){
                $this->pushRoleNames($array, $x);
            }
        }
    }

    public function getSubRoleArray(string $roleName){
        $array = array();
        $this->checkRoleNames($array, $this->xml, $roleName);
        return $array;
    }

}



?>

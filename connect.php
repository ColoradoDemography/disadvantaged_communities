<?php

//distinguish between server in nitrous dev environment (use official AWS Database)
//vs Server Elsewhere (use local database)
$dev = substr($_SERVER['SERVER_NAME'],0,10);
if($dev=='codemogapi'){$server="54.69.15.55";}else{$server=$_SERVER['SERVER_NAME'];}
$user="codemog";
$password="demography";

?>
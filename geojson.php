<?php
header("Access-Control-Allow-Origin: *");
//TEST FILE - NOT FOR PRODUCTION
header('Content-disposition: attachment; filename=geoFile.geojson');
      header('Content-Type: application/json');
    // Disable caching
    header("Cache-Control: no-cache, no-store, must-revalidate"); // HTTP 1.1
    header("Pragma: no-cache"); // HTTP 1.0
    header("Expires: 0"); // Proxies

require 'connect.php';
//file with connection information
//setup like:
//$server="server";
//$user="username";
//$password="password";


//parameters: lgid (optional):FUTURE, limit (optional), zoom (optional), bb (optional)

//strict
function make_safe($string) {
    $string = preg_replace("/[^A-Za-z0-9, \-.]/", '', $string);
    return $string;
}

//$GET Variables

//potential multi select (comma delimited list)
if (isset($_GET['lgid'])){$geoid = make_safe($_GET['lgid']);}

$db ='dola';
$schema='bounds';
$limit=100;  //by default limits to 100 search results.  override by setting limit= in GET string
if (isset($_GET['limit'])){$limit = make_safe($_GET['limit']);}

//get simplify factor
if (isset($_GET['zoom'])){$zoom=make_safe($_GET['zoom']);}else{$zoom=16;}

if($zoom==2){$tolerance=0.2;}
if($zoom==3){$tolerance=0.1;}
if($zoom==4){$tolerance=0.07;}
if($zoom==5){$tolerance=0.04;}
if($zoom==6){$tolerance=0.018;}
if($zoom==7){$tolerance=0.01;}
if($zoom==8){$tolerance=0.005;}
if($zoom==9){$tolerance=0.003;}
if($zoom==10){$tolerance=0.0015;}
if($zoom==11){$tolerance=0.001;}
if($zoom==12){$tolerance=0.0005;}
if($zoom==13){$tolerance=0.00025;}
if($zoom==14){$tolerance=0.0001;}
if($zoom==15){$tolerance=0.0001;}
if($zoom==16){$tolerance=0.0001;}


  
// attempt a connection
$dbh = pg_connect("host=".$server." dbname=".$db." user=".$user." password=".$password);

if (!$dbh) {
    die("Error in connection: " . pg_last_error());
}




$bbstr=""; //bounding box string

//potential single select
if (isset($_GET['bb'])){
  $bb = make_safe($_GET['bb']);
$bbstr="bounds.test_rp.geom && ST_MakeEnvelope(".$bb.", 4326) ";
}  //bounding box example: "-105,40,-104,39" no spaces no quotes



  //CONSTRUCT MAIN SQL STATEMENT
// execute query
$sql = "SELECT lgid, lgname, lgtypeid, lgstatusid, source, st_asgeojson(st_transform(ST_Simplify(" . pg_escape_string('geom') . ",".$tolerance."),4326)) AS geojson from bounds.test_rp natural join bounds.lgbasic where ".$bbstr." limit $limit;";

//echo $sql;

$result = pg_query($dbh, $sql);


  //flag error
if (!$result) {
    die("Error in SQL query: " . pg_last_error());
}


# Build GeoJSON
$output    = '';
$rowOutput = '';

while ($row = pg_fetch_assoc($result)) {
    $rowOutput = (strlen($rowOutput) > 0 ? ',' : '') . '{"type": "Feature", "geometry": ' . $row['geojson'] . ', "properties": {';
    $props = '';
    $id    = '';
    foreach ($row as $key => $val) {
        if ($key != "geojson") {
            $props .= (strlen($props) > 0 ? ',' : '') . '"' . $key . '":"' . escapeJsonString($val) . '"';
        }
        if ($key == "id") {
            $id .= ',"id":"' . escapeJsonString($val) . '"';
        }
    }
    
    $rowOutput .= $props . '}';
    $rowOutput .= $id;
    $rowOutput .= '}';
    $output .= $rowOutput;
}

$output = '{ "type": "FeatureCollection", "features": [ ' . $output . ' ]}';
echo $output;


a: {  

  
};



//supporting functions
function escapeJsonString($value) { # list from www.json.org: (\b backspace, \f formfeed)
  $escapers = array("\\", "/", "\"", "\n", "\r", "\t", "\x08", "\x0c");
  $replacements = array("\\\\", "\\/", "\\\"", "\\n", "\\r", "\\t", "\\f", "\\b");
  $result = str_replace($escapers, $replacements, $value);
  return $result;
}



?>
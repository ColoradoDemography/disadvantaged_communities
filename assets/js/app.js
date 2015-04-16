
//app moving pieces: To Update as Needed
//------------------
//bbox.js - created using getLatLng.html and JSON.stringify(locationsarray) in console - used for search bounding boxes
//lgbasic table in postgres dola.bounds.lgbasic - export lgbasic from Oracle occasionally and reload here
//districts table in dola.bounds.lgbasic - as needed when district boundaries change

//export counties from TIGER, munis from TIGER (because TIGER has places), Districts Shapefile from DOLA - create geojson files (remember WGS84), feed to getLatLng.html
//  - - - - remember to rename county name and muni name fields to lgname so that getLatLng.html can work with it

var map, globalbusy, geojsonLayer, lastzoom, active='1', filter='6', limit=200;
//active = whether to show inactive districts.  Active=0 : show all, including inactive.  Active=1 : show only active
//filter = comma delimited list of district lgtypes to show




//Leaflet Custom Control
L.Control.Command = L.Control.extend({
    options: {
        position: 'topleft',
    },

    onAdd: function (map) {
        var controlDiv = L.DomUtil.create('div', 'leaflet-control-command');


        var controlUI = L.DomUtil.create('div', 'leaflet-control-command-interior', controlDiv);
        controlUI.title = 'Filter Districts';
        var textdiv = L.DomUtil.create('div','ctrldesc',controlUI);
        var divsec = L.DomUtil.create('b','titletext',textdiv);
        divsec.innerHTML = 'Filter Districts';
        var hrbreak = L.DomUtil.create('hr','hrcss',controlUI);      
        var selectUI = L.DomUtil.create('select', 'seldiv', controlUI);
        selectUI.title = 'Select District Category';     
      
             L.DomEvent
            .addListener(selectUI, 'change', L.DomEvent.stopPropagation)
            .addListener(selectUI, 'change', L.DomEvent.preventDefault)
        .addListener(selectUI, 'change', refilter); 
      
   var option;
   var inputdata = "Metropolitan Districts||Park & Recreation Districts||Fire Protection Districts||Hospital Districts||Water & Sanitation Districts||Library Districts||School Districts||Other Districts||All Districts";

    inputdata.split( '||' ).forEach(function( item ) {
        option = document.createElement( 'option' );
        option.value = option.textContent = item;
        selectUI.appendChild( option );
    });
      
      var chkdiv = L.DomUtil.create('div', '', controlUI);

      var x = L.DomUtil.create('input', '', chkdiv);
        x.setAttribute("type", "checkbox");
        x.id="ischk";
      var t=document.createTextNode("Show Inactive Districts");
        chkdiv.appendChild(t); 

      x.addEventListener ("change", refilter, false);

        return controlDiv;
    }
});


L.control.command = function (options) {
    return new L.Control.Command(options);
};


function refilter(){

  var ischecked = $('#ischk').is(':checked');
  var districtfilter = $('.seldiv :selected').text();  
  
  switch (districtfilter) {
      case 'All Districts': filter = "0"; break;      
      case 'Metropolitan Districts': filter = "6"; break;
      case 'Park & Recreation Districts': filter = "7"; break;
      case 'Fire Protection Districts': filter = "8"; break;
      case 'Hospital Districts': filter = "9"; break;
      case 'Water & Sanitation Districts': filter = "10,11,12"; break;  
      case 'Library Districts': filter = "16"; break;
      case 'School Districts': filter = "99"; break;
      case 'Other Districts': filter = "13,14,15,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,62,63,64,65,66,67,68,69,71,72,73,74,75,76,77,78,79,80,95,96,97,98"; break;
      }
  
  if(ischecked){active='0';}else{active='1';}
  
  ajaxcall();
  
}




//map bounds the last time the data was loaded
var coord={};
coord.nelat='';
coord.nelng='';
coord.swlat='';
coord.swlng='';

$(window).resize(function() {
  sizeLayerControl();
});


$("#about-btn").click(function() {
  $("#aboutModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});


$("#nav-btn").click(function() {
  $(".navbar-collapse").collapse("toggle");
  return false;
});


function sizeLayerControl() {
  $(".leaflet-control-layers").css("max-height", $("#map").height() - 50);
}

    function ajaxcall() {
         
      
      var r, diff1, diff2, newbounds;     

        geojsonLayer.clearLayers();

        lastzoom = map.getZoom();
        r = map.getBounds();
        coord.nelat = (r._northEast.lat);
        coord.nelng = (r._northEast.lng);
        coord.swlat = (r._southWest.lat);
        coord.swlng = (r._southWest.lng);

        diff1 = (coord.nelat - coord.swlat) / 2;
        diff2 = (coord.nelng - coord.swlng) / 2;

        //we calculate a bounding box equal much larger than the actual visible map.  This preloades shapes that are off the map.  Combined with the center point query, this will allow us to not have to requery the database on every map movement.
        newbounds = (coord.swlng - diff2) + "," + (coord.swlat - diff1) + "," + (coord.nelng + diff2) + "," + (coord.nelat + diff1);

        geojsonLayer.refresh("assets/php/geojson.php?limit="+limit+"&active="+active+"&filter="+filter+"&bb=" + newbounds + "&zoom=" + map.getZoom() ); //add a new layer replacing whatever is there

    }


Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};



    //after successfull ajax call, data is sent here
    function getJson(data) {

      // Get the size of an object
      var size = Object.size(data.features);

      if(size===limit){$('#notice').show();setTimeout(function(){ $('#notice').hide(); }, 2000);}

        geojsonLayer.clearLayers(); //(mostly) eliminates double-draw (should be technically unneccessary if you look at the code of leaflet-ajax...but still seems to help)
        geojsonLayer.addData(data);

        geojsonLayer.setStyle(stylefunc);   //geojsonLayer.setStyle(feat1);   
        map.addLayer(geojsonLayer);
      
    }

function stylefunc(feature){
      
      var typical={
      color: "black",
      weight: 1,
      fill: true,
      opacity: 1,
      fillOpacity: 0.4,
        clickable: true,
    'zIndex': 10
      };
            
      //console.log(feature);
        switch ((feature.properties.lgid).toString().slice(-1)) {
            case '0': typical.color = "#5E5075"; return typical;
            case '1': typical.color = "#6DAF48"; return typical;
            case '2': typical.color = "#CD4A31"; return typical;
            case '3': typical.color = "#B25BD2"; return typical;
            case '4': typical.color = "#51A19E"; return typical;
            case '5': typical.color = "#BD8A39"; return typical;
            case '6': typical.color = "#506330"; return typical;
            case '7': typical.color = "#C75293"; return typical;
            case '8': typical.color = "#A95155"; return typical;
            case '9': typical.color = "#8289CC"; return typical;
        }
      
      return typical;
      
    
  
}

/* Basemap Layers */
var mapquestOSM = L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png", {
  maxZoom: 19,
  subdomains: ["otile1", "otile2", "otile3", "otile4"],
  attribution: 'Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA.'
});
var mapquestOAM = L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg", {
  maxZoom: 18,
  subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"],
  attribution: 'Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a>. Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
});
var mapquestHYB = L.layerGroup([L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg", {
  maxZoom: 18,
  subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"]
}), L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/hyb/{z}/{x}/{y}.png", {
  maxZoom: 19,
  subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"],
  attribution: 'Labels courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA. Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
})]);




L.mapbox.accessToken = 'pk.eyJ1Ijoic3RhdGVjb2RlbW9nIiwiYSI6Ikp0Sk1tSmsifQ.hl44-VjKTJNEP5pgDFcFPg';

/* Basemap Layers */  //not ideal because of double - labels
var mbstyle = L.mapbox.tileLayer('statecodemog.aa380654', {
    'zIndex': 1
});
var mbsat = L.mapbox.tileLayer('statecodemog.km7i3g01');



map = L.map("map", {
  zoom: 10,
  center: [40, -104.979378],
  layers: [mbstyle],
  minZoom: 6,
  maxZoom: 16,
  zoomControl: false,
  attributionControl: false
});



//define labels layer
var mblabels = L.mapbox.tileLayer('statecodemog.798453f5', {
    'clickable': false,
    'zIndex': 100
});

//create map sandwich
var topPane = map._createPane('leaflet-top-pane', map.getPanes().mapPane);
var topLayer = mblabels.addTo(map);
topPane.appendChild(topLayer.getContainer());





var LeafletFilterControl = L.control.command({postion: 'topleft'});
map.addControl(LeafletFilterControl);


/* Attribution control */  //bootleaf
var attributionControl = L.control({
    position: "bottomright"
});
attributionControl.onAdd = function() {
    var div = L.DomUtil.create("div", "leaflet-control-attribution");
  div.innerHTML = "<span class='hidden-xs'>Developed by: <a href='http://www.colorado.gov/demography'>Colorado State Demography Office</a></span><span class='spanhide'> | <a href='#' onclick='$(\"#attributionModal\").modal(\"show\"); return false;'>Sources</a></span>";
    return div;
};
map.addControl(attributionControl);

//MapBox and OpenStreet Map Required Attribution
var attributionControl2 = L.control({
    position: "bottomright"
});
attributionControl2.onAdd = function() {
    var div = L.DomUtil.create("div", "leaflet-control-attribution");
    div.innerHTML = "<a href='https://www.mapbox.com/about/maps/' target='_blank'>Maps &copy; Mapbox &copy; OpenStreetMap</a><span class='spanhide'>&nbsp;&nbsp;&nbsp;<a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve This Map</a></span>";
    return div;
};
map.addControl(attributionControl2);

var zoomControl = L.control.zoom({
  position: "bottomright"
}).addTo(map);

/* GPS enabled geolocation control set to follow the user's location */
var locateControl = L.control.locate({
  position: "bottomright",
  drawCircle: true,
  follow: true,
  setView: true,
  keepCurrentZoomLevel: true,
  markerStyle: {
    weight: 1,
    opacity: 0.8,
    fillOpacity: 0.8
  },
  circleStyle: {
    weight: 1,
    clickable: false
  },
  icon: "icon-direction",
  metric: false,
  strings: {
    title: "My location",
    popup: "You are within {distance} {unit} from this point",
    outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
  },
  locateOptions: {
    maxZoom: 18,
    watch: true,
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 10000
  }
}).addTo(map);

/* Larger screens get expanded layer control and visible sidebar */
if (document.body.clientWidth <= 767) {
  var isCollapsed = true;
} else {  var isCollapsed = false; }


var baseLayers = {
    "Mapbox: Satellite": mbsat,
    "Mapbox: Contrast Base": mbstyle
};


//var groupedOverlays = {
//  "District Categories": {
//    "Example": example
//  }
//};

var layerControl = L.control.groupedLayers(baseLayers, {}, {
  collapsed: isCollapsed
}).addTo(map);

/* Highlight search box text on click */
$("#searchbox").click(function () {
  $(this).select();
});

/* Prevent hitting enter from refreshing the page */
$("#searchbox").keypress(function (e) {
  if (e.which == 13) {
    e.preventDefault();
  }
});

// Leaflet patch to make layer control scrollable on touch browsers
var container = $(".leaflet-control-layers")[0];
if (!L.Browser.touch) {  L.DomEvent.disableClickPropagation(container).disableScrollPropagation(container);} else { L.DomEvent.disableClickPropagation(container);}
$("#loading").hide();






//BELOW FOR TYPEAHEAD

/* Highlight search box text on click */
$("#the-basics").click(function () {
  $(this).select();
});
   
var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substringRegex;
 
    // an array that will be populated with substring matches
    matches = [];
 
    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');
 
    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        // the typeahead jQuery plugin expects suggestions to a
        // JavaScript object, refer to typeahead docs for more info
        matches.push({ value: str });
      }
    });
 
    cb(matches);
  };
};

 $("#searchbox").click(function () {
  $(this).select();
});

$('#the-basics .typeahead').typeahead({ hint: true,  highlight: true,  minLength: 4},{
  name: 'locations',
  displayKey: 'value',
  source: substringMatcher(locations)
});
	
$('#the-basics .typeahead').on('typeahead:selected', function (e, datum) { searchresult(datum); }).on('typeahead:autocompleted', function (e, datum) {	searchresult(datum);});	
	
function searchresult(result){
  
  var id= result.value;
  var strbb;
  var southWest, northEast;
  var bounds;
  
  for(var i in bbox){
    if(bbox[i].id===id){strbb=bbox[i].bb;}
    }

    bbarray=strbb.split(',');
    southWest = new L.LatLng(bbarray[1], bbarray[0]);
    northEast = new L.LatLng(bbarray[3], bbarray[2]);
    bounds = new L.LatLngBounds(southWest, northEast);
    map.fitBounds(bounds);
  
}


function onEachFeature(feature, layer) {
  
  
  
       function typelookup(district){
         
                 switch (district) {
            case '6': return "Metropolitan District";
            case '7': return "Park & Recreation District";
            case '8': return "Fire Protection District";
            case '9': return "Health Service District (Hospital District)";
            case '10': return "Sanitation District";
            case '11': return "Water District";
            case '12': return "Water & Sanitation District";
            case '13': return "County Recreation District";
            case '14': return "Metropolitan Sewage Disposal District";
            case '15': return "Cemetery District";
            case '16': return "Library District";
            case '17': return "Ground Water Management District";
            case '18': return "Water Conservancy District";
            case '19': return "County Pest Control District";
            case '20': return "Conservation District (Soil)";
            case '21': return "Metropolitan Water District";
            case '22': return "Irrigation District (Irrigation Drainage)";
            case '23': return "Junior College District";
            case '24': return "Law Enforcement Authority";
            case '25': return "Drainage District";
            case '26': return "Downtown Development Authority";
            case '27': return "Urban Renewal Authority";
            case '28': return "General Improvement District (Municipal)";
            case '29': return "Special Improvement District (Municipal, Incl. Storm Sewer)";
            case '30': return "Local Improvement District (County)";
            case '31': return "Public Improvement District (County)";
            case '32': return "County Housing Authority";
            case '33': return "County Disposal District";
            case '34': return "Power Authority";
            case '35': return "Water Authority";
            case '36': return "Moffat Tunnel Authority";
            case '37': return "Regional Transportation District";
            case '38': return "Colorado Travel And Tourism Authority";
            case '39': return "Urban Drainage & Flood Control District";
            case '40': return "Internal Improvement District (Flood Control)";
            case '41': return "Airport Authority";
            case '42': return "Tunnel District";
            case '43': return "Conservancy District (Flood Control)";
            case '44': return "Grand Valley Drainage District";
            case '45': return "Ambulance District";                     
            case '46': return "Housing Authority (Municipal)";
            case '47': return "Authority (Intergovernmental Contract)";
            case '48': return "Rail District";
            case '49': return "Recreation Facility District";
            case '50': return "County Water & Sanitation Facility";
            case '51': return "Conservation District (River Water)";
            case '52': return "Denver Metropolitan Scientific & Cultural Facilities District";
            case '53': return "Scientific & Cultural Facilities District";
            case '54': return "Mine Drainage District";
            case '55': return "Public Highway Authority";
            case '56': return "Cherry Creek Basin Water Quality Authority";
            case '57': return "Business Improvement District";
            case '58': return "Regional Service Authority";
            case '59': return "Special Taxing District of Home Rule County";
            case '60': return "Emergency Telephone Service (911 Authority)";

            case '62': return "University Of Colorado Hospital Authority";
            case '63': return "Denver Metropolitan Major League Baseball Stadium District";
            case '64': return "Regional Transportation Authority";
            case '65': return "Pueblo Depot Activity Development Authority";
            case '66': return "Colorado Intermountain Fixed Guideway Authority";
            case '67': return "Metropolitan Football Stadium District";
            case '68': return "Denver Health And Hospital Authority";
            case '69': return "Multijurisdictional Housing Authority";

            case '71': return "Local Marketing District";
            case '72': return "Special Taxing District of Home Rule Municipality";
            case '73': return "Health Assurance District";
            case '74': return "Mental Health Care Service District";
            case '75': return "Forest Improvement District";
            case '76': return "Fountain Creek Watershed, Flood Control, and Greenway District";
            case '77': return "Colorado New Energy Improvement District";
            case '78': return "Federal Mineral Lease District";
            case '79': return "Subdistrict of Special District";
            case '80': return "Special Improvement District (Title 32 Special District)";

            case '95': return "Boards of Cooperative (Educational) Services (BOCES)";                     
            case '96': return "Tax Increment Finance (TIF) URA/DDA Plan Areas";
            case '97': return "Miscellaneous District";
            case '98': return "County Purpose";
            case '99': return "School District";
        }
         
       }
 
              
       function statuslookup(district){
         
                 switch (district) {
            case '1': return "Active";
            case '2': return "Consolidated";
            case '3': return "Dissolved";
            case '4': return "Multi-county";
            case '5': return "Single-county";
            case '6': return "Pending Formation";
            case '7': return "Pending Dissolution";
        }
         
       }
       
           if (feature.properties) {

         var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>ID</th><td>" + feature.properties.lgid + "</td></tr>" + "<tr><th>Type</th><td>" + typelookup(feature.properties.lgtypeid) + "</td></tr><tr><th>Status</th><td>" + statuslookup(feature.properties.lgstatusid) + "</td></tr>" + "<tr><th>Source</th><td>" + feature.properties.source + "</td></tr>" + "<table>";
                 var title=feature.properties.lgname;
      layer.on({
        click: function (e) {
          $("#feature-title").html(title);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          this.bringToBack();  //to deal with overlapping features.  click again and obscured feature is now on top
        }
     });
           }
  
}




//on dom loaded
$(document).ready(function() {
  
      //initialize geojsonLayer
    geojsonLayer = L.geoJson.ajax("", {
        middleware: function(data) {
            getJson(data);
        }, 
        onEachFeature: onEachFeature
    });


  //keep track of time.  when stopped moving for two seconds, redraw
      map.on('movestart', function() {
      var d = new Date();
      globalbusy = d.getTime(); 
      });
 
    map.on('moveend', function() {
      var d = new Date();
      globalbusy = d.getTime(); 

      
      setTimeout(function(){ 
        var e, curtime, c, clat, clng;
        
        e=new Date();
        curtime = e.getTime();
              if(curtime>= (globalbusy+1000)){
                
        //get center of map point
        c = map.getCenter();
        clat = c.lat;
        clng = c.lng;

        //if center point is still within the current map bounds, then dont do anything.  otherwise, run query again
        if (clat < coord.nelat && clat > coord.swlat && clng < coord.nelng && clng > coord.swlng) {
          
          if(map.getZoom()!==lastzoom){ ajaxcall(); }
          
        } else {
            ajaxcall();
        }
                
                
                
              }
        }, 1000);
      
      
    }); // end 'on moveend'

    map.on('zoomstart', function() {
      var d = new Date();
      globalbusy = d.getTime(); 
    });
  
    //when map is zoomed in or out
    map.on('zoomend', function() {
    var d, e, curtime, curzoom;

      d = new Date();
      globalbusy = d.getTime(); 
      
      setTimeout(function(){
        e=new Date();
        curtime = e.getTime();
        
              if(curtime>= (globalbusy+1000)){

          if(map.getZoom()!==lastzoom){ ajaxcall(); }

              }
        }, 1000);
      
      
    });  
  
  //kick it!
  ajaxcall();
  
});

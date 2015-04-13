var map;

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


var example = L.geoJson(null, {
    style: function(feature) {
      
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
        switch ((feature.properties.LG_ID).toString().slice(-1)) {
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
      
    },
     onEachFeature: function (feature, layer) {
           if (feature.properties) {
      var content = "<table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Division</th><td>" + feature.properties.LG_ID + "</td></tr>" + "<tr><th>Line</th><td>" + feature.properties.X + "</td></tr>" + "<table>";
      layer.on({
        click: function (e) {
          $("#feature-title").html(feature.properties.FIRST_NAME);
          $("#feature-info").html(content);
          $("#featureModal").modal("show");
          this.bringToBack();  //to deal with overlapping features.  click again and obscured feature is now on top
        }
     });
           }
}
});
$.getJSON("data/ctf.geojson", function (data) {
  example.addData(data);
});


//globals
//comment all of these
//varlist
L.mapbox.accessToken = 'pk.eyJ1Ijoic3RhdGVjb2RlbW9nIiwiYSI6Ikp0Sk1tSmsifQ.hl44-VjKTJNEP5pgDFcFPg';


/* Basemap Layers */  //not ideal because of double - labels
var mbstyle = L.mapbox.tileLayer('statecodemog.aa380654', {
    'zIndex': 1
});

var mbsat = L.mapbox.tileLayer('statecodemog.km7i3g01');



//define labels layer
var mblabels = L.mapbox.tileLayer('statecodemog.798453f5', {
    'clickable': false,
    'zIndex': 100
});


map = L.map("map", {
  zoom: 10,
  center: [40, -104.979378],
  layers: [mbstyle, example],
  zoomControl: false,
  attributionControl: false
});



//create map sandwich
var topPane = map._createPane('leaflet-top-pane', map.getPanes().mapPane);
var topLayer = mblabels.addTo(map);
topPane.appendChild(topLayer.getContainer());


var baseLayers = {
    "Mapbox: Satellite": mbsat,
    "Mapbox: Contrast Base": mbstyle
};



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
} else {
  var isCollapsed = false;
}


var groupedOverlays = {
  "District Categories": {
    "Example": example
  }
};

var layerControl = L.control.groupedLayers(baseLayers, groupedOverlays, {
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
if (!L.Browser.touch) {
  L.DomEvent
  .disableClickPropagation(container)
  .disableScrollPropagation(container);
} else {
  L.DomEvent.disableClickPropagation(container);
}

$("#loading").hide();
















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

$('#the-basics .typeahead').typeahead({
  hint: true,
  highlight: true,
  minLength: 4
},
{
  name: 'locations',
  displayKey: 'value',
  source: substringMatcher(locations)
}

);
	
$('#the-basics .typeahead').on('typeahead:selected', function (e, datum) {
    //console.log(datum);
	searchresult(datum);
}).on('typeahead:autocompleted', function (e, datum) {
    //console.log(datum);
	searchresult(datum);	
});	
	
function searchresult(result){

for(i=1;i<523;i++){
	if(lv[i].n==result.value){
		map.panTo(new L.LatLng(lv[i].lat,lv[i].lng));
		}
	}
}

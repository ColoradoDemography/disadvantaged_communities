/*global $*/


//get limlevy data -- dont do anything else until then

var limlevy;
var districtsonly = [];
var districtsbb = [];

//geocoder values
$.getJSON("https://storage.googleapis.com/co-publicdata/geopts.json", function(geopts) {

    //create data objects for geocoder
    for (i = 0; i < geopts.length; i++) {
        districtsonly.push(geopts[i].lgid);
        districtsonly.push(geopts[i].lgname)
        districtsbb.push(geopts[i].bbox);
        districtsbb.push(geopts[i].bbox);
    }

    $.getJSON("https://storage.googleapis.com/co-publicdata/limlevy.json", function(json) {
        limlevy = json;
        init();

    });
});


function init() {


    var map, globalbusy, geojsonLayer, lastzoom, active = '1',
        filter = 'place',
        titleGeo = 'Place',
        limit = 1000,
        lgid = "";
    //active = whether to show inactive districts.  Active=0 : show all, including inactive.  Active=1 : show only active
    //filter = comma delimited list of district lgtypes to show  

    //map bounds the last time the data was loaded
    var coord = {};
    coord.nelat = '';
    coord.nelng = '';
    coord.swlat = '';
    coord.swlng = '';


    //Leaflet Custom Control
    //create the custom control div in upper left
    L.Control.Command = L.Control.extend({
        options: {
            position: 'topleft',
        },

        onAdd: function(map) {

            var controlDiv = L.DomUtil.create('div', 'leaflet-control-command');

            var controlUI = L.DomUtil.create('div', 'leaflet-control-command-interior', controlDiv);
            controlUI.title = 'Census Geography';
            var textdiv = L.DomUtil.create('div', 'ctrldesc', controlUI);
            var divsec = L.DomUtil.create('b', 'titletext', textdiv);
            divsec.innerHTML = 'Choose a Geography';

            var hrbreak = L.DomUtil.create('hr', '', controlUI);
            hrbreak.id = "hrcss";

            var opt1div = L.DomUtil.create('div', '', controlUI);
            opt1div.id = 'opt1div';
            var selectUI = L.DomUtil.create('select', 'seldiv', opt1div);
            selectUI.title = 'Select District Category';

            L.DomEvent
                .addListener(selectUI, 'change', L.DomEvent.stopPropagation)
                .addListener(selectUI, 'change', L.DomEvent.preventDefault)
                .addListener(selectUI, 'change', refilter);

            var option;
            var inputdata = "Place||County||Tract||Block Group";

            inputdata.split('||').forEach(function(item) {
                option = document.createElement('option');
                option.value = option.textContent = item;
                selectUI.appendChild(option);
            });

            var opt2div = L.DomUtil.create('div', '', controlUI);
            opt2div.id = 'opt2div';
            opt2div.style.display = 'none';
            opt2div.className = "form-group has-feedback";

            var w = L.DomUtil.create('input', '', opt2div);

            w.id = "slgid";
            w.class = 'typeahead';
            w.type = 'text';
            w.placeholder = "Search Districts";
            w.className = "form-control typeahead";

            return controlDiv;
        }
    });

    L.control.command = function(options) {
        return new L.Control.Command(options);
    };
    


    

    //sets global variable 'filter' equal to a comma separated list of lgtypeids.  Then gets those shapes from database.
    function refilter() {

        var ischecked = $('#ischk').is(':checked');
        var districtfilter = $('.seldiv :selected').text();

        switch (districtfilter) {
            case 'County':
                //filter = "50";
                filter = 'county';
                titleGeo = 'County';
                break;
            case 'Place':
                //filter = "160";
                filter = 'place';
                titleGeo = 'Place';
                break;
            case 'Tract':
                //filter = "140";
                filter = 'tract';
                titleGeo = 'Tract';
                break;
            case 'Block Group':
                //filter = "150";
                filter = 'bg';
                titleGeo = 'BG';
                break;
        }

        if (ischecked) {
            active = '0';
        } else {
            active = '1';
        }

        ajaxcall();

    }

    $(window).resize(function() {
        sizeLayerControl();
    });

    $("#about-btn").click(function() {
        $("#aboutModal").modal("show");
        $(".navbar-collapse.in").collapse("hide");
        return false;
    });

    $("#about-btn").click(function() {
        $("#aboutModal").modal("show");
        $(".navbar-collapse.in").collapse("hide");
        return false;
    });



    function sizeLayerControl() {
        $(".leaflet-control-layers").css("max-height", $("#map").height() - 50);
    }


    //calls php file that communicates with the database and retrieves geojson
    function ajaxcall() {

        $("#popup").remove();

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
        
        //geojsonLayer.refresh("https://gis.dola.colorado.gov/capi/geojson?limit=99999&db=acs1115&schema=data&table=b19013&sumlev=" + filter + "&type=json&state=8"); //add a new layer replacing whatever is there
        geojsonLayer.refresh("assets/data/srf_acs_" + filter + ".geojson")
        
       if (window.searchControl)
           {
             map.removeControl(window.searchControl);
           }
    
       // Add search gadget for this layer      
       window.searchControl= new L.control.search({
         layer: geojsonLayer, 
         propertyName: 'geoname',
         marker: false,
         collapsed: false,
         zoom: 12,
         textPlaceholder: 'Search selected geography'
       });

       map.addControl(window.searchControl);

    }



    //after successfull ajax call, data is sent here
    function getJson(data) {

        Object.size = function(obj) {
            var size = 0,
                key;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) size++;
            }
            return size;
        };

        // Get the size of an object
        var size = Object.size(data.features);

        //if hit the max number of results - display popup notice on screen
        if (size === limit) {
            $('#notice').show();
            setTimeout(function() {
                $('#notice').hide();
            }, 2000);
        }

        geojsonLayer.clearLayers(); //(mostly) eliminates double-draw (should be technically unneccessary if you look at the code of leaflet-ajax...but still seems to help)
        
        geojsonLayer.addData(data);

        geojsonLayer.setStyle(stylefunc); //geojsonLayer.setStyle(feat1);   
        map.addLayer(geojsonLayer);


       // Remove old control, if any
    

    }

    function stylefunc(feature) {

        var typical = {
            color: "blue",
            weight: 1,
            fill: true,
            opacity: 1,
            fillOpacity: 0.4,
            clickable: true,
            'zIndex': 10
        };

        //gets last digit of lgid.  colors shape per that digit (pseudo random color scheme)
        //console.log(feature.properties);
        // var districtfilter = $('.seldiv :selected').text();
        
        // switch (districtfilter) {
        //     case 'County':
        //         typical.color = "#5E5075";
        //         return typical;
        //     case 'Place':
        //         typical.color = "#6DAF48";
        //         return typical;
        //     case 'Tract':
        //         typical.color = "#CD4A31";
        //         return typical;
        //     case 'Block Group':
        //         typical.color = "#B25BD2";
        //         return typical;
        // }

        return typical;



    }


    L.mapbox.accessToken = 'pk.eyJ1Ijoic3RhdGVjb2RlbW9nIiwiYSI6Ikp0Sk1tSmsifQ.hl44-VjKTJNEP5pgDFcFPg';

    /* Basemap Layers */
    var mbstyle = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
        attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>',
        tileSize: 512,
        maxZoom: 18,
        zoomOffset: -1,
        id: 'mapbox/outdoors-v11',
        accessToken: 'pk.eyJ1Ijoic3RhdGVjb2RlbW9nIiwiYSI6Ikp0Sk1tSmsifQ.hl44-VjKTJNEP5pgDFcFPg'
    });
    var mbsat = L.tileLayer('https://api.mapbox.com/styles/v1/statecodemog/ciq0yl9wf000ebpndverm5ler/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic3RhdGVjb2RlbW9nIiwiYSI6Ikp0Sk1tSmsifQ.hl44-VjKTJNEP5pgDFcFPg', {
        attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>'
    });


/* Basemap Layers */
/*var mapquestOSM = L.tileLayer("https://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png", {
  maxZoom: 19,
  subdomains: ["otile1-s", "otile2-s", "otile3-s", "otile4-s"],
  attribution: 'Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="https://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA.'
});
var mapquestOAM = L.tileLayer("https://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg", {
  maxZoom: 18,
  subdomains: ["otile1-s", "otile2-s", "otile3-s", "otile4-s"],
  attribution: 'Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a>. Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
});
var mapquestHYB = L.layerGroup([L.tileLayer("https://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg", {
  maxZoom: 18,
  subdomains: ["otile1-s", "otile2-s", "otile3-s", "otile4-s"]
}), L.tileLayer("https://{s}.mqcdn.com/tiles/1.0.0/hyb/{z}/{x}/{y}.png", {
  maxZoom: 19,
  subdomains: ["otile1-s", "otile2-s", "otile3-s", "otile4-s"],
  attribution: 'Labels courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="https://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA. Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
})]);*/

    var Esri_WorldStreetMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
    });

    map = L.map("map", {
        zoom: 8,
        center: [39, -105.5],
        layers: [Esri_WorldStreetMap],
        minZoom: 6,
        maxZoom: 18,
        zoomControl: false,
        attributionControl: false
    });

var graphicScale = L.control.graphicScale().addTo(map);

    //define labels layer
    var mblabels = L.mapbox.tileLayer('statecodemog.798453f5', {
        'clickable': false,
        'zIndex': 100
    });

    var LeafletFilterControl = L.control.command({
        postion: 'topleft'
    });
    map.addControl(LeafletFilterControl);


    /* Attribution control */ //bootleaf
    {
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


        var attributionControl = L.control({
            position: "bottomright"
        });
        attributionControl.onAdd = function() {
            var div = L.DomUtil.create("div", "leaflet-control-attribution");
            div.innerHTML = "<span class='hidden-xs'>Developed by: <a href='https://demography.dola.colorado.gov'>Colorado State Demography Office</a></span><span class='spanhide'> | <a href='#' onclick='$(\"#attributionModal\").modal(\"show\"); return false;'>Sources</a></span>";
            return div;
        };
        map.addControl(attributionControl);
    }


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



    var baseLayers = {
        "Mapbox: Contrast": mbsat,
        "Mapbox: Emerald": mbstyle,
        //"Mapquest: Streets": mapquestOSM,
        //"Mapquest: Imagery": mapquestOAM,
        //"Mapquest: Hybrid": mapquestHYB,
        "ESRI: Streets": Esri_WorldStreetMap
    };


    var layerControl = L.control.groupedLayers(baseLayers, {}, {
        collapsed: isCollapsed
    }).addTo(map);


   

    /* Prevent clicking from influencing map */
    $(".leaflet-control-command").dblclick(function(e) {
        e.stopPropagation();
    });
    /* Prevent clicking from influencing map */
    $(".leaflet-control-command").click(function(e) {
        e.stopPropagation();
    });

    /* Prevent clicking from influencing map */
    $(".leaflet-control-command").mousemove(function(e) {
        e.stopPropagation();
    });


    // Leaflet patch to make layer control scrollable on touch browsers
    var container = $(".leaflet-control-layers")[0];
    if (!L.Browser.touch) {
        L.DomEvent.disableClickPropagation(container).disableScrollPropagation(container);
    } else {
        L.DomEvent.disableClickPropagation(container);
    }
    $("#loading").hide();

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
                    matches.push({
                        value: str
                    });
                }
            });

            cb(matches);
        };
    };



    



    // Create a mouseout event that undoes the mouseover changes
    function mouseout(e) {

        var layer = e.target;

        geojsonLayer.setStyle(stylefunc);

        $("#popup").remove();
    }

    //mouseover highlight
    function highlightFeature(e) {

        var layer = e.target;

        var fp = e.target.feature.properties,
            popup, hed;


        layer.setStyle({
            opacity: 1,
            weight: 2,
            color: 'yellow'
        });


        //no formatting for type=regular - think: median year housing unit built (only one)

        // Create a popup
        popup = $("<div></div>", {
            id: "popup",
            css: {
                position: "absolute",
                bottom: "50px",
                left: "10px",
                zIndex: 1002,
                backgroundColor: "white",
                padding: "8px",
                border: "1px solid #ccc"
            }
        });

        // Insert a headline into that popup
        if (titleGeo != "BG") {
            hed = $("<div></div>", {
                text: titleGeo + ": " + fp.geoname,
                css: {
                    fontSize: "16px",
                    marginBottom: "3px"
                }
            }).appendTo(popup);
        } else {
            hed = $("<div></div>", {
                text: titleGeo + " " + fp.geoname + ", Tract: " + fp.TRACTCE20,
                css: {
                    fontSize: "16px",
                    marginBottom: "3px"
                }
            }).appendTo(popup);
        }
        // Add the popup to the map
        popup.appendTo("#map");


    }

    //change values in here
    
    function onEachFeature(feature, layer) {

        if (feature.properties){

            var tableColumns = "<tr><th>FACTOR</th><th>Value</th><th>BENCHMARK</th></tr>";
            var bgname = "";
            var mhi_cv = feature.properties.b19013_moe/1.645/feature.properties.b19013001*100;
            var mhv_cv = feature.properties.b25077_moe/1.645/feature.properties.b25077001*100;

            if (feature.properties.jobs_2015 > 0) {
                var content = "<br /><table class='table table-striped table-bordered table-condensed'>" + tableColumns
                        + "<tr><th>MHI</th><td class='mhi'>" + feature.properties.b19013001 + "</td><td>&#60;= Than $76,376 (80% of State MHI)</td></tr>"
                        + "<tr><th style='text-indent:10px'>MHI_MOE</th><td class='mhi_moe'>" + feature.properties.b19013_moe + "</td><td></td></tr>"
                        + "<tr style='border-bottom:3px solid black'><th style='text-indent:10px'>MHI_CV</th><td class='cv'>" + mhi_cv.toFixed(2) + "</td><td></td></tr>"
                        + "<tr><th>MHV</th><td class='mhv'>" + feature.properties.b25077001 + "</td><td>&#60;= $431,520 (80% of State MHV)</td></tr>"
                        + "<tr><th style='text-indent:10px'>MHV_MOE</th><td class='mhv_moe'>" + feature.properties.b25077_moe + "</td><td></td></tr>"
                        + "<tr style='border-bottom:3px solid black'><th style='text-indent:10px'>MHV_CV</th><td class='cv'>" + mhv_cv.toFixed(2) + "</td><td></td></tr>"
                        + "<tr><th>County 24-Month Unemployment</th><td class='unemp'>" + feature.properties.unemp + "</td><td>&#62;= 4.27%</td></tr>"
                        + "<tr><th>County 10-Year Jobs Change</th><td class='job_change'>" + feature.properties.job_change + "</td><td>&#60;= 0</td></tr>"
                        + "<tr><th style='text-indent:10px'>County Jobs 2015</th><td class='jobs_2015'>" + feature.properties.jobs_2015 + "</td><td></td></tr>"
                        + "<tr><th style='text-indent:10px'>County Jobs 2024</th><td class='jobs_2024'>" + feature.properties.jobs_2024 + "</td><td></td></tr>"
                        + "</table><br />";
            } else {
                 var content = "<br /><table class='table table-striped table-bordered table-condensed'>" + tableColumns
                        + "<tr><th>MHI</th><td class='mhi'>" + feature.properties.b19013001 + "</td><td>&#60;= $76,376 (80% of State MHI)</td></tr>"
                        + "<tr><th style='text-indent:10px'>MHI_MOE</th><td class='mhi_moe'>" + feature.properties.b19013_moe + "</td><td></td></tr>"
                        + "<tr style='border-bottom:3px solid black'><th style='text-indent:10px'>MHI_CV</th><td class='cv'>" + mhi_cv.toFixed(2) + "</td><td></td></tr>"
                        + "<tr><th>MHV</th><td class='mhv'>" + feature.properties.b25077001 + "</td><td>&#60;= $431,520 (80% of State MHV)</td></tr>"
                        + "<tr><th style='text-indent:10px'>MHV_MOE</th><td class='mhv_moe'>" + feature.properties.b25077_moe + "</td><td></td></tr>"
                        + "<tr style='border-bottom:3px solid black'><th style='text-indent:10px'>MHV_CV</th><td class='cv'>" + mhv_cv.toFixed(2) + "</td><td></td></tr>"
                        + "<tr><th>County 24-Month Unemployment</th><td class='unemp'>" + "Contact DOLA Analyst" + "</td><td>&#62;= 4.27%</td></tr>"
                        + "<tr><th>County 10-Year Jobs Change</th><td class='job_change'>" + "Contact DOLA Analyst" + "</td><td>&#60;= 0</td></tr>"
                        + "<tr><th style='text-indent:10px'>County Jobs 2015</th><td class='jobs_2015'>" + "Contact DOLA Analyst" + "</td><td></td></tr>"
                        + "<tr><th style='text-indent:10px'>County Jobs 2024</th><td class='jobs_2024'>" + "Contact DOLA Analyst" + "</td><td></td></tr>"
                        + "</table><br />";
            }
            
            var geonum2text = feature.properties.geonum.toString();
            bgname = "BG " + geonum2text.substr(12,1) + ", Tract: " + geonum2text.substr(6,6);

            if (geonum2text.length < 13) {
                var title = titleGeo + ": " + feature.properties.geoname;
            } else {
                var title = bgname;
            }

            layer.on({
                click: function(e) {
                    console.log(title);
                    $("#feature-title").html(title);
                    $("#feature-info").html(content);
                    //$("#contact").html(contact);
                    //$('#dolalink').attr('href', newlink);
                    
                    $("#featureModal").modal("show");
                    this.bringToBack(); //to deal with overlapping features.  click again and obscured feature is now on top
                    //changes here
                    $(function() {
                        $(".mhi").each(function(index) {
                            var scale = [['good', 0], ['null', 76376]]; //replace this and same values with MHI qualifier
                            var score = $(this).text();
                            for (var i = 0; i < scale.length; i++) {
                                $(this).text("$"+commafy(feature.properties.b19013001));                                
                                if (score > 0 && score <= 76376 && mhi_cv <= 18) { //cv may need change
                                    $(this).addClass('good');
                                }
                                if (feature.properties.b19013001 > 0 && feature.properties.b19013001 + feature.properties.b19013_moe <= 76376) {
                                    $(this).addClass('good');
                                }
                            }
                        });
                        $(".mhi_moe").each(function(index) {
                            var scale = [['good', 0], ['null', 76376]];//, ['bad', 38802.6]];
                            var score = parseInt($(this).text()) + parseInt(feature.properties.b19013001); //$(this).text() + mhi?
                            console.log("MHI_MOE Score = " + score);
                            for (var i = 0; i < scale.length; i++) {
                                $(this).text("$"+commafy(feature.properties.b19013_moe));
                                // if ((score <= 38802.6)) {
                                //     $(this).addClass('good');
                                // }
                            }
                        });
                        $(".mhv").each(function(index) {
                            var scale = [['good', 0], ['null', 431520]]; //replace this and same values with MHV qualifier
                            var score = $(this).text();
                            for (var i = 0; i < scale.length; i++) {
                                $(this).text("$"+commafy(feature.properties.b25077001));
                                if (score > 0 &&score <= 431520 && mhv_cv <=18) { //cv may need change
                                    $(this).addClass('good');
                                }
                                if (feature.properties.b25077001 > 0 && feature.properties.b25077001 + feature.properties.b25077_moe <= 431520) {
                                    $(this).addClass('good');
                                }
                            }
                        });
                        $(".mhv_moe").each(function(index) {
                            var scale = [['good', 0], ['null', 431520]];//, ['bad', 247800]];
                            var score = parseInt($(this).text()) + parseInt(feature.properties.b25077001);
                            console.log("MHV_MOE Score = " + score);
                            for (var i = 0; i < scale.length; i++) {
                                $(this).text("$"+commafy(feature.properties.b25077_moe));
                                // if (score <= 247800) {
                                //     $(this).addClass('good');
                                // }
                            }
                        });
                        $(".cv").each(function(index) {
                            var scale = [['good', 0], ['neutral', 18], ['bad', 40]];
                            var score = $(this).text();
                            for (var i = 0; i < scale.length; i++) {
                                // if (score <= 12) {
                                //     $(this).addClass('good');
                                // }
                            }
                        });
                        $(".jobs_2015").each(function(index) {
                            // var scale = [['bad', -50000], ['neutral', 0], ['good', 225000]];
                            // var score = $(this).text();
                            // console.log(score);
                            // for (var i = 0; i < scale.length; i++) {
                            //     if (score <= scale[i][1]) {
                            //         $(this).addClass(scale[i][0]);
                            //     }
                            // }
                            //if (filter != 'place') {
                                var jobs_2015_text = commafy(feature.properties.jobs_2015.toFixed(0));
                                $(this).text(jobs_2015_text);
                                if (feature.properties.jobs_2015 == 0) {
                                    $(this).text("Contact DOLA Analyst");
                                }
                            //}
                        });
                        $(".jobs_2024").each(function(index) {
                            // var scale = [['bad', 50000], ['neutral', 100000], ['good', 225000]];
                            // var score = $(this).text();
                            // console.log(score);
                            // for (var i = 0; i < scale.length; i++) {
                            //     if (score <= scale[i][1]) {
                            //         $(this).addClass(scale[i][0]);
                            //     }
                            // }
                            //if (filter != 'place') {
                                var jobs_2024_text = commafy(feature.properties.jobs_2024.toFixed(0));
                                $(this).text(jobs_2024_text);
                                if (feature.properties.jobs_2024 == 0) {
                                    $(this).text("Contact DOLA Analyst");
                                }
                            //}
                        });
                        $(".job_change").each(function(index) {
                            //if (filter != 'place') {    
                                var scale = [['good', -100000], ['null', 0]];//, ['bad', 0]];
                                var score = $(this).text();
                                for (var i = 0; i < scale.length; i++) {
                                    $(this).text(commafy(feature.properties.job_change.toFixed(0)));
                                    if (score <= scale[i][1]) {
                                        $(this).addClass('good');
                                    }
                                    if (feature.properties.jobs_2024 == 0) {
                                        $(this).text("Contact DOLA Analyst");
                                    }
                                }
                            //}
                        });
                        $(".unemp").each(function(index) {
                            //if (filter != 'place') {
                                var scale = [['null', 4.27], ['good', 8]]; //update unemployment number
                                var score = $(this).text();
                                for (var i = 0; i < scale.length; i++) {
                                    $(this).text(feature.properties.unemp.toFixed(2)+"%");
                                    if (score >= 4.27) {
                                        $(this).addClass('good');
                                    }
                                    if (feature.properties.jobs_2024 == 0) {
                                        $(this).text("Contact DOLA Analyst");
                                    }
                                }
                            //}
                        });
                    });
                    
                    $("#export").off().click(function(){
                        $("#feature-info").tableToCSV(title);
                    });
                    /*$("#closetable").click(function(){
                        $("#feature-info").html("");
                    })*/
                    //$('#featureModal').on('hidden.bs.modal', function(e)
    { 
        $(this).find('form').trigger('reset');
    };
                },
                mouseover: highlightFeature,
                mouseout: mouseout
            });
        };

    };

    function commafy(nStr) {
        var x, x1, x2, rgx;
        nStr += '';
        x = nStr.split('.');
        x1 = x[0];
        x2 = x.length > 1 ? '.' + x[1] : '';
        rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
        }
        return x1 + x2;
    }
    
    //Searchbox functionality
    $("#searchdiv").click(function () {console.log("Clicked");
            $(this).select();
    });
    
    $('#searchdiv .typeahead').typeahead({
        hint: true,
        highlight: true
    },
    {
        name: 'feature.properties.geoname',
        displayKey: 'value',
        source: geojsonLayer
    }
    );
    
    $('#searchdiv .typeahead').on('typeahead:selected', function (e, datum) {
    	searchresult(datum);
    }).on('typeahead:autocompleted', function (e, datum) {
    	searchresult(datum);	
    });
    
    function searchresult(result){
        for(i=1;i<523;i++){
        	if(lv[i].n==result.value){
        		map.panTo(new L.LatLng(lv[i].lat,lv[i].lng));
        	}
        }
    }

    //on dom loaded
    $(document).ready(function() {


        //dropdown suggestions default to hidden.  
        $('.tt-menu').css("visibility", "hidden");

        //if textbox is cleared, dropdown suggestions become hidden again
        $('#slgid').on('input', function() {
            if ($('#slgid').val() == "") {
                $('.tt-menu').css("visibility", "hidden");
            } else {
                $('.tt-menu').css("visibility", "visible");
            }

        });

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


            setTimeout(function() {
                var e, curtime, c, clat, clng;

                e = new Date();
                curtime = e.getTime();
                if (curtime >= (globalbusy + 1000)) {

                    //get center of map point
                    c = map.getCenter();
                    clat = c.lat;
                    clng = c.lng;

                    //if center point is still within the current map bounds, then dont do anything.  otherwise, run query again
                    if (clat < coord.nelat && clat > coord.swlat && clng < coord.nelng && clng > coord.swlng) {

                        if (map.getZoom() !== lastzoom) {
                            ajaxcall();
                        }

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

            setTimeout(function() {
                e = new Date();
                curtime = e.getTime();

                if (curtime >= (globalbusy + 1000)) {

                    if (map.getZoom() !== lastzoom) {
                        ajaxcall();
                    }

                }
            }, 1000);


        });

        //kick it!
        ajaxcall();

    });

}


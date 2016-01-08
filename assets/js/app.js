//app moving pieces: To Update as Needed
//------------------

//lgbasic table in postgres dola.bounds.lgbasic - use script: _connectOracle/lgbasic.php (on lajavaas) to create JSON.  use script: CO_FS_Data_PHP/load_lgbasic.php to load into Postgres
//lg2cnty table in postgres dola.bounds.lg2cnty - use script: _connectOracle/lg2cnty.php (on lajavaas) to create JSON.  use script: CO_FS_Data_PHP/load_lg2cnty.php to load into Postgres

//districts table in dola.bounds - as needed when district boundaries change





//get limlevy data -- dont do anything else until then

var limlevy;
var districtsonly = [];
var districtsbb = [];

//geocoder values
$.getJSON("../CO_FS_Data_PHP/geopts.json", function(geopts) {

    //create data objects for geocoder
    for (i = 0; i < geopts.length; i++) {
        districtsonly.push(geopts[i].lgid);
        districtsonly.push(geopts[i].lgname)
        districtsbb.push(geopts[i].bbox);
        districtsbb.push(geopts[i].bbox);
    }

    $.getJSON("https://dola.colorado.gov/gis-tmp/limlevy.json", function(json) {
        limlevy = json;
        init();

    });
});



//init();

function init() {


    var map, globalbusy, geojsonLayer, lastzoom, active = '1',
        filter = '6',
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
            controlUI.title = 'Filter Districts';
            var textdiv = L.DomUtil.create('div', 'ctrldesc', controlUI);
            var divsec = L.DomUtil.create('b', 'titletext', textdiv);
            divsec.innerHTML = 'Filter District by:&nbsp;&nbsp;&nbsp;&nbsp;';

            var y = L.DomUtil.create('input', '', textdiv);
            y.setAttribute("type", "radio");
            y.id = 'rtype';
            y.name = "rad";
            y.checked = true;
            divsec.appendChild(y);

            L.DomEvent
                .addListener(y, 'change', L.DomEvent.stopPropagation)
                .addListener(y, 'change', L.DomEvent.preventDefault)
                .addListener(y, 'change', showhide);

            divsec.appendChild(document.createTextNode(" Type "));
            divsec.appendChild(document.createTextNode('\u00A0'));

            var z = L.DomUtil.create('input', '', textdiv);
            z.setAttribute("type", "radio");
            z.id = 'rname';
            z.name = "rad";
            divsec.appendChild(z);

            L.DomEvent
                .addListener(z, 'change', L.DomEvent.stopPropagation)
                .addListener(z, 'change', L.DomEvent.preventDefault)
                .addListener(z, 'change', showhide);

            divsec.appendChild(document.createTextNode(" Name or ID"));

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
            var inputdata = "Metropolitan Districts||Park & Recreation Districts||Fire Protection Districts||Hospital Districts||Water & Sanitation Districts||Library Districts||School Districts||Soil Conservation Districts||Cemetary Districts||Other Districts||All Districts";

            inputdata.split('||').forEach(function(item) {
                option = document.createElement('option');
                option.value = option.textContent = item;
                selectUI.appendChild(option);
            });

            //Create the 'Show Inactive Districts' Control
            //       var chkdiv = L.DomUtil.create('div', '', opt1div);

            //       var x = L.DomUtil.create('input', '', chkdiv);
            //         x.setAttribute("type", "checkbox");
            //         x.id="ischk";
            //       var t=document.createTextNode("Show Inactive Districts");
            //         chkdiv.appendChild(t); 

            //       x.addEventListener("change", refilter, false);


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

    //switch control from dropdown search to district searchbox
    function showhide() {

        var typediv = document.getElementById("opt1div");
        var namediv = document.getElementById("opt2div");
        var hrcss = document.getElementById("hrcss");

        if ($('#rtype').is(':checked')) {
            typediv.style.display = 'inline';
            namediv.style.display = 'none';
            hrcss.style.marginBottom = "5px";
            lgid = "";
            ajaxcall();
        } else {
            document.getElementById("slgid").value = "";
            typediv.style.display = 'none';
            namediv.style.display = 'inline';
            hrcss.style.marginBottom = "15px";
        }

    }

    //sets global variable 'filter' equal to a comma separated list of lgtypeids.  Then gets those shapes from database.
    function refilter() {

        var ischecked = $('#ischk').is(':checked');
        var districtfilter = $('.seldiv :selected').text();

        switch (districtfilter) {
            case 'All Districts':
                filter = "0";
                break;
            case 'Metropolitan Districts':
                filter = "6";
                break;
            case 'Park & Recreation Districts':
                filter = "7";
                break;
            case 'Fire Protection Districts':
                filter = "8";
                break;
            case 'Hospital Districts':
                filter = "9";
                break;
            case 'Water & Sanitation Districts':
                filter = "10,11,12";
                break;
            case 'School Districts':
                filter = "99";
                break;
            case 'Soil Conservation Districts':
                filter = "20";
                break;
            case 'Cemetary Districts':
                filter = "15";
                break;
            case 'Library Districts':
                filter = "16";
                break;


            case 'Other Districts':
                filter = "13,14,17,18,19,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,62,63,64,65,66,67,68,69,71,72,73,74,75,76,77,78,79,80,95,96,97,98";
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

        geojsonLayer.refresh("assets/php/geojson.php?limit=" + limit + "&active=" + active + "&filter=" + filter + "&bb=" + newbounds + "&zoom=" + map.getZoom() + lgid); //add a new layer replacing whatever is there

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

    }

    function stylefunc(feature) {

        var typical = {
            color: "black",
            weight: 1,
            fill: true,
            opacity: 1,
            fillOpacity: 0.4,
            clickable: true,
            'zIndex': 10
        };

        //gets last digit of lgid.  colors shape per that digit (pseudo random color scheme)
        switch ((feature.properties.lgid).toString().slice(-1)) {
            case '0':
                typical.color = "#5E5075";
                return typical;
            case '1':
                typical.color = "#6DAF48";
                return typical;
            case '2':
                typical.color = "#CD4A31";
                return typical;
            case '3':
                typical.color = "#B25BD2";
                return typical;
            case '4':
                typical.color = "#51A19E";
                return typical;
            case '5':
                typical.color = "#BD8A39";
                return typical;
            case '6':
                typical.color = "#506330";
                return typical;
            case '7':
                typical.color = "#C75293";
                return typical;
            case '8':
                typical.color = "#A95155";
                return typical;
            case '9':
                typical.color = "#8289CC";
                return typical;
        }

        return typical;



    }


    L.mapbox.accessToken = 'pk.eyJ1Ijoic3RhdGVjb2RlbW9nIiwiYSI6Ikp0Sk1tSmsifQ.hl44-VjKTJNEP5pgDFcFPg';

    /* Basemap Layers */
    var mbstyle = L.mapbox.tileLayer('statecodemog.d47df6dd', {
        'zIndex': 1
    });
    var mbsat = L.mapbox.tileLayer('statecodemog.km7i3g01');


/* Basemap Layers */
var mapquestOSM = L.tileLayer("https://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png", {
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
})]);

    var Esri_WorldStreetMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
    });

    map = L.map("map", {
        zoom: 12,
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
            div.innerHTML = "<span class='hidden-xs'>Developed by: <a href='https://www.colorado.gov/demography'>Colorado State Demography Office</a></span><span class='spanhide'> | <a href='#' onclick='$(\"#attributionModal\").modal(\"show\"); return false;'>Sources</a></span>";
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
        "Mapbox: Satellite": mbsat,
        "Mapbox: Contrast Base": mbstyle,
        "Mapquest: Streets": mapquestOSM,
        "Mapquest: Imagery": mapquestOAM,
        "Mapquest: Hybrid": mapquestHYB,
        "ESRI: Streets": Esri_WorldStreetMap
    };


    var layerControl = L.control.groupedLayers(baseLayers, {}, {
        collapsed: isCollapsed
    }).addTo(map);


    //sweet geocoder control : https://github.com/perliedman/leaflet-control-geocoder, modified to use my MapBox
    var geocoders = {
            'Mapbox': L.Control.Geocoder.mapbox(L.mapbox.accessToken)
        },
        selector = L.DomUtil.get('geocode-selector'),
        control = new L.Control.Geocoder({
            geocoder: null
        }),
        btn,
        selection,
        marker;

    function select(geocoder, el) {
        if (selection) {
            L.DomUtil.removeClass(selection, 'selected');
        }

        control.options.geocoder = geocoder;
        L.DomUtil.addClass(el, 'selected');
        selection = el;
    }

    for (var name in geocoders) {
        btn = L.DomUtil.create('button', 'leaflet-bar', selector);
        btn.innerHTML = name;
        (function(n) {
            L.DomEvent.addListener(btn, 'click', function() {
                select(geocoders[n], this);
            }, btn);
        })(name);

        if (!selection) {
            select(geocoders[name], btn);
        }
    }


    control.addTo(map);


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



    //Typeahead (Name or ID Search)
    {

        $('#opt2div .typeahead').typeahead({
            hint: true,
            highlight: true,
            minLength: 4
        }, {
            name: 'districtsonly',
            displayKey: 'value',
            source: substringMatcher(districtsonly)
        });

        $('#opt2div .typeahead').on('typeahead:select', function(e, datum) {
            searchresult(datum);
        }).on('typeahead:autocomplete', function(e, datum) {
            searchresult(datum);
        });

        $('.typeahead').bind('typeahead:select', function(ev, suggestion) {
            console.log('Selection: ' + suggestion);
        });

    }

    function searchresult(result) {
        console.log(result);
        var id = result.value;
        var strbb;
        var southWest, northEast;
        var bounds;
        var firstchar;
        var lgidindex;

        for (var i in districtsonly) {
            if (districtsonly[i] === id) {
                strbb = districtsbb[i];
                firstchar = (id.charAt(0));
                if (firstchar === "0" || firstchar === "1" || firstchar === "2" || firstchar === "3" || firstchar === "4" || firstchar === "5" || firstchar === "6" || firstchar === "7" || firstchar === "8" || firstchar === "9") {
                    lgidindex = i;
                } else {
                    lgidindex = i - 1;
                }
                //console.log(districtsonly[lgidindex]);
            }

        }

        bbarray = strbb.split(',');
        southWest = new L.LatLng(bbarray[1], bbarray[0]);
        northEast = new L.LatLng(bbarray[3], bbarray[2]);
        bounds = new L.LatLngBounds(southWest, northEast);
        map.fitBounds(bounds);



        lgid = '&lgid=' + districtsonly[lgidindex];
        ajaxcall();
    }



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
            color: 'black'
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
        hed = $("<div></div>", {
            text: fp.lgname,
            css: {
                fontSize: "16px",
                marginBottom: "3px"
            }
        }).appendTo(popup);

        // Add the popup to the map
        popup.appendTo("#map");


    }

    function onEachFeature(feature, layer) {



        function typelookup(district) {

            switch (district) {
                case '6':
                    return "Metropolitan District";
                case '7':
                    return "Park & Recreation District";
                case '8':
                    return "Fire Protection District";
                case '9':
                    return "Health Service District (Hospital District)";
                case '10':
                    return "Sanitation District";
                case '11':
                    return "Water District";
                case '12':
                    return "Water & Sanitation District";
                case '13':
                    return "County Recreation District";
                case '14':
                    return "Metropolitan Sewage Disposal District";
                case '15':
                    return "Cemetery District";
                case '16':
                    return "Library District";
                case '17':
                    return "Ground Water Management District";
                case '18':
                    return "Water Conservancy District";
                case '19':
                    return "County Pest Control District";
                case '20':
                    return "Conservation District (Soil)";
                case '21':
                    return "Metropolitan Water District";
                case '22':
                    return "Irrigation District (Irrigation Drainage)";
                case '23':
                    return "Junior College District";
                case '24':
                    return "Law Enforcement Authority";
                case '25':
                    return "Drainage District";
                case '26':
                    return "Downtown Development Authority";
                case '27':
                    return "Urban Renewal Authority";
                case '28':
                    return "General Improvement District (Municipal)";
                case '29':
                    return "Special Improvement District (Municipal, Incl. Storm Sewer)";
                case '30':
                    return "Local Improvement District (County)";
                case '31':
                    return "Public Improvement District (County)";
                case '32':
                    return "County Housing Authority";
                case '33':
                    return "County Disposal District";
                case '34':
                    return "Power Authority";
                case '35':
                    return "Water Authority";
                case '36':
                    return "Moffat Tunnel Authority";
                case '37':
                    return "Regional Transportation District";
                case '38':
                    return "Colorado Travel And Tourism Authority";
                case '39':
                    return "Urban Drainage & Flood Control District";
                case '40':
                    return "Internal Improvement District (Flood Control)";
                case '41':
                    return "Airport Authority";
                case '42':
                    return "Tunnel District";
                case '43':
                    return "Conservancy District (Flood Control)";
                case '44':
                    return "Grand Valley Drainage District";
                case '45':
                    return "Ambulance District";
                case '46':
                    return "Housing Authority (Municipal)";
                case '47':
                    return "Authority (Intergovernmental Contract)";
                case '48':
                    return "Rail District";
                case '49':
                    return "Recreation Facility District";
                case '50':
                    return "County Water & Sanitation Facility";
                case '51':
                    return "Conservation District (River Water)";
                case '52':
                    return "Denver Metropolitan Scientific & Cultural Facilities District";
                case '53':
                    return "Scientific & Cultural Facilities District";
                case '54':
                    return "Mine Drainage District";
                case '55':
                    return "Public Highway Authority";
                case '56':
                    return "Cherry Creek Basin Water Quality Authority";
                case '57':
                    return "Business Improvement District";
                case '58':
                    return "Regional Service Authority";
                case '59':
                    return "Special Taxing District of Home Rule County";
                case '60':
                    return "Emergency Telephone Service (911 Authority)";

                case '62':
                    return "University Of Colorado Hospital Authority";
                case '63':
                    return "Denver Metropolitan Major League Baseball Stadium District";
                case '64':
                    return "Regional Transportation Authority";
                case '65':
                    return "Pueblo Depot Activity Development Authority";
                case '66':
                    return "Colorado Intermountain Fixed Guideway Authority";
                case '67':
                    return "Metropolitan Football Stadium District";
                case '68':
                    return "Denver Health And Hospital Authority";
                case '69':
                    return "Multijurisdictional Housing Authority";

                case '71':
                    return "Local Marketing District";
                case '72':
                    return "Special Taxing District of Home Rule Municipality";
                case '73':
                    return "Health Assurance District";
                case '74':
                    return "Mental Health Care Service District";
                case '75':
                    return "Forest Improvement District";
                case '76':
                    return "Fountain Creek Watershed, Flood Control, and Greenway District";
                case '77':
                    return "Colorado New Energy Improvement District";
                case '78':
                    return "Federal Mineral Lease District";
                case '79':
                    return "Subdistrict of Special District";
                case '80':
                    return "Special Improvement District (Title 32 Special District)";

                case '95':
                    return "Boards of Cooperative (Educational) Services (BOCES)";
                case '96':
                    return "Tax Increment Finance (TIF) URA/DDA Plan Areas";
                case '97':
                    return "Miscellaneous District";
                case '98':
                    return "County Purpose";
                case '99':
                    return "School District";
            }

        }



        function statuslookup(district) {

            switch (district) {
                case '1':
                    return "Active";
                case '2':
                    return "Consolidated";
                case '3':
                    return "Dissolved";
                case '4':
                    return "Multi-county";
                case '5':
                    return "Single-county";
                case '6':
                    return "Pending Formation";
                case '7':
                    return "Pending Dissolution";
            }

        }

        if (feature.properties) {
            var addurl = "";
            var abbrevname = "";
            var prevname = "";

            if (feature.properties.url) {
                addurl = "<tr><th>URL</th><td>" + feature.properties.url + "</td></tr>";
            }
            if (feature.properties.abbrev_name) {
                abbrevname = "<tr><th>Short Name</th><td>" + feature.properties.abbrev_name + "</td></tr>";
            }
            if (feature.properties.prev_name) {
                prevname = "<tr><th>Previous Name</th><td>" + feature.properties.prev_name + "</td></tr>";
            }

            var content = "<br /><table class='table table-striped table-bordered table-condensed'>" + "<tr><th>ID</th><td>" + feature.properties.lgid + "</td></tr>" + "<tr><th>Type</th><td>" + typelookup(feature.properties.lgtypeid) + "</td></tr><tr><th>Status</th><td>" + statuslookup(feature.properties.lgstatusid) + "</td></tr>" + addurl + abbrevname + prevname + "</table><br />";
            var altaddress = "";

            if (feature.properties.alt_address) {
                altaddress = "<tr><th>Alt Address</th><td>" + feature.properties.alt_address + "</td></tr>";
            }

            var contact = "<br /><table class='table table-striped table-bordered table-condensed'>" + "<tr><th>Mail Address</th><td>" + feature.properties.mail_address + "</td></tr>" + altaddress + "<tr><th>City</th><td>" + feature.properties.mail_city + "</td></tr><tr><th>State</th><td>" + feature.properties.mail_state + "</td></tr><tr><th>Zip</th><td>" + feature.properties.mail_zip + "</td></tr></table><br />";


            var title = feature.properties.lgname;

            var detailed = "<br /><table class='table table-striped table-bordered table-condensed'><tr><th>Year</th><th>County</th><th>Subdistrict</th><th>Assessed Value</th><th>Levy</th></tr>";

            for (var i = 0; i < limlevy.length; i = i + 1) {
                if (limlevy[i].LG_ID == feature.properties.lgid) {
                    if (limlevy[i].ASSESSED_VALUE !== "0") {
                        detailed = detailed + "<tr><td>" + limlevy[i].BUDGET_YEAR + "</td><td>" + clookup(limlevy[i].COUNTY) + "</td><td>" + limlevy[i].SUBDIST_NUM + "</td><td>$" + commafy(limlevy[i].ASSESSED_VALUE) + "</td><td>" + limlevy[i].TOTAL_LEVY + "</td></tr>";
                    }
                }
            }

            detailed = detailed + "</table><br />"

            var newlink = "https://dola.colorado.gov/dlg_portal/filings.jsf?id=" + feature.properties.lgid;

            layer.on({
                click: function(e) {
                    $("#feature-title").html(title);
                    $("#feature-info").html(content);
                    $("#detailed").html(detailed);
                    $("#contact").html(contact);
                    $('#dolalink').attr('href', newlink);

                    // other tab information

                    // other tab information

                    $("#featureModal").modal("show");
                    this.bringToBack(); //to deal with overlapping features.  click again and obscured feature is now on top
                },
                mouseover: highlightFeature,
                mouseout: mouseout
            });
        }

    }

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

    function clookup(ccode) {

        if (ccode == "001") {
            return 'Adams'
        };
        if (ccode == "003") {
            return 'Alamosa'
        };
        if (ccode == "005") {
            return 'Arapahoe'
        };
        if (ccode == "007") {
            return 'Archuleta'
        };
        if (ccode == "009") {
            return 'Baca'
        };
        if (ccode == "011") {
            return 'Bent'
        };
        if (ccode == "013") {
            return 'Boulder'
        };
        if (ccode == "014") {
            return 'Broomfield'
        };
        if (ccode == "015") {
            return 'Chaffee'
        };
        if (ccode == "017") {
            return 'Cheyenne'
        };
        if (ccode == "019") {
            return 'Clear Creek'
        };
        if (ccode == "021") {
            return 'Conejos'
        };
        if (ccode == "023") {
            return 'Costilla'
        };
        if (ccode == "025") {
            return 'Crowley'
        };
        if (ccode == "027") {
            return 'Custer'
        };
        if (ccode == "029") {
            return 'Delta'
        };
        if (ccode == "031") {
            return 'Denver'
        };
        if (ccode == "033") {
            return 'Dolores'
        };
        if (ccode == "035") {
            return 'Douglas'
        };
        if (ccode == "037") {
            return 'Eagle'
        };
        if (ccode == "039") {
            return 'Elbert'
        };
        if (ccode == "041") {
            return 'El Paso'
        };
        if (ccode == "043") {
            return 'Fremont'
        };
        if (ccode == "045") {
            return 'Garfield'
        };
        if (ccode == "047") {
            return 'Gilpin'
        };
        if (ccode == "049") {
            return 'Grand'
        };
        if (ccode == "051") {
            return 'Gunnison'
        };
        if (ccode == "053") {
            return 'Hinsdale'
        };
        if (ccode == "055") {
            return 'Huerfano'
        };
        if (ccode == "057") {
            return 'Jackson'
        };
        if (ccode == "059") {
            return 'Jefferson'
        };
        if (ccode == "061") {
            return 'Kiowa'
        };
        if (ccode == "063") {
            return 'Kit Carson'
        };
        if (ccode == "065") {
            return 'Lake'
        };
        if (ccode == "067") {
            return 'La Plata'
        };
        if (ccode == "069") {
            return 'Larimer'
        };
        if (ccode == "071") {
            return 'Las Animas'
        };
        if (ccode == "073") {
            return 'Lincoln'
        };
        if (ccode == "075") {
            return 'Logan'
        };
        if (ccode == "077") {
            return 'Mesa'
        };
        if (ccode == "079") {
            return 'Mineral'
        };
        if (ccode == "081") {
            return 'Moffat'
        };
        if (ccode == "083") {
            return 'Montezuma'
        };
        if (ccode == "085") {
            return 'Montrose'
        };
        if (ccode == "087") {
            return 'Morgan'
        };
        if (ccode == "089") {
            return 'Otero'
        };
        if (ccode == "091") {
            return 'Ouray'
        };
        if (ccode == "093") {
            return 'Park'
        };
        if (ccode == "095") {
            return 'Phillips'
        };
        if (ccode == "097") {
            return 'Pitkin'
        };
        if (ccode == "099") {
            return 'Prowers'
        };
        if (ccode == "101") {
            return 'Pueblo'
        };
        if (ccode == "103") {
            return 'Rio Blanco'
        };
        if (ccode == "105") {
            return 'Rio Grande'
        };
        if (ccode == "107") {
            return 'Routt'
        };
        if (ccode == "109") {
            return 'Saguache'
        };
        if (ccode == "111") {
            return 'San Juan'
        };
        if (ccode == "113") {
            return 'San Miguel'
        };
        if (ccode == "115") {
            return 'Sedgwick'
        };
        if (ccode == "117") {
            return 'Summit'
        };
        if (ccode == "119") {
            return 'Teller'
        };
        if (ccode == "121") {
            return 'Washington'
        };
        if (ccode == "123") {
            return 'Weld'
        };
        if (ccode == "125") {
            return 'Yuma'
        };

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
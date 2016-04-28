var map = null;
var map_revision = "r6";

var doodles = null;

$(document).ready(function() {
    map = L.map("map", {
        measureControl: true
    }).setView([0, 0], 1);

    doodles = L.featureGroup().addTo(map);
    L.tileLayer("assets/{revision}/map/{z}/{x}/{y}.png", {
        revision: map_revision,
        attribution: "Map data courtesy of <a href=\"http://minecraftairshippirates.enjin.com/profile/1310042\">Miss Fortune</a>",
        minZoom: 1,
        maxZoom: 6,
        tms: true,
        /*
        bounds: L.latLngBounds(
          map.unproject([0, 16384], map.getMaxZoom()),
          map.unproject([16384, 0], map.getMaxZoom())
        ),
        */
        continuousWorld: true,
        crs: L.CRS.Simple
    }).addTo(map);

    L.control.coordinates({
        position: "bottomleft",
        enableUserInput: false,
        customLabelFcn: function(latlng, opt) {
            xy = map.project(latlng, map.getMaxZoom());
            return "X: " + Math.round(xy.x) + " Y: " + Math.round(xy.y);
        }
    }).addTo(map);

    new L.Control.Draw({
        edit: {
            featureGroup: doodles,
            poly: {
                allowIntersection: false
            }
        },
        draw: {
            polygon: {
                allowIntersection: false
            }
        }
    }).addTo(map);

    map.on('draw:created', function(e) {
        layer = e.layer;
        doodles.addLayer(layer);
    });

    getFromURL("assets/" + map_revision + "/features/settlements.geojson", addGeoJSON);
});

function addGeoJSON(encoded) {
    for (var key in encoded["features"]) {
        encoded["features"][key].properties.coordinates = encoded["features"][key].geometry.coordinates;
        var latlng = map.unproject(encoded["features"][key].geometry.coordinates, map.getMaxZoom());
        encoded["features"][key].geometry.coordinates = [latlng.lng, latlng.lat]; // wince
    }
    var geoJson = L.geoJson(encoded, {
        pointToLayer: function(feature, latlng) {
            return L.marker(latlng, {
                icon: L.divIcon({
                    iconSize: null,
                    className: "map-label",
                    html: "<div>" + feature.properties.name + "</div>"
                })
            }).on("click", function(e) {
                $("#cityModal .modal-title").text(feature.properties.name);
                $("#cityModal .modal-body p span").text("Not set yet :(");
                if (feature.properties.lore != null) {
                    $("#cityModal .modal-body #faction span").html(feature.properties.faction);
                    $("#cityModal .modal-body #type span").html(feature.properties.desc);
                    $("#cityModal .modal-body #lore span").html(feature.properties.lore);
                    $("#cityModal .modal-body #source span").html(feature.properties.source)
                }
                $("#cityModal").modal();
            });
        },
        onEachFeature: function(feature, layer) {
            var coords = feature.properties.coordinates;
            layer.bindPopup(coords[0] + ", " + coords[1]);
            layer.on('mouseover', function(e) {
                this.openPopup();
            });

            layer.on('mouseout', function(e) {
                this.closePopup();
            });
        }
    });
    geoJson.addTo(map);
}

function getFromURL(url, callback) {
    var req = new XMLHttpRequest();
    req.overrideMimeType("application/json");
    req.open("GET", url);
    req.onreadystatechange = function() {
        if (req.readyState == 4 && req.status == 200) {
            callback(JSON.parse(req.responseText));
        }
    }
    req.onerror = function() {
        console.error(req.statusText);
    };
    req.send();
}

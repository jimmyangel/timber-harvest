'use strict';
import '../CNAME';
import '../favicon.ico';

import L from 'leaflet';
import 'leaflet-fullscreen';
import leafletPip from '@mapbox/leaflet-pip';

var esri = require('esri-leaflet');

var map = L.map('map', {fullscreenControl: true, center: [-122.0031, 44.2274], zoom: 8, minZoom: 8, maxBounds: [[40, -129], [50, -109]]});

map.createPane('trgrid');
map.getPane('trgrid').style.zIndex = 650;

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
  maxZoom: 19,
  attribution: 'Tiles © Esri — Source: <a href="http://www.arcgis.com/home/item.html?id=30e5fe3149c34df1ba922e6f5bbf808f">ArcGIS World Topographic Map</a> - <a href="https://data.fs.usda.gov/geodata/edw/datasets.php?xmlKeyword=Timber+Harvests">U.S. Forest Service</a>'
}).addTo(map);

//esri.basemapLayer("Topographic").addTo(map);
var t = esri.dynamicMapLayer({
  url: 'https://gis.blm.gov/orarcgis/rest/services/Land_Status/BLM_OR_PLSS/MapServer',
  layers: [2],
  opacity: 0.8,
  pane: 'trgrid'
}).addTo(map);

var info = L.control();

var hF;

var geojson;

info.onAdd = function () {
  this._div = L.DomUtil.create('div', 'info');
  this._div.innerHTML = '<h4>Willamette NF Timber Harvest Records</h4>' +
                        '<input type="range" min="1890" max="2018" value="1890" id="fromYear"> From: <span id="fromLabel"></span><br>' +
                        '<input type="range" min="1890" max="2018" value="2018" id="toYear"> To: <span id="toLabel"></span><br><hr>' +
                        '<div id="infoContent"></div>';
  L.DomEvent.disableClickPropagation(this._div);
  return this._div;
};

info.update = function (layers) {
  var infoItems;
  if (layers) {
    infoItems = '';
    layers.forEach(function(l) {
      infoItems +=
        '<b>' +
        'Sale Name: ' + (l.feature.properties.SALE_NAME ? l.feature.properties.SALE_NAME : 'N/A') + '</b><br>' +
        'Activity: ' + l.feature.properties.ACTIVITY_N.replace(/ *\([^)]*\) */g, '') + '<br>' +
        'Area: ' + l.feature.properties.GIS_ACRES + ' Acres<br>' +
        'Date Planned: ' + (new Date(l.feature.properties.DATE_PLANN).toLocaleDateString()) + '<br>' +
        'Date Accomplished: ' + (new Date(l.feature.properties.DATE_ACCOM).toLocaleDateString()) + '<br>' +
        'Date Completed: ' + (new Date(l.feature.properties.DATE_COMPL).toLocaleDateString()) + '<br>'

    });
  } else {
    infoItems = 'Click on a shape to view details<hr>';
  }
  $('#infoContent').html(infoItems);
};

info.addTo(map);

$('.info').css('max-height', $(window).height() - 50);
$(window).on('resize', function() {
  $('.info').css('max-height', $(window).height() - 50);
});
$('.info').on('mousedown wheel scrollstart touchstart mousewheel DOMMouseScroll MozMousePixelScroll', function(e) {
  e.stopPropagation();
});
info.update();

//function style(feature) {
function style() {
  var fColor = '#FF0000';

  return {
    weight: 0,
    opacity: 1,
    color: 'gray',
    dashArray: '3',
    fillOpacity: 0.7,
    fillColor: fColor
  };
}

function highlightFeature(e) {
  if (hF) {
    resetHighlight();
  }
  hF = e.target;
  var layer = e.target;

  layer.setStyle({
    weight: 3,
    color: '#666',
    dashArray: '',
    fillOpacity: 0.7
  });

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }

  info.update(leafletPip.pointInLayer(e.latlng, geojson));
  L.DomEvent.stopPropagation(e);
}

function resetHighlight() {
  if (hF) {
    geojson.resetStyle(hF);
    info.update();
  }
}

function onEachFeature(feature, layer) {
  layer.on({
    click: highlightFeature
  });
}

function updateFromYear() {
  var fromYear = $('#fromYear').val();
  var toYear = $('#toYear').val();
  $('#fromLabel').text(fromYear);
  $('#toLabel').text(toYear);
  showLayers(geojson, fromYear, toYear);
}

function showLayers(lg, fromYear, toYear) {
  lg.eachLayer(function(layer) {
    var y = (new Date(layer.feature.properties.DATE_ACCOM)).getFullYear();
    if ((y >= fromYear) && (y<=toYear)) {
      map.addLayer(layer);
    } else {
      map.removeLayer(layer);
    }
  });
  t.bringToFront();
}

$.getJSON( "data/timber-harvest-willamette-nf.json", function( data ) {

  geojson = L.geoJson(data, {
    style: style,
    onEachFeature: onEachFeature
  });

  map.fitBounds(geojson.getBounds());

  $('#fromYear').on('input', function() {
    updateFromYear();
  });

  $('#toYear').on('input', function() {
    updateFromYear();
  });

  updateFromYear();
  $('#overlay').fadeOut();

  map.on('click', resetHighlight);

});

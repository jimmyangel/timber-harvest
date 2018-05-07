'use strict';
import '../CNAME';
import '../favicon.ico';

import L from 'leaflet';
import 'leaflet-fullscreen';
import leafletPip from '@mapbox/leaflet-pip';
import 'multirange';

import {config} from './config.js';

import infoHeader from '../templates/infoHeader.hbs';
import infoContentItem from '../templates/infoContentItem.hbs';

var esri = require('esri-leaflet');

var map = L.map('map', {preferCanvas: true, fullscreenControl: true, center: [-122.0252, 44.5357], zoom: 9, minZoom: 8, maxBounds: [[40, -129], [50, -109]]});

map.createPane('trgrid');
map.getPane('trgrid').style.zIndex = 650;

L.tileLayer(config.baseMapLayers[0].url, config.baseMapLayers[0].options).addTo(map);

var townshipRangeLayer = esri.dynamicMapLayer(config.esriDynamicMapLayers[0]).addTo(map);

var info = L.control();
var highlightedFeature;
var timberHarvestDataLayer;

setUpInfoPanel();
setUpLayerControl();

displayTimberHarvestDataLayer();

function setUpInfoPanel() {
  info.onAdd = function () {
    this._div = L.DomUtil.create('div', 'info');
    this._div.innerHTML = infoHeader();
    L.DomEvent.disableClickPropagation(this._div);
    return this._div;
  };

  info.update = function (layers) {
    var infoItems;
    if (layers) {
      infoItems = '';
      layers.forEach(function(l) {
        infoItems += infoContentItem({
          saleName: (l.feature.properties.SALE_NAME ? l.feature.properties.SALE_NAME : 'N/A'),
          activity: l.feature.properties.ACTIVITY_N.replace(/ *\([^)]*\) */g, ''),
          acres: l.feature.properties.GIS_ACRES.toLocaleString(window.navigator.language, {maximumFractionDigits: 0}),
          datePlanned: (new Date(l.feature.properties.DATE_PLANN).toLocaleDateString()),
          dateAccomplished: (new Date(l.feature.properties.DATE_ACCOM).toLocaleDateString()),
          dateCompleted: (new Date(l.feature.properties.DATE_COMPL).toLocaleDateString())
        });
      });
      $('#tipToClick').hide();
      $('#infoContent').html(infoItems);
    } else {
      $('#infoContent').empty()
      $('#tipToClick').show();
    }
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
}

function setUpLayerControl() {
  /*var layerArray = tmBaseMapLayers;

  // Iterate through list of base layers and add to layer control
  for (var k=0; k<layerArray.length; k++) {
    var bl = L.tileLayer(layerArray[k].layerUrl, {minZoom: 1, maxZoom: layerArray[k].maxZoom, attribution: layerArray[k].attribution, ext: 'png'});
    layerControl.addBaseLayer(bl, layerArray[k].layerName);
    // Wire the spinner handlers
    bl.on('loading', spinHandler);
    bl.on('load', spinHandler);

    // First layer is the one displayed by default
    if (k === 0) {
      map.addLayer(bl);
    }
  } */
}

function highlightFeature(e) {
  if (highlightedFeature) {
    resetHighlight();
  }
  highlightedFeature = e.target;
  var layer = e.target;

  layer.setStyle(config.styles.highlightedFeatureStyle);

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }

  info.update(leafletPip.pointInLayer(e.latlng, timberHarvestDataLayer));
  L.DomEvent.stopPropagation(e);
}

function resetHighlight() {
  if (highlightedFeature) {
    timberHarvestDataLayer.resetStyle(highlightedFeature);
    info.update();
  }
}

function onEachFeature(feature, layer) {
  layer.on({
    click: highlightFeature
  });
}

function showFeaturesForRange() {
  var fromToYear = $('.fromToYear').val().split(',');
  $('#fromLabel').text(fromToYear[0]);
  $('#toLabel').text(fromToYear[1]);
  timberHarvestDataLayer.eachLayer(function(layer) {
    var y = (new Date(layer.feature.properties.DATE_ACCOM)).getFullYear();
    if ((y >= fromToYear[0]) && (y<=fromToYear[1])) {
      map.addLayer(layer);
    } else {
      map.removeLayer(layer);
    }
  });
}

function displayTimberHarvestDataLayer() {
  $.getJSON(config.dataPaths.willamette, function(data) {
    timberHarvestDataLayer = L.geoJson(data, {
      style: config.styles.featureStyle,
      onEachFeature: onEachFeature
    });
    map.fitBounds(timberHarvestDataLayer.getBounds());
    $('.fromToYear').on('input', function() {
      showFeaturesForRange();
    });
    showFeaturesForRange();
    $('#overlay').fadeOut();
    map.on('click', resetHighlight);
  });
}

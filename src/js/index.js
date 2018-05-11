'use strict';
import '../CNAME';
import '../favicon.ico';

import L from 'leaflet';
import 'leaflet-fullscreen';
import leafletPip from '@mapbox/leaflet-pip';
import 'leaflet.vectorgrid';
import 'multirange';
import 'leaflet-modal';
import Spinner from 'spin';

import {config} from './config.js';
import * as utils from './utils.js';

import infoHeader from '../templates/infoHeader.hbs';
import infoContentItem from '../templates/infoContentItem.hbs';
import aboutModal from '../templates/aboutModal.hbs';

var NProgress = require('nprogress');
var esri = require('esri-leaflet');

NProgress.configure({showSpinner: false, trickle: false, minimum: 0.001});

var spinner = new Spinner(config.spinnerOpts);
spinner.spin($('#spinner')[0]);

var map = L.map('map', {preferCanvas: true, fullscreenControl: true, center: [44.04382, -120.58593], zoom: 9, minZoom: 8, maxBounds: [[41, -126], [47, -115]]});

map.createPane('trgrid');
map.getPane('trgrid').style.zIndex = 650;

var info = L.control();
var highlightedFeature;
var timberHarvestDataLayer;

setUpInfoPanel();
setUpLayerControl();
setUpAboutControl();

displayTimberHarvestDataLayer();

function setUpInfoPanel() {
  info.onAdd = function () {
    this._div = L.DomUtil.create('div', 'info');
    this._div.innerHTML = infoHeader({
      layerColor: config.styles.featureStyle.fillColor,
      layerOpacity: (config.styles.featureStyle.fillOpacity * 100).toFixed()
    });
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
  var baseMaps = {};
  var overlayLayers = {};
  // Iterate through list of base layers and add to layer control
  for (var k=0; k<config.baseMapLayers.length; k++) {
    var bl = baseMaps[config.baseMapLayers[k].name] = L.tileLayer(config.baseMapLayers[k].url, config.baseMapLayers[k].options);
    if (k === 0) {
      map.addLayer(bl);
    }
  }
  // Iterate through list of overlay layers and add to layer control
  for (k=0; k<config.overlayLayers.length; k++) {
    switch (config.overlayLayers[k].type) {
      case 'esri':
        var overlayLayer = overlayLayers[config.overlayLayers[k].name] = esri.featureLayer(config.overlayLayers[k].options);
        if (config.overlayLayers[k].isTownshipAndRange) {
          setUpTownshipAndRangeLabels(overlayLayer)
        }
        break;
      case 'vectorgrid':
        config.overlayLayers[k].options.rendererFactory = L.canvas.tile;
        overlayLayers[config.overlayLayers[k].name] = L.vectorGrid.protobuf(config.overlayLayers[k].url, config.overlayLayers[k].options)
        break;
    }
  }

  L.control.layers(baseMaps, overlayLayers, {position: 'topleft', collapsed: true}).addTo(map);
}

function setUpTownshipAndRangeLabels(overlayLayer) {
  var labels = {};

  overlayLayer.on('createfeature', function(e){
    var id = e.feature.id;
    var feature = this.getFeature(id);
    var center = feature.getBounds().getCenter();
    var label = L.marker(center, {
      icon: L.divIcon({
        iconSize: [100,20],
        className: 'toRaLabel',
        html: e.feature.properties.TWNSHPLAB
      })
    }).addTo(map);
    labels[id] = label;
  });

  map.on('zoomstart', function() {
    $('.toRaLabel').hide();
  });

  map.on('zoomend', function() {
    var zoom = map.getZoom();
    if (zoom > 10) {
      $('.toRaLabel').show();
      $('.toRaLabel').removeClass('leaflet-interactive');
    } else {
      $('.toRaLabel').hide();
    }
  });

  overlayLayer.on('addfeature', function(e){
    var label = labels[e.feature.id];
    if(label){
      label.addTo(map);
    }
  });

  overlayLayer.on('removefeature', function(e){
    var label = labels[e.feature.id];
    if(label){
      map.removeLayer(label);
    }
  });
}

function setUpAboutControl() {
  var aboutControl = L.control({position: 'bottomright'});
  aboutControl.onAdd = function () {
    this._div = L.DomUtil.create('div', 'leaflet-control leaflet-bar about');
    this._div.innerHTML = '<a id="aboutControl" style="font-size: large;" href="#" title="About">&#9432;</a>';
    return this._div;
  };
  aboutControl.addTo(map);
  $('#aboutControl').click(function() {
    map.fire('modal', {
      content: aboutModal({version: config.versionString})
    });
    return false;
  });
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
  //$('.fromToYear').val('1921,1930');
  var fromToYear = $('.fromToYear').val().split(',');
  $('#fromLabel').text(fromToYear[0]);
  $('#toLabel').text(fromToYear[1]);
  timberHarvestDataLayer.eachLayer(function(layer) {
    var y = (new Date(layer.feature.properties.DATE_COMPL)).getFullYear();
    if ((y >= fromToYear[0]) && (y<=fromToYear[1])) {
      map.addLayer(layer);
    } else {
      map.removeLayer(layer);
    }
  });
}

function setDataLayerOpacity() {
  var opacity = $('#transparency').val() / 100;
  timberHarvestDataLayer.setStyle({
    fillOpacity: opacity,
    opacity: Math.min(opacity * (config.styles.featureStyle.opacity/config.styles.featureStyle.fillOpacity), 1)});
}

function displayTimberHarvestDataLayer() {
  $.getJSON(config.dataPaths.willamette, function(data) {
    timberHarvestDataLayer = L.geoJson(data, {
      style: config.styles.featureStyle,
      onEachFeature: onEachFeature,
      attribution: '<a href="https://data.fs.usda.gov/geodata/edw/datasets.php?xmlKeyword=Timber+Harvests">U.S. Forest Service</a>'
    });

    var startValue;
    var stopValue;
    var movingValue;
    utils.setupPlaybackControlActions(function() {
      NProgress.start();
      var values = $('.fromToYear').val().split(',');
      startValue = parseInt(values[0]);
      stopValue = parseInt(values[1]);
      movingValue = startValue;
    },function() {
      NProgress.set((movingValue - startValue) /(stopValue - startValue));
      if (movingValue <= stopValue) {
        $('.fromToYear.multirange.original').val(startValue + ',' + movingValue++);
      } else {
        movingValue = startValue;
      }
      showFeaturesForRange();
    }, function() {
      NProgress.remove();
      $('.fromToYear.multirange.original').val(startValue + ',' + stopValue);
      showFeaturesForRange();
    });

    map.flyToBounds(timberHarvestDataLayer.getBounds());
    $('.fromToYear').on('input', function() {
      NProgress.remove();
      utils.resetPlaybackControl()
      showFeaturesForRange();
    });
    $('#transparency').on('input', function() {
      setDataLayerOpacity();
    });
    setDataLayerOpacity();
    showFeaturesForRange();
    spinner.stop();
    //NProgress.done();
    map.on('click', resetHighlight);
    $(document).keyup(function(e) {
      if (highlightedFeature && e.which == 27) resetHighlight();
    });
  });
}

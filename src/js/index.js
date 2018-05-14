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
import infoContent from '../templates/infoContent.hbs';
import aboutModal from '../templates/aboutModal.hbs';
import standPopUp from '../templates/standPopUp.hbs';

var NProgress = require('nprogress');
var esri = require('esri-leaflet');

NProgress.configure({showSpinner: false, trickle: false, minimum: 0.001});

var spinner = new Spinner(config.spinnerOpts);
spinner.spin($('#spinner')[0]);

var map = L.map('map', {fullscreenControl: true, center: [44.04382, -120.58593], zoom: 9, minZoom: 8, maxBounds: [[41, -126], [47, -115]]});

var info = L.control();
var highlightedFeature;
var timberHarvestSelectData;

var timberHarvestPbfLayer;

setUpCustomPanes();
setUpInfoPanel();
setUpResetControl();
setUpLayerControl();
setUpAboutControl();

displaytimberHarvestPbfLayer();

function setUpCustomPanes() {
  map.createPane('trgrid');
  map.getPane('trgrid').style.zIndex = 650;
  var mainPane = map.createPane('mainpane');
  map.getPane('mainpane').style.zIndex = 400;

  // The below is a hack to handle click throughs (https://gist.github.com/perliedman/84ce01954a1a43252d1b917ec925b3dd)
  L.DomEvent.on(mainPane, 'click', function(e) {
    if (e._stopped) { return; }
    console.log(e);

    var target = e.target;
    var stopped;
    var removed;
    var ev = new MouseEvent(e.type, e)

    removed = {node: target, display: target.style.display};
    target.style.display = 'none';
    target = document.elementFromPoint(e.clientX, e.clientY);

    if (target && target !== mainPane) { //TODO: do not punch through map -- add  && map
      stopped = !target.dispatchEvent(ev);
      if (stopped || ev._stopped) {
        L.DomEvent.stop(e);
      }
    }
    removed.node.style.display = removed.display;
  });
}

function setUpInfoPanel() {
  info.onAdd = function () {
    this._div = L.DomUtil.create('div', 'info');
    this._div.innerHTML = infoHeader({
      layerColor: config.timberHarvestLayer.options.vectorTileLayerStyles.timberharvest.fillColor,
      layerOpacity: (config.timberHarvestLayer.options.vectorTileLayerStyles.timberharvest.fillOpacity * 100).toFixed()
    });
    L.DomEvent.disableClickPropagation(this._div);
    return this._div;
  };

  info.update = function (layers) {
    if (layers) {
      var infoItems = [];
      layers.forEach(function(l) {
        infoItems.push({
          saleName: (l.feature.properties.SALE_NAME ? l.feature.properties.SALE_NAME : 'N/A'),
          activity: l.feature.properties.ACTIVITY_N.replace(/ *\([^)]*\) */g, ''),
          acres: l.feature.properties.GIS_ACRES.toLocaleString(window.navigator.language, {maximumFractionDigits: 0}),
          datePlanned: (new Date(l.feature.properties.DATE_PLANN).toLocaleDateString()),
          dateAccomplished: (new Date(l.feature.properties.DATE_ACCOM).toLocaleDateString()),
          dateCompleted: (new Date(l.feature.properties.DATE_COMPL).toLocaleDateString()),
          sortDate: new Date(l.feature.properties.DATE_COMPL)
        });
      });
      $('#tipToClick').hide();
      $('#infoContent').html(infoContent({records: infoItems.sort(function(a, b) {return a.sortDate - b.sortDate;})}));
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
        var oLayer = overlayLayers[config.overlayLayers[k].name] = esri.featureLayer(config.overlayLayers[k].options);
        if (config.overlayLayers[k].isTownshipAndRange) {
            setUpTownshipAndRangeLabels(oLayer);
        }
        break;
      case 'vectorgrid':
        config.overlayLayers[k].options.rendererFactory = L.canvas.tile;
        var gLayer = overlayLayers[config.overlayLayers[k].name] = L.vectorGrid.protobuf(config.overlayLayers[k].url, config.overlayLayers[k].options);
        gLayer.on({
          click: function (e) {
            map.openPopup(standPopUp({standId: e.layer.properties.STAND, year: e.layer.properties.YR_ORIGIN, size: config.treeSizeClass[e.layer.properties.SIZE_CLASS]}), e.latlng, {closeOnClick: false});
            console.log('unharvested', e);
          }
        });
        /*gLayer.bindPopup(function(l) {
          // We need to see if the stand is on top of a harvest polygon to update info
          //var p = leafletPip.pointInLayer(this.getLatLng(), timberHarvestDataLayer);
          if (p) {
            info.update(p);
          }
          return standPopUp({standId: l.properties.STAND, year: l.properties.YR_ORIGIN, size: config.treeSizeClass[l.properties.SIZE_CLASS]});
        });*/
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
      }),
      interactive: false
    }).addTo(map);
    labels[id] = label;
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

function setUpResetControl() {
  var resetControl = L.control({position: 'topleft'});
  resetControl.onAdd = function () {
    this._div = L.DomUtil.create('div', 'leaflet-control leaflet-bar reset');
    this._div.innerHTML = '<a id="resetControl" style="font-size: large;" href="#" title="Reset View"><i class="fa fa-refresh"></i></a>';
    return this._div;
  };
  resetControl.addTo(map);
  $('#resetControl').click(function() {
    map.closePopup();
    resetHighlight();
    map.flyToBounds(config.initialBounds);
    return false;
  });
}

function highlightFeature(id) {
  // Unfortunately id can be 0, so we need to test for undefined
  if (highlightedFeature !== undefined) {
    resetHighlight();
  }
  highlightedFeature = id;

  timberHarvestPbfLayer.setFeatureStyle(id, getTimberHarvestLayerStyle(config.timberHarvestLayer.highlightedFeatureStyle));
  /*highlightedFeature = e.target;
  var layer = e.target;

  layer.setStyle(config.styles.highlightedFeatureStyle);

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }

  //info.update(leafletPip.pointInLayer(e.latlng, timberHarvestDataLayer));
  L.DomEvent.stopPropagation(e);*/
}

function resetHighlight() {
  if (highlightedFeature !== undefined) {
    timberHarvestPbfLayer.setFeatureStyle(highlightedFeature, getTimberHarvestLayerStyle(config.timberHarvestLayer.options.vectorTileLayerStyles.timberharvest));
    info.update();
  }
  highlightedFeature = undefined;
}

function showFeaturesForRange() {
  //$('.fromToYear').val('1921,1930');
  var fromToYear = $('.fromToYear').val().split(',');
  $('#fromLabel').text(fromToYear[0]);
  $('#toLabel').text(fromToYear[1]);

  var style = getTimberHarvestLayerStyle(config.timberHarvestLayer.options.vectorTileLayerStyles.timberharvest);
  timberHarvestSelectData.forEach(function(s) {
    var y = (new Date(s.DATE_COMPL)).getFullYear();
    if ((y >= fromToYear[0]) && (y <= fromToYear[1])) {
      timberHarvestPbfLayer.setFeatureStyle(s.assignedId, style);
    } else {
      //console.log(s.assignedId);
      timberHarvestPbfLayer.setFeatureStyle(s.assignedId, {weight:0, fill: false});
    }
  });
}

function getTimberHarvestLayerStyle(sourceStyle) {
  var s = Object.assign({}, sourceStyle);
  s.fillOpacity = $('#transparency').val() / 100;
  s.opacity = Math.min(s.fillOpacity *
    (config.timberHarvestLayer.options.vectorTileLayerStyles.timberharvest.opacity /
      config.timberHarvestLayer.options.vectorTileLayerStyles.timberharvest.fillOpacity), 1);
  return s;
}

function displaytimberHarvestPbfLayer() {

  $.getJSON('http://10.0.0.70:9090/timber-or-s-selection-data.json', function(data) {

    timberHarvestSelectData = data;
    console.log(data.length);

    map.fitBounds(config.initialBounds);

    config.timberHarvestLayer.options.rendererFactory = L.svg.tile;
    timberHarvestPbfLayer = L.vectorGrid.protobuf(config.timberHarvestLayer.url, config.timberHarvestLayer.options).addTo(map);

    timberHarvestPbfLayer.on({
      click: function (e) {
        highlightFeature(e.layer.properties.assignedId);
        //map.closePopup();
        console.log('timberharvest', e);
        //map.openPopup('hola', e.latlng);
      }
    });

    // Must initialize these in case stop is pressed before play
    var values = $('.fromToYear').val().split(',');
    var startValue = parseInt(values[0]);
    var stopValue = parseInt(values[1]);
    var movingValue = startValue;
    utils.setupPlaybackControlActions(function() {
      NProgress.start();
      // Update values
      values = $('.fromToYear').val().split(',');
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

    $('.fromToYear').on('input', function() {
      NProgress.remove();
      utils.resetPlaybackControl()
      showFeaturesForRange();
    });
    $('#transparency').on('input', function() {
      showFeaturesForRange();
    });
    showFeaturesForRange();

    spinner.stop();
    NProgress.done();

    //map.on('click', resetHighlight);
    $(document).keyup(function(e) {
      if ((highlightedFeature !== undefined) && (e.which == 27)) resetHighlight();
    });

  });
}

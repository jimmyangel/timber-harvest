'use strict';
import '../CNAME';
import '../favicon.ico';

import L from 'leaflet';
import 'leaflet-fullscreen';
import 'leaflet.vectorgrid';
import 'leaflet-modal';
import Spinner from 'spin';
import Slider from 'omni-slider';

import {config} from './config.js';
import * as utils from './utils.js';

import infoHeader from '../templates/infoHeader.hbs';
import infoContentItem from '../templates/infoContentItem.hbs';
import aboutModal from '../templates/aboutModal.hbs';
import standPopUp from '../templates/standPopUp.hbs';

var NProgress = require('nprogress');
var esri = require('esri-leaflet');

NProgress.configure({showSpinner: false, trickle: false, minimum: 0.001});

var spinner = new Spinner(config.spinnerOpts);
spinner.spin($('#spinner')[0]);

var map = L.map('map', {fullscreenControl: true, center: [44.04382, -120.58593], zoom: 9, minZoom: 8, maxBounds: [[41, -126], [47, -115]]});

var info = L.control();
var highlightedFeatures = [];
var timberHarvestSelectData;
var timberHarvestPbfLayer;
var lastLayerEventTimeStamp;

var dateRangeSlider;

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

    var target = e.target;
    var stopped;
    var removed;
    var ev = new MouseEvent(e.type, e)

    removed = {node: target, display: target.style.display};
    target.style.display = 'none';
    target = document.elementFromPoint(e.clientX, e.clientY);

    if (target && target !== mainPane) {
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

  info.update = function () {
    $('#infoContent').empty();
    $('#tipToClick').show();
  };

  info.addTo(map);
  var options = {
      isDate: false,
      min: config.defaultDateRange.fromYear,
      max: config.defaultDateRange.toYear,
      start: config.defaultDateRange.fromYear,
      end: config.defaultDateRange.toYear,
      overlap: true
  };
  dateRangeSlider = new Slider($('#dateRangeSlider')[0], options);
  $('.handle').attr('tabindex', 0);

  // These tweaks are needed to allow for the info box to scroll and not run on top of other things
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
            resetHighlight();
            map.openPopup(standPopUp({standId: e.layer.properties.STAND, year: e.layer.properties.YR_ORIGIN, size: config.treeSizeClass[e.layer.properties.SIZE_CLASS]}), e.latlng, {closeOnClick: false});
            lastLayerEventTimeStamp = e.originalEvent.timeStamp;
          }
        });
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

function highlightFeature(e) {

  // Not great but the best I can do rigth now to distinguish mutiple features click thrus vs a separate click altogether
  if ((e.originalEvent.timeStamp - lastLayerEventTimeStamp) > 20) {
    resetHighlight();
  }

  var sortDate = (new Date(e.layer.properties.DATE_COMPL)).toISOString();
  var content = infoContentItem({
    saleName: (e.layer.properties.SALE_NAME ? e.layer.properties.SALE_NAME : 'N/A'),
    activity: e.layer.properties.ACTIVITY_N.replace(/ *\([^)]*\) */g, ''),
    acres: e.layer.properties.GIS_ACRES.toLocaleString(window.navigator.language, {maximumFractionDigits: 0}),
    datePlanned: (new Date(e.layer.properties.DATE_PLANN).toLocaleDateString()),
    dateAccomplished: (new Date(e.layer.properties.DATE_ACCOM).toLocaleDateString()),
    dateCompleted: (new Date(e.layer.properties.DATE_COMPL).toLocaleDateString()),
    sortDate: sortDate
  });

  if ($('.infoContentItem').length === 0) {
    $('#infoContent').append(content);
  } else {
    $('.infoContentItem').each(function(i){
      if ($(this).attr('data-sortby') >= sortDate) {
        $(this).before(content);
        return false;
      } else {
        if (i === $('.infoContentItem').length - 1) {
          $(this).after(content);
          return false;
        }
      }
    });
  }

  highlightedFeatures.push(e.layer.properties.assignedId);

  timberHarvestPbfLayer.setFeatureStyle(e.layer.properties.assignedId, getTimberHarvestLayerStyle(config.timberHarvestLayer.highlightedFeatureStyle));
}

function resetHighlight() {
  highlightedFeatures.forEach(function(highlightedFeature) {
    timberHarvestPbfLayer.setFeatureStyle(highlightedFeature, getTimberHarvestLayerStyle(config.timberHarvestLayer.options.vectorTileLayerStyles.timberharvest));
  });
  $('#infoContent').empty();
  highlightedFeatures = [];
}

function showFeaturesForRange() {

  var fromYear = Math.round(dateRangeSlider.getInfo().left);
  var toYear = Math.round(dateRangeSlider.getInfo().right);
  $('#fromLabel').text(fromYear);
  $('#toLabel').text(toYear);

  var style = getTimberHarvestLayerStyle(config.timberHarvestLayer.options.vectorTileLayerStyles.timberharvest);
  timberHarvestSelectData.forEach(function(s) {
    var y = (new Date(s.DATE_COMPL)).getFullYear();
    if ((y >= fromYear) && (y <= toYear)) {
      timberHarvestPbfLayer.setFeatureStyle(s.assignedId, style);
    } else {
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

  $.getJSON(config.dataPaths.willamette, function(data) {

    timberHarvestSelectData = data;

    map.fitBounds(config.initialBounds);

    config.timberHarvestLayer.options.rendererFactory = L.svg.tile;
    timberHarvestPbfLayer = L.vectorGrid.protobuf(config.timberHarvestLayer.url, config.timberHarvestLayer.options).addTo(map);

    timberHarvestPbfLayer.on({
      click: function (e) {
        lastLayerEventTimeStamp = e.originalEvent.timeStamp;
        highlightFeature(e);
      }
    });

    // Must initialize these in case stop is pressed before play
    var startValue = Math.round(dateRangeSlider.getInfo().left);
    var stopValue = Math.round(dateRangeSlider.getInfo().right);
    var movingValue = startValue;
    utils.setupPlaybackControlActions(function() {
      NProgress.start();
      // Update values
      startValue = Math.round(dateRangeSlider.getInfo().left);
      stopValue = Math.round(dateRangeSlider.getInfo().right);
      movingValue = startValue;
    },function() {
      NProgress.set((movingValue - startValue) /(stopValue - startValue));
      if (movingValue <= stopValue) {
        dateRangeSlider.move({left: startValue, right: movingValue++}, true);
      } else {
        movingValue = startValue;
      }
      showFeaturesForRange();
    }, function() {
      NProgress.remove();
      dateRangeSlider.move({left: startValue, right: stopValue});
      showFeaturesForRange();
    });

    // Filter data based on slider range values
    dateRangeSlider.subscribe('moving', function(data) {
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

    map.on('click', function(e) {
      // This is a hack but is the only way I found to deal with canvas layer event bubbling issues
      if ((e.originalEvent.timeStamp - lastLayerEventTimeStamp) > 20) {
        map.closePopup();
        resetHighlight();
      }
    });

    $(document).keyup(function(e) {
      if ((highlightedFeatures.length) && (e.which == 27)) resetHighlight();
    });

  });
}

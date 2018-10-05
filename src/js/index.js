'use strict';
import '../CNAME';
import '../_redirects';
import '../favicon.ico';

import L from 'leaflet';
import 'leaflet-fullscreen';
import 'leaflet.vectorgrid';
import 'leaflet-modal';
import 'leaflet.pattern';
import 'leaflet-tilelayer-pixelfilter';
import Spinner from 'spin';
import Slider from 'omni-slider';

import {config} from './config.js';
import * as utils from './utils.js';

import infoHeader from '../templates/infoHeader.hbs';
import infoContentItem from '../templates/infoContentItem.hbs';
import aboutModal from '../templates/aboutModal.hbs';
import standPopUp from '../templates/standPopUp.hbs';
import topLabel from '../templates/topLabel.hbs';

var NProgress = require('nprogress');
var esri = require('esri-leaflet');

NProgress.configure({showSpinner: false, trickle: false, minimum: 0.001});

var spinner = new Spinner(config.spinnerOpts);

var map = L.map('map', {fullscreenControl: true, zoom: 6, minZoom: 6, maxBounds: [[41, -126], [47, -115]]});
var stripes = new L.StripePattern(config.stripesStyleOptions); stripes.addTo(map);
var resetViewBounds = config.oregonBbox;
map.fitBounds(resetViewBounds);

L.DomUtil.create('div', 'topLabel', map.getContainer());
$('.topLabel').html(topLabel);

var info = L.control();
var highlightedFeatures = [];
var timberHarvestSelectData;
var timberHarvestPbfLayer;
var isFedcuts = false;
var unharvestedLayer;
var lastLayerEventTimeStamp;
var areaSignsLayerGroup = L.layerGroup().addTo(map); // This is so getCenter works
var areaShapes;

var layersControl;

var dateRangeSlider;
var opacitySlider;

var fromYear;
var toYear;

setUpCustomPanes();
setUpInfoPanel();
setUpResetControl();
setUpLayerControl();
setUpAboutControl();

initMap(function() {
  var f = utils.getUrlVars().a;

  window.onpopstate = function(e) {
    if (e.state === 'top') {
      gotoTop();
    } else {
      gotoArea(e.state);
    }
  };

  if (f && (config.areas[f])) {
    history.replaceState(f, '', '?a=' + f);
    gotoArea(f);
  } else {
    history.replaceState('top', '', '.');
    gotoTop();
  }
});

function initMap(callback) {
  $.getJSON(config.topLevelDataPath.baseUrl + config.topLevelDataPath.areaCartoonsFileName, function(data) {
    areaShapes = L.geoJson(data, {
      style: setAreaBoundaryStyle,
      onEachFeature: function(f, l) {
        if (config.areas[l.feature.properties.name]) {
          config.areas[l.feature.properties.name].bounds = l.getBounds();
        }
        l.on('click', function(e) {
          gotoArea(l.feature.properties.name, true, e.latlng);
        });
      }
    }).addTo(map);

    areaShapes.eachLayer(function(l) {
      var op = config.areas[l.feature.properties.name].overrideSignPosition;
      var m = L.marker(op ? op : l.getCenter(), {
        icon: L.icon({
          iconUrl: config.topLevelDataPath.baseUrl + l.feature.properties.name + config.topLevelDataPath.areaIconSuffix,
          className: 'areaSign ' + l.feature.properties.name + '-sign'
        }
      )}).addTo(areaSignsLayerGroup);
      m.on('click', function(e) {
        gotoArea(l.feature.properties.name, true, e.latlng);
      });
    });

    var areaSignWidth = parseInt($('.areaSign').css('width'));
    setSignSize(areaSignWidth);

    map.on('zoomend', function() {setSignSize(areaSignWidth);});

    return callback();
  });
}

function setSignSize(areaSignWidth) {
  var zoomThreshold = 8;
  var scalingFactor = 1.4;
  var z = map.getZoom();
  if (z < zoomThreshold) {
    var w = areaSignWidth / (scalingFactor*(zoomThreshold-z));
    $('.areaSign').css('width', w.toFixed() + 'px');
    $('.areaSign').css('margin-left', '-' + (w/scalingFactor).toFixed() + 'px');
  } else {
    if ($('.areaSign').css('width') !== (areaSignWidth + 'px')) {
      $('.areaSign').css('width', areaSignWidth + 'px');
      $('.areaSign').css('margin-left', '-' + (areaSignWidth/scalingFactor).toFixed() + 'px');
    }
  }
}

function setAreaBoundaryStyle(f) {
  return config.areaBoundaryStyles[config.areas[f.properties.name].type];
}

function gotoTop() {
  resetViewBounds = config.oregonBbox;
  if (timberHarvestPbfLayer) {
    areaShapes.setStyle(setAreaBoundaryStyle);
    enableAllAreaShapesClick();
    utils.resetPlaybackControl();
    resetHighlight();
    dateRangeSlider.move({left: config.dateRangeSliderOptions.min, right: config.dateRangeSliderOptions.max}, true);
    opacitySlider.move({right: config.defaultOpacity}, false);
    timberHarvestPbfLayer.removeFrom(map);
    timberHarvestPbfLayer = undefined;
    timberHarvestSelectData = undefined;
    if (unharvestedLayer) {
      removeUnharvestedOverlay();
    }
  }
  $('.info').hide();
  $('.topLabel').show();
  map.flyToBounds(resetViewBounds);
  $('.areaSign').show();
}

function gotoArea(area, pushState) {
  if (config.areas[area]) {
    if (pushState) {
      history.pushState(area, '', '?a=' + area);
    }
    resetViewBounds = config.areas[area].bounds;
    spinner.spin($('#spinner')[0]);
    $('.areaSign').show();
    $('.' + area + '-sign').hide();
    if (timberHarvestPbfLayer) {
      timberHarvestPbfLayer.removeFrom(map);
    } else {
      map.fitBounds(resetViewBounds);
    }
    areaShapes.setStyle(config.areaBoundaryStyle);
    areaShapes.setStyle({opacity: 0, fillOpacity: 0.5, fillPattern: stripes});
    enableAllAreaShapesClick();
    disableAreaShapeClick(area);
    utils.resetPlaybackControl();

    isFedcuts = config.areas[area].underreported;
    if (isFedcuts) {
      $('#infoContent').empty();
      $('#rangeWidgets').hide();
      $('#legendWidget').hide();
      $('#tipToClick').hide();
      displayFedcutsPbfLayer(area);
    } else {
      $('#rangeWidgets').show();
      $('#legendWidget').show();
      $('#tipToClick').show();
      displaytimberHarvestPbfLayer(area);
    }
    if (unharvestedLayer) {
      removeUnharvestedOverlay();
    }
    addUnharvestedOverlay(area);
    $('#infoPanelSubTitle').text(config.areas[area].name);
    if (config.areas[area].underreported) {
      $('#dataQualityAlert').show();
    } else {
      $('#dataQualityAlert').hide();
    }

    $('.topLabel').hide();
    $('.info').show();
  } else {
    displayFedcutsPbfLayer(area);
  }
}

function enableAllAreaShapesClick() {
  areaShapes.eachLayer(function(l) {
    if (!l.listens('click')) {
      l.on('click', function(e) {
        gotoArea(l.feature.properties.name, true, e.latlng);
      });
    }
  });
}

function disableAreaShapeClick(area){
  areaShapes.eachLayer(function(l) {
    if (area === l.feature.properties.name) {
      l.setStyle({opacity: 0, fillOpacity: 0})
      l.off('click');
    }
  });
}

function addUnharvestedOverlay(area){
  if (config.areas[area].hasUnharvestedLayer) {
    config.unharvestedOverlayLayer.options.rendererFactory = L.canvas.tile;
    unharvestedLayer = L.vectorGrid.protobuf(config.unharvestedOverlayLayer.baseUrl + area + config.unharvestedOverlayLayer.tileScheme, config.unharvestedOverlayLayer.options);
    unharvestedLayer.on({
      click: function (e) {
        resetHighlight();
        map.openPopup(standPopUp({standId: e.layer.properties.STAND, year: e.layer.properties.YR_ORIGIN, size: config.treeSizeClass[e.layer.properties.SIZE_CLASS]}), e.latlng, {closeOnClick: false});
        lastLayerEventTimeStamp = e.originalEvent.timeStamp;
      }
    });

    layersControl.addOverlay(unharvestedLayer, config.unharvestedOverlayLayer.name);
  }
}

function removeUnharvestedOverlay() {
  unharvestedLayer.removeFrom(map);
  layersControl.removeLayer(unharvestedLayer);
  unharvestedLayer = undefined;
}

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
      loggingTypeLegend: config.loggingTypeLegend,
      layerOpacity: (config.timberHarvestStyle.fillOpacity * 100).toFixed()
    });
    L.DomEvent.disableClickPropagation(this._div);
    return this._div;
  };

  info.update = function () {
    $('#infoContent').empty();
  };

  info.addTo(map);

  dateRangeSlider = new Slider($('#dateRangeSlider')[0], config.dateRangeSliderOptions);
  // $('.handle').attr('tabindex', 0); Deal with keyboard later

  config.opacitySliderOptions.start = config.defaultOpacity;
  opacitySlider = new Slider($('#opacitySlider')[0], config.opacitySliderOptions);
  $('.info').hide();

  // These tweaks are needed to allow for the info box to scroll and not run on top of other things
  $('.info').css('max-height', $(window).height() - 50);
  $(window).on('resize', function() {
    $('.info').css('max-height', $(window).height() - 50);
  });
  $('.info').on('mousedown wheel scrollstart touchstart mousewheel DOMMouseScroll MozMousePixelScroll', function(e) {
    e.stopPropagation();
  });
  info.update();

  setUpPlaybackControl();
  setUpSlideHandlers();

  // Update labels
  $('#fromLabel').text(Math.round(dateRangeSlider.getInfo().left));
  $('#toLabel').text(Math.round(dateRangeSlider.getInfo().right));

  $('#infoPanelTitle').click(function() {
    history.pushState('top', '', '.');
    gotoTop();
    return false;
  });
}

function setUpLayerControl() {
  var baseMaps = {};
  var overlayLayers = {};
  // Iterate through list of base layers and add to layer control
  for (var k=0; k<config.baseMapLayers.length; k++) {
    var bl = baseMaps[config.baseMapLayers[k].name] = L.tileLayer(config.baseMapLayers[k].url, config.baseMapLayers[k].options);
    if (config.baseMapLayers[k].default) {
      map.addLayer(bl);
    }
  }
  // Iterate through list of overlay layers and add to layer control
  for (k=0; k<config.overlayLayers.length; k++) {
    var oLayer;
    switch (config.overlayLayers[k].type) {
      case 'esri':
        oLayer = overlayLayers[config.overlayLayers[k].name] = esri.featureLayer(config.overlayLayers[k].options);
        if (config.overlayLayers[k].isTownshipAndRange) {
            setUpTownshipAndRangeLabels(oLayer);
        }
        break;
      case 'geojson':
        oLayer = overlayLayers[config.overlayLayers[k].name] = L.geoJson();
        (function(l, s) {
          $.getJSON(config.overlayLayers[k].url, function(data) {
            l.addData(data);
            l.setStyle(s);
          });
        })(oLayer, config.overlayLayers[k].style);
        break;
      default:
        oLayer = overlayLayers[config.overlayLayers[k].name] = L.tileLayerPixelFilter(config.overlayLayers[k].url, config.overlayLayers[k].options);
      }
      if (config.overlayLayers[k].checked) {
        map.addLayer(oLayer);
      }
    }

  layersControl = L.control.layers(baseMaps, overlayLayers, {position: 'topleft', collapsed: true}).addTo(map);
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
    this._div.innerHTML = '<a id="aboutControl" style="font-size: x-large; font-weight: bold;" href="#" title="About">&#9432;</a>';
    return this._div;
  };
  aboutControl.addTo(map);

  $('#aboutControl').click(function() {
    map.fire('modal', {
      content: aboutModal({version: config.versionString, lastUpdated: config.dataLastUpdated})
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
    map.flyToBounds(resetViewBounds);
    return false;
  });
}

function highlightFeature(e) {

  // Not great but the best I can do rigth now to distinguish mutiple features click thrus vs a separate click altogether
  if ((e.originalEvent.timeStamp - lastLayerEventTimeStamp) > 20) {
    resetHighlight();
  }
  var id = e.layer.properties.assignedId;

  var sortDate = (new Date(timberHarvestSelectData[id].dateCompleted)).toISOString();
  if (sortDate.substring(0, 4) === config.DATE_NOT_AVAILABLE) {
    sortDate = 'N/A';
  }

  var content = infoContentItem({
    projectName: (timberHarvestSelectData[id].projectName ? timberHarvestSelectData[id].projectName : 'N/A'),
    loggingActivity: timberHarvestSelectData[id].loggingActivity.replace(/ *\([^)]*\) */g, ''),
    acres: timberHarvestSelectData[id].GIS_ACRES.toLocaleString(window.navigator.language, {maximumFractionDigits: 0}),
    datePlanned: (timberHarvestSelectData[id].datePlanned.substr(0,4) === config.DATE_NA) ? 'N/A' : (new Date(timberHarvestSelectData[id].datePlanned).toLocaleDateString()),
    dateContracted: (timberHarvestSelectData[id].dateContracted.substring(0, 4) === config.DATE_NOT_AVAILABLE) ? 'N/A' : (new Date(timberHarvestSelectData[id].dateContracted).toLocaleDateString()),
    dateCompleted: (timberHarvestSelectData[id].dateCompleted.substring(0, 4) === config.DATE_NOT_AVAILABLE) ? 'N/A' : (new Date(timberHarvestSelectData[id].dateCompleted).toLocaleDateString()),
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

  var style = Object.assign({}, getTimberHarvestFeatureStyle(e.layer.properties.assignedId), config.highlightedTimberHarvestFeatureStyle);
  timberHarvestPbfLayer.setFeatureStyle(e.layer.properties.assignedId, style);
}

function resetHighlight() {
  highlightedFeatures.forEach(function(highlightedFeature) {
    timberHarvestPbfLayer.resetFeatureStyle(highlightedFeature);
  });
  $('#infoContent').empty();
  highlightedFeatures = [];
}

function showFeaturesForRange() {
  fromYear = Math.round(dateRangeSlider.getInfo().left);
  toYear = Math.round(dateRangeSlider.getInfo().right);
  $('#fromLabel').text(fromYear);
  $('#toLabel').text(toYear);
  updateFeatureStyling();
}

function updateFeatureStyling() {
  if (isFedcuts) {
    timberHarvestPbfLayer.redraw();
  } else {
    timberHarvestSelectData.forEach(function(s, idx) {
      timberHarvestPbfLayer.resetFeatureStyle(idx);
    });
  }
}

function setUpPlaybackControl() {
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
}

function setUpSlideHandlers() {

  dateRangeSlider.subscribe('stop', function() {
    NProgress.remove();
    utils.resetPlaybackControl();
    showFeaturesForRange();
  });

  dateRangeSlider.subscribe('start', function() {
    NProgress.remove();
    utils.resetPlaybackControl();
  });

  dateRangeSlider.subscribe('moving', function(rangeValues) {
    $('#fromLabel').text(Math.round(rangeValues.left));
    $('#toLabel').text(Math.round(rangeValues.right));
  });

  opacitySlider.subscribe('stop', function() {
    updateFeatureStyling();
  });

  opacitySlider.subscribe('moving', function(tValue) {
    $('#opacityLabel').text(Math.round(tValue.right));
  });
}

function applytimberHarvestLayerStyle(p) {

  var refYear = timberHarvestSelectData[p.assignedId].refYear;

  if ((refYear >= fromYear) && (refYear <= toYear)) {
    return getTimberHarvestFeatureStyle(p.assignedId);
  }

  return {weight:0, fill: false};
}

function getTimberHarvestFeatureStyle(id) {
  var style = config.timberHarvestStyle;
  style.fillOpacity = (Math.round(opacitySlider.getInfo().right)) / 100;
  style.color = config.loggingTypeLegend[timberHarvestSelectData[id].loggingType].color;
  style.fillColor = style.color;

  return style;
}

// Consider doing the below in the data processing pipeline instead
function harmonizeTimberHarvestSelectData(areaType) {
  var minYear = config.dateRangeSliderOptions.max;

  timberHarvestSelectData.forEach(function(s, idx) {

    switch (areaType) {
      case 'blm':
        timberHarvestSelectData[idx].projectName = s.TRT_NAME;
        timberHarvestSelectData[idx].loggingActivity = s.HARV_RX;
        timberHarvestSelectData[idx].datePlanned = config.DATE_NA;
        timberHarvestSelectData[idx].dateContracted = (timberHarvestSelectData[idx].dateContracted) ? (s.SALE_DATE.substr(0,4) + '-' + s.SALE_DATE.substr(4,2) + '-' + s.SALE_DATE.substr(6,2)) : config.DATE_NOT_AVAILABLE;
        timberHarvestSelectData[idx].dateCompleted = s.TRT_DATE.substr(0,4) + '-' + s.TRT_DATE.substr(4,2) + '-' + s.TRT_DATE.substr(6,2);
        timberHarvestSelectData[idx].dateCompleted = timberHarvestSelectData[idx].dateCompleted.replace(/(-)+$/, '');
        timberHarvestSelectData[idx].refYear = (new Date(s.TRT_DATE.substr(0,4))).getFullYear(); // TODO: Review this
        timberHarvestSelectData[idx].loggingType = s.HARV_RX ? config.treatmentTypeDecode[s.HARV_RX] : 'other';
        break;
      default: // Deafult is National Forest
        timberHarvestSelectData[idx].projectName = s.SALE_NAME;
        timberHarvestSelectData[idx].loggingActivity = s.ACTIVITY_N;
        timberHarvestSelectData[idx].datePlanned = s.DATE_PLANN;
        timberHarvestSelectData[idx].dateContracted = s.DATE_ACCOM;
        timberHarvestSelectData[idx].dateCompleted = s.DATE_COMPL;

        if (s.DATE_COMPL.substring(0, 4) === config.DATE_NOT_AVAILABLE) {
          if (s.DATE_ACCOM.substring(0, 4) === config.DATE_NOT_AVAILABLE) {
            timberHarvestSelectData[idx].refYear = (new Date(s.DATE_PLANN)).getFullYear();
          } else {
            timberHarvestSelectData[idx].refYear = (new Date(s.DATE_ACCOM)).getFullYear();
          }
        } else {
          timberHarvestSelectData[idx].refYear = (new Date(s.DATE_COMPL)).getFullYear();
        }
        timberHarvestSelectData[idx].loggingType = config.activityDecode[config.activityCodeTypes[s.ACTIVITY_2]];
        break;
    }

    minYear = Math.min(timberHarvestSelectData[idx].refYear, minYear);
  });

  dateRangeSlider.move({left: minYear, right: config.dateRangeSliderOptions.max}, true);
}

function displaytimberHarvestPbfLayer(area){

  $.getJSON(config.timberHarvestLayer.baseUrl + area + config.infoFileName, function(data) {

    timberHarvestSelectData = data;

    harmonizeTimberHarvestSelectData(config.areas[area].type);

    config.timberHarvestLayer.options.rendererFactory = L.svg.tile;
    config.timberHarvestLayer.options.vectorTileLayerStyles.timberharvest = applytimberHarvestLayerStyle;
    var url = config.timberHarvestLayer.baseUrl + area + config.timberHarvestLayer.tileScheme;
    timberHarvestPbfLayer = L.vectorGrid.protobuf(url, config.timberHarvestLayer.options).addTo(map);

    timberHarvestPbfLayer.on({
      click: function (e) {
        lastLayerEventTimeStamp = e.originalEvent.timeStamp;
        highlightFeature(e);
      },
      loading: function() {
        spinner.spin($('#spinner')[0]);
      },
      load: function () {
        spinner.stop();
      }
    });

    showFeaturesForRange();

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

function applyFedcutsLayerStyle() {
  config.fedcutsStyle.fillOpacity = (Math.round(opacitySlider.getInfo().right)) / 100;
  return config.fedcutsStyle;
}

function displayFedcutsPbfLayer(area){
  var url = config.fedcutsLayer.baseUrl + area + config.fedcutsLayer.tileScheme;
  config.fedcutsLayer.options.rendererFactory = L.canvas.tile;
  config.fedcutsLayer.options.vectorTileLayerStyles.fedcuts = applyFedcutsLayerStyle;
  timberHarvestPbfLayer = L.vectorGrid.protobuf(url, config.fedcutsLayer.options).addTo(map);
  timberHarvestPbfLayer.on({
    loading: function() {
      spinner.spin($('#spinner')[0]);
    },
    load: function () {
      spinner.stop();
    }
  });

}

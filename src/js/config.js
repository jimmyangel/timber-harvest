'use strict';

export var config = {
  versionString: 'v0.0.3<sup>Alpha</sup>',
  baseMapLayers: [
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxZoom: 19,
        attribution: 'Tiles © Esri — Source: <a href="http://www.arcgis.com/home/item.html?id=30e5fe3149c34df1ba922e6f5bbf808f">ArcGIS World Topographic Map</a>'
      },
      name: 'World Topographic Map',
      default: true
    },
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxZoom: 19,
        attribution: 'Tiles © Esri — Source: <a href="http://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9">ArcGIS World Imagery</a>'
      },
      name: 'World Imagery'
    },
    {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      },
      name: 'OpenStreetMap'
    },
    {
      url: 'https://a.tiles.mapbox.com/v4/mapbox.landsat-live/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiamltbXlhbmdlbCIsImEiOiJjaW5sMGR0cDkweXN2dHZseXl6OWM4YnloIn0.v2Sv_ODztWuLuk78rUoiqg',
      options: {
        tileSize: 256,
        maxZoom: 12,
        attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox Landsat Live</a>'
      },
      name: 'Landsat Live'
    },
    {
      url: 'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg',
      options: {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.'
      },
      name: '<span id="topLevel">Terrain Background</span>'
    }
  ],
  overlayLayers: [
    {
      options: {
        url: 'https://gis.blm.gov/arcgis/rest/services/Cadastral/BLM_Natl_PLSS_CadNSDI/MapServer/1',
        style: function() {
          return {
            color: 'grey',
            fill: false
          }
        },
        minZoom: 11,
        opacity: 0.8,
        interactive: false,
        pane: 'trgrid'
      },
      color: '#FB3231',
      name: 'Township and Range Grid',
      isTownshipAndRange: true,
      type: 'esri'
    },
    {
      url: 'https://stable-data.oregonhowl.org/oregon/oregon.json',
      name: 'State boundary',
      type: 'geojson',
      style: {
        weight: 4,
        opacity: 0.5,
        color: 'black',
        fill: false
      }
    },
    {
      url: 'https://tiles.oregonhowl.org/unharvested/willamette/{z}/{x}/{y}.pbf',
      options: {
        vectorTileLayerStyles: {
          vegetation: {
            weight: 1,
            opacity: 1,
            color: '#009E73',
            fillColor: '#009E73',
            fillOpacity: 0.7,
            fill: true,
            className: 'vegetation'
          }
        },
        interactive: true,
        pane: 'mainpane',
        maxNativeZoom: 14,
        minNativeZoom: 9
      },
      color: '#009E73',
      get name () {
        return '<span class="overlay-legend-item" style="background: ' + this.color + ';"></span> Unharvested Forest Land'
      },
      type: 'vectorgrid'
    }
  ],
  oregonBbox: [
    [41.9918, -124.7035],
    [46.2991, -116.4635]
  ],
  dataPath: {
    baseUrl: 'https://tiles.oregonhowl.org/timber-harvest/',
    infoFileName: '/timber-or-s-info.json'
  },
  forests: {
    willamette: {
      name: 'Willamette National Forest'
    }/*,
    deschutes: {
      name: 'Deschutes National Forest'
    }*/
  },
  timberHarvestLayer: {
    baseUrl: 'https://tiles.oregonhowl.org/timber-harvest/',
    tileScheme: '/{z}/{x}/{y}.pbf',
    options: {
      vectorTileLayerStyles: {
        timberharvest: {
          weight: 1,
          opacity: 1,
          color: '#d55e00',
          dashArray: '3',
          fillOpacity: 0.7,
          fillColor: '#d55e00',
          fill: true
        }
      },
      zIndex: 10,
      interactive: true,
      pane: 'mainpane',
      maxNativeZoom: 14,
      minNativeZoom: 9,
      getFeatureId: function(f) {
        return f.properties.assignedId;
      }
    },
    highlightedFeatureStyle: {
      weight: 3,
      opacity: 1,
      color: 'black',
      dashArray: '3',
      fillOpacity: 0.7,
      fillColor: '#d55e00',
      fill: true
    }
  },
  spinnerOpts: {
    color: '#939393',
    opacity: 0.1,
    shadow: true
  },
  treeSizeClass: {
    0.0: 'N/A',
    1.0: 'Seedlings',
    1.5: 'Seedlings and saplings mixed',
    2.0: 'Saplings, trees 1.0 to 4.9 inches DBH',
    2.5: 'Saplings and poles mixed',
    3.0: 'Poles, trees 5.0 to 8.9 inches DBH',
    3.5: 'Poles and small trees mixed',
    4.0: 'Small trees, 9.0 to 20.9 inches DBH',
    4.5: 'Small trees and medium trees mixed',
    5.0: 'Medium trees, 21.0 to 31.9 inches DBH',
    5.5: 'Medium trees and large trees mixed',
    6.0: 'Large trees, 32.0 to 47.9 inches DBH',
    6.5: 'Large trees and giant trees mixed',
    7.0: 'Giant trees, 48.0 or greater inches DBH',
    9.9: 'Trees 21.0 inches DBH and larger'
  },
  dateRangeSliderOptions: {
      isDate: false,
      min: 1900,
      max: 2018,
      start: 1900,
      end: 2018,
      overlap: true
  },
  opacitySliderOptions: {
      isDate: false,
      isOneWay: true,
      min: 0,
      max: 100,
      start: 70
  },
  forestBoundaryStyle: {
    fillColor: '#E5D499',
    fillOpacity: 0,
    color: '#562700',
    opacity: 1,
    weight: 3
  }
}

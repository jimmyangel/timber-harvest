'use strict';

export var config = {
  versionString: 'v0.2.1<sup>Beta</sup>',
  dataLastUpdated: 'April 23, 2018',
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
      url: 'https://gis.blm.gov/arcgis/rest/services/lands/BLM_Natl_SMA_Cached_BLM_Only/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxZoom: 18,
        opacity: 0.5,
        attribution: 'Bureau of Land Management',
        matchRGBA: [ 150,  128,  150, 255  ],
        missRGBA:  null,
        pixelCodes: [ [254, 230, 121], [254, 230, 122] ]
      },
      color: 'rgba(150, 128, 150, 0.5)',
      get name () {
        return '<span class="overlay-legend-item" style="background: ' + this.color + ';"></span> BLM Land'
      },
      type: 'tile'
    }
     /*,
    {
      url: 'https://tiles.oregonhowl.org/clearcuts/{z}/{x}/{y}.png',
      options: {
        maxZoom: 18,
        attribution: 'Oregon Wild'
      },
      name: 'Clearcuts on Federal Lands',
      type: 'tile'
    } */
  ],
  oregonBbox: [
    [41.9918, -124.7035],
    [46.2991, -116.4635]
  ],
  dataPath: {
    baseUrl: 'http://localhost:9090/',
    infoFileName: '/timber-or-s-info.json'
  },
  areas: {
    willamette: {
      name: 'Willamette National Forest',
      hasUnharvestedLayer: true
    },
    deschutes: {
      name: 'Deschutes National Forest'
    },
    'fremont-winema': {
      name: 'Fremont-Winema National Forest'
    },
    umpqua: {
      name: 'Umpqua National Forest'
    },
    mounthood: {
      name: 'Mount Hood National Forest',
      underreported: true
    },
    'rogueriver-siskiyou': {
      name: 'Rogue River-Siskiyou National Forest'
    },
    siuslaw: {
      name: 'Siuslaw National Forest',
      underreported: true
    },
    ochoco: {
      name: 'Ochoco National Forest'
    },
    'wallowa-whitman': {
      name: 'Wallowa Whitman National Forest'
    },
    malheur: {
      name: 'Malheur National Forest'
    },
    umatilla: {
      name: 'Umatilla National Forest'
    },
    roseburg: {
      name: 'BLM Roseburg District Office',
      type: 'blm',
      overrideSignPosition: [43.4449, -123.3160]
    },
    northwestoregon: {
      name: 'BLM Northwest Oregon District Office',
      type: 'blm',
      overrideSignPosition: [44.9356, -123.0441]
    },
    coosbay: {
      name: 'BLM Coos Bay District Office',
      type: 'blm'
    },
    medford: {
      name: 'BLM Medford District Office',
      type: 'blm',
      overrideSignPosition: [42.5085, -122.3876]
    },
    lakeview: {
      name: 'BLM Lakeview District Office',
      type: 'blm',
      overrideSignPosition: [43.2061, -120.1849]
    },
    burns: {
      name: 'BLM Burns District Office',
      type: 'blm'
    },
    vale: {
      name: 'BLM Vale District Office',
      type: 'blm'
    },
    prineville: {
      name: 'BLM Prineville District Office',
      type: 'blm',
      overrideSignPosition: [44.9482, -120.5708]
    }
  },
  topLevelDataPath: {
    baseUrl: 'http://localhost:8080/data/areas/',
    //baseUrl: 'https://stable-data.oregonhowl.org/oregon/nationalforests/',
    areaCartoonsFileName: 'areacartoons.json',
    areaIconSuffix: '.png'
  },
  timberHarvestLayer: {
    baseUrl: 'http://localhost:9090/',
    tileScheme: '/{z}/{x}/{y}.pbf',
    options: {
      vectorTileLayerStyles: {
        timberharvest: {}
      },
      attribution: 'USDA National Forest Service',
      zIndex: 10,
      interactive: true,
      pane: 'mainpane',
      maxNativeZoom: 14,
      minNativeZoom: 9,
      getFeatureId: function(f) {
        return f.properties.assignedId;
      }
    }
  },
  timberHarvestStyle: {
    weight: 0,
    opacity: 1,
    color: '#d55e00',
    dashArray: '3',
    fillOpacity: 0.7,
    fillColor: '#d55e00',
    fill: true
  },
  highlightedTimberHarvestFeatureStyle: {
    weight: 3,
    opacity: 1,
    color: 'black'
  },
  unharvestedOverlayLayer: {
    baseUrl: 'https://tiles.oregonhowl.org/unharvested/',
    tileScheme: '/{z}/{x}/{y}.pbf',
    options: {
      vectorTileLayerStyles: {
        vegetation: {
          weight: 0,
          opacity: 0,
          color: '#009E73',
          fillColor: '#009E73',
          fillOpacity: 0.7,
          fill: true,
          className: 'vegetation'
        }
      },
      attribution: 'USDA National Forest Service',
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
  },
  fedcutsLayer: {
    baseUrl: 'https://tiles.oregonhowl.org/timber-harvest/fedcuts-vtiles/',
    tileScheme: '/{z}/{x}/{y}.pbf',
    options: {
      vectorTileLayerStyles: {
        fedcuts: {}
      },
      attribution: 'Oregon Wild',
      zIndex: 10,
      pane: 'mainpane',
      maxNativeZoom: 14,
      minNativeZoom: 9
    }
  },
  fedcutsStyle: {
    weight: 0,
    opacity: 0,
    color: '#9300d5',
    fillColor: '#9300d5',
    fillOpacity: 0.7,
    fill: true
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
  activityCodeTypes: {
    '4101': 0, // Clearcut
    '4102': 0,
    '4111': 0,
    '4113': 0,
    '4121': 0,
    '4131': 0,
    '4132': 0,
    '4141': 0,
    '4142': 0,
    '4143': 0,
    '4145': 0,
    '4146': 0,
    '4148': 1, // Thinning
    '4151': 1,
    '4152': 1,
    '4162': 0,
    '4175': 0,
    '4177': 0,
    '4183': 0,
    '4192': 1,
    '4193': 0,
    '4194': 0,
    '4196': 0,
    '4210': 1,
    '4211': 2, // Other
    '4220': 1,
    '4231': 0,
    '4232': 0,
    '4242': 2
  },
  activityDecode: ['clearcut', 'thinning', 'other'],
  treatmentTypeDecode: {
    'Clearcut': 'clearcut',
    'Patch Cut': 'clearcut',
    'Regeneration': 'clearcut',
    'Selective Cut': 'thinning',
    'Variable Density Thin': 'thinning',
    'Thin': 'thinning',
    'Unknown': 'other'
  },
  loggingTypeLegend: {
    clearcut: {
      color: '#BA3100',
      text: 'Clearcut'
    },
    thinning: {
      color: '#F1C40F',
      text: 'Thinning'
    },
    other: {
      color: 'grey',
      text: 'Other'
    }
  },
  dateRangeSliderOptions: {
      isDate: false,
      min: 1900,
      get max () {return (new Date()).getFullYear()},
      start: 1900,
      get end () {return (new Date()).getFullYear()},
      overlap: true
  },
  DATE_NOT_AVAILABLE: '1899',
  DATE_NA: '1900',
  defaultOpacity: 70,
  opacitySliderOptions: {
      isDate: false,
      isOneWay: true,
      min: 0,
      max: 100
  },
  areaBoundaryStyle: {
    fillColor: '#E5D499',
    fillOpacity: 0,
    color: '#562700',
    opacity: 1,
    weight: 3
  },
  stripesStyleOptions: {
    angle: -45,
    color: 'grey',
    //spaceColor: '#BA4A00',
    height: 10,
    weight: 2,
    //spaceWeight: 1,
    //spaceOpacity: 0.7
  },
  comingSoonMsg: 'Coming soon...',
  underreportedMsg: '<div style="color: maroon; text-align: center;"><b>Not Available</b><br>Logging data severely<br>underreported in this forest</div>'
}

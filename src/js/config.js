'use strict';

export var config = {
  versionString: 'v0.0.2<sup>Alpha</sup>',
  baseMapLayers: [
    {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
      options: {
        maxZoom: 19,
        attribution: 'Tiles © Esri — Source: <a href="http://www.arcgis.com/home/item.html?id=30e5fe3149c34df1ba922e6f5bbf808f">ArcGIS World Topographic Map</a>'
      },
      name: 'World Topographic Map'
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
        layers: [1],
        opacity: 0.8,
        pane: 'trgrid'
      },
      color: '#FB3231',
      name: 'Township and Range Grid',
      isTownshipAndRange: true,
      type: 'esri'
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
            fill: true
          }
        },
        pane: 'overlayPane',
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
  dataPaths: {
    willamette: 'data/timber-harvest-willamette-nf.json'
  },
  styles: {
    featureStyle: {
      weight: 1,
      opacity: 1,
      color: '#d55e00',
      dashArray: '3',
      fillOpacity: 0.7,
      fillColor: '#d55e00'
    },
    highlightedFeatureStyle: {
      color: 'gray',
      weight: 3
    }
  },
  spinnerOpts : {
    color: '#939393',
    opacity: 0.1,
    shadow: true
  }
}

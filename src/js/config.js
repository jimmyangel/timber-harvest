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
    }
  ],
  overlayLayers: [
    {
      options: {
        url: 'https://gis.blm.gov/arcgis/rest/services/Cadastral/BLM_Natl_PLSS_CadNSDI/MapServer',
        layers: [1],
        opacity: 0.8,
        pane: 'trgrid'
      },
      name: 'Township and Range Grid',
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
      name: 'Unharvested Forest Land',
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

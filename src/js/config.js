'use strict';

export var config = {
  versionString: 'v0.0.1<sup>Alpha</sup>',
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
        url: 'https://gis.blm.gov/orarcgis/rest/services/Land_Status/BLM_OR_PLSS/MapServer',
        layers: [2],
        opacity: 0.8,
        pane: 'trgrid'
      },
      name: 'Township and Range Grid'
    }
  ],
  dataPaths: {
    willamette: 'data/timber-harvest-willamette-nf.json'
  },
  styles: {
    featureStyle: {
      weight: 0,
      opacity: 1,
      color: 'gray',
      dashArray: '3',
      fillOpacity: 0.7,
      fillColor: '#FF0000'
    },
    highlightedFeatureStyle: {
      weight: 3
    }
  }
}

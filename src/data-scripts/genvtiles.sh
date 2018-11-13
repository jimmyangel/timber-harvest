#!/bin/bash

# Generate vector tiles for National Forests
nfshorts=(ochoco umatilla malheur wallowa-whitman siuslaw rogueriver-siskiyou mounthood umpqua fremont-winema deschutes willamette)
nfnames=(
  "Ochoco National Forest"
  "Umatilla National Forest"
  "Malheur National Forest"
  "Wallowa Whitman National Forest"
  "Siuslaw National Forest"
  "Rogue River-Siskiyou National Forest"
  "Mt Hood National Forest"
  "Umpqua National Forest"
  "Fremont-Winema National Forests"
  "Deschutes National Forest"
  "Willamette National Forest"
)
for i in "${!nfshorts[@]}"
do
  nfname=${nfnames[$i]}
  nfshort=${nfshorts[$i]}
  echo "Working on: $nfshort"

  thing="'ADMIN_FO_1 === \"$nfname\"'"
  ./ms.sh -i USATimberHarvest/S_USA.Activity_TimberHarvest.shp -filter "${thing}" -filter-fields ADMIN_FO_1,SALE_NAME,ACTIVITY_2,ACTIVITY_N,DATE_PLANN,DATE_ACCOM,DATE_COMPL,GIS_ACRES -verbose -o format=geojson precision=0.0001 timber-or.json

  mapshaper timber-or.json -each 'assignedId=this.id' -simplify 30% visvalingam keep-shapes -o format=geojson timber-or-s.json

  tippecanoe --layer=timberharvest --name=timberharvest --no-tile-compression --minimum-zoom=9 --maximum-zoom=14 --include=assignedId --simplification=20 --simplify-only-low-zooms --output-to-directory vtiles/$nfshort timber-or-s.json

  mapshaper timber-or-s.json -filter-fields assignedId,SALE_NAME,ACTIVITY_2,ACTIVITY_N,DATE_PLANN,DATE_ACCOM,DATE_COMPL,GIS_ACRES timber-or-s.json -o format=json vtiles/$nfshort/timber-or-s-info.json
done

# Generate vector tiles for BLM districts
blmcodes=(ORN ORM ORC ORR ORL ORB ORV ORP)
blmnames=(northwestoregon medford coosbay roseburg lakeview burns vale prineville)

for i in "${!blmnames[@]}"
do
  blmname=${blmnames[$i]}
  blmcode=${blmcodes[$i]}
  echo "Working on: $blmname"

  mapshaper -i BLM_logging/BLM_logging.shp -filter '(TRT_DATE != "") && ('\"$blmcode\"'.indexOf(BLM_ORG_CD.substr(0,3)) > -1)' -filter-fields BLM_ORG_CD,TRT_NAME,HARV_RX,TRT_DATE,SALE_DATE,GIS_ACRES -verbose -o format=geojson precision=0.0001 blm-timber-or.json

  mapshaper blm-timber-or.json -each 'assignedId=this.id' -simplify 30% visvalingam keep-shapes -o format=geojson blm-timber-or-s.json

  tippecanoe --layer=timberharvest --name=timberharvest --no-tile-compression --minimum-zoom=9 --maximum-zoom=14 --include=assignedId --simplification=20 --simplify-only-low-zooms --output-to-directory vtiles/$blmname blm-timber-or-s.json

  mapshaper blm-timber-or-s.json -filter-fields assignedId,BLM_ORG_CD,TRT_NAME,HARV_RX,TRT_DATE,SALE_DATE,GIS_ACRES -o format=json vtiles/$blmname/timber-or-s-info.json
done

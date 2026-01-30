
Chronos Weaver is a **Static Site Generator (SSG)** tailored for Digital Humanities. It bridges the gap between raw spreadsheet data and immersive narrative. You provide the historical evidence (CSV), we provide the interactive loom.

## Run Locally

**Prerequisites:**  Node.js

Download and install Node for your machine. Then, download and unzip (or git clone) this repository. Open the folder in your terminal or command prompt.

1. Install dependencies:
   `npm install`
3. Run the app:
   `npm run dev`


The generator will be available at localhost:3000 in your browser. Configure appropriately, hit the 'generate' button, and you'll get a zipped file with a static site ready to go.

## Your Data

Your CSV must have a header row. While header names are flexible, follow these guidelines for the best results:

+ **ID**

+ **Unique Identifier**: Useful for connecting nodes in Network Views.
    
+ **Labels**: Names of people, places, or events. Used as primary text in tooltips.
    

+ **Temporal**: Years should be numeric (e.g., `1250`). Standard ISO dates also work.
    

+**Geospatial**: Use decimal coordinates (e.g., Lat `39.65`, Lng `66.97`).

Example data:

```
id,label,date,lat,lng,category,connections
S1,Samarkand,1210,39.65,66.97,Hub,"S2,S4"
S2,Dunhuang,1225,40.14,94.66,Hub,S1
```

Thus, for networks, S1 is connected to S2, S4. Yes, I should probably figure out loading in a separate edges.csv. Someday.

## Mapping

Mapping uses leaflet. If you want to have a historical map as base map (ie, from MapWarper), modify MapView.tsx and add the url:

```
  const tileLayers = {
    terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    toner: 'https://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    voyager: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
  };

 const attributions = {
    terrain: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    toner: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
    satellite: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community',
    voyager: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  };
```

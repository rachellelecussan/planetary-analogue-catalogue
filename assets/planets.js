// Map layers for the side-by-side comparison on each site page.
// All planetary tiles are free and keyless (NASA Solar System Treks, USGS). Tested October 2026.
(function () {
  const TREK = (body, id, ext) => `https://trek.nasa.gov/tiles/${body}/EQ/${id}/1.0.0/default/default028mm/{z}/{y}/{x}.${ext}`;
  const NASA = 'NASA Solar System Treks';

  const EARTH = {
    bases: [
      { key: 'satellite', name: 'Satellite', url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg', maxNative: 15,
        attribution: '<a href="https://s2maps.eu">Sentinel-2 cloudless</a> by EOX IT Services GmbH (contains modified Copernicus Sentinel data)' },
      { key: 'outline', name: 'Outline', outline: true }
    ],
    overlays: [
      { key: 'geology', name: 'Geology', url: 'https://tiles.macrostrat.org/carto/{z}/{x}/{y}.png', opacity: 0.65, maxNative: 14,
        attribution: 'Geology: <a href="https://macrostrat.org">Macrostrat</a> (CC BY 4.0)',
        legend: 'Colours show rock units by type and age. Click the map to see the rock at that spot.' },
      { key: 'names', name: 'Place names', url: 'https://tiles.maps.eox.at/wmts/1.0.0/overlay_bright_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.png', maxNative: 16,
        attribution: 'Labels &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, rendering EOX' }
    ]
  };

  const BODIES = {
    Mars: {
      fallback: 'assets/planets/mars.jpg',
      radius: 3396.19,
      bases: [
        { key: 'colour', name: 'Colour', url: TREK('Mars', 'Mars_Viking_MDIM21_ClrMosaic_global_232m', 'jpg'), maxNative: 7, attribution: `Viking MDIM 2.1 colour mosaic: NASA/USGS via ${NASA}` },
        { key: 'detail', name: 'High detail', url: 'https://astro.arcgis.com/arcgis/rest/services/OnMars/CTX/MapServer/tile/{z}/{y}/{x}', tileSize: 512, zoomOffset: -1, maxNative: 13,
          attribution: 'CTX global mosaic: NASA/JPL/MSSS/The Murray Lab, hosted by Esri' },
        { key: 'elevation', name: 'Elevation', url: TREK('Mars', 'Mars_MOLA_blend200ppx_HRSC_ClrShade_clon0dd_200mpp_lzw', 'jpg'), maxNative: 8,
          attribution: `MOLA (NASA/GSFC) and HRSC (ESA/DLR/FU Berlin) elevation via ${NASA}`, legend: 'Blue is low, red and white are high.' }
      ],
      geology: { name: 'Geology', url: 'https://trek.nasa.gov/mars/trekarcgis/rest/services/SIM3292_Global_Geology/MapServer/WMTS/tile/1.0.0/SIM3292_Global_Geology/default/default028mm/{z}/{y}/{x}.png',
        maxNative: 7, opacity: 0.6, attribution: 'Geologic Map of Mars, USGS SIM 3292 (Tanaka et al. 2014)', legend: 'Colours show geological units by age: Noachian (oldest) to Amazonian (youngest).' },
      minerals: [
        { key: 'aqueous', name: 'Water-formed minerals (detections)', vector: 'data/planets/mars_aqueous.geojson', field: 'class',
          colours: { phyllosilicate: '#2E86DE', sulfate: '#F1C40F', silica: '#9B59B6', chloride: '#27AE60', carbonate: '#E67E22' },
          attribution: `Aqueous mineral detections (CRISM and OMEGA) via ${NASA}`,
          legend: 'Each dot is an orbital detection of a mineral that forms with water.' },
        { key: 'chloride', name: 'Chloride salt deposits', vector: 'data/planets/mars_chloride.geojson', colour: '#27AE60',
          attribution: `Chloride-bearing materials from THEMIS (Osterloo et al.) via ${NASA}`, legend: 'Green areas are salt deposits left by evaporating water.' },
        { key: 'pyroxene', name: 'Pyroxene abundance (TES)', url: TREK('Mars', 'TES_Clinopyroxene', 'png'), maxNative: 1, opacity: 0.75,
          attribution: `MGS TES mineral map via ${NASA}`, legend: 'Warmer colours mean more high-calcium pyroxene (a volcanic mineral). Coarse, global data.' },
        { key: 'plagioclase', name: 'Plagioclase abundance (TES)', url: TREK('Mars', 'TES_Plagioclase', 'png'), maxNative: 1, opacity: 0.75,
          attribution: `MGS TES mineral map via ${NASA}`, legend: 'Warmer colours mean more plagioclase feldspar. Coarse, global data.' },
        { key: 'glass', name: 'Clay and glass abundance (TES)', url: TREK('Mars', 'TES_Glass_Clay', 'png'), maxNative: 1, opacity: 0.75,
          attribution: `MGS TES mineral map via ${NASA}`, legend: 'Warmer colours mean more sheet silicates or volcanic glass, signs of alteration. Coarse, global data.' }
      ]
    },
    Moon: {
      fallback: 'assets/planets/moon.jpg',
      radius: 1737.4,
      bases: [
        { key: 'colour', name: 'Surface', url: TREK('Moon', 'LRO_WAC_Mosaic_Global_303ppd_v02', 'jpg'), maxNative: 8, attribution: `LRO WAC mosaic: NASA/GSFC/Arizona State University via ${NASA}` },
        { key: 'elevation', name: 'Elevation', url: TREK('Moon', 'LRO_LOLA_ClrShade_Global_128ppd_v04', 'png'), maxNative: 5,
          extra: { url: TREK('Moon', 'LRO_LOLAKaguya_ClrHillshade_60N60S_512ppd', 'png'), maxNative: 10, bounds: [[-60, -180], [60, 180]] },
          attribution: `LRO LOLA (NASA/GSFC) and Kaguya TC (JAXA) elevation via ${NASA}`, legend: 'Blue and purple are low, red and white are high.' }
      ],
      geology: { name: 'Geology', url: TREK('Moon', 'Unified_Geologic_Map_of_the_Moon_RASTER', 'png'), maxNative: 5, opacity: 0.6,
        attribution: 'Unified Geologic Map of the Moon (Fortezzo et al. 2020, USGS)', legend: 'Colours show geological units, such as mare basalts, highlands and crater materials.' },
      minerals: [
        { key: 'feo', name: 'Iron oxide, FeO (Clementine)', url: TREK('Moon', 'Clem_UVVIS_FeO_Clr_Global_152ppd', 'png'), maxNative: 6, opacity: 0.75,
          attribution: `Clementine UVVIS FeO map via ${NASA}`, legend: 'Blue is low iron (highlands), red is high iron (mare basalts).' },
        { key: 'tio2', name: 'Titanium oxide, TiO2 (Clementine)', url: TREK('Moon', 'Clem_UVVIS_TiO2_Clr_Global_152ppd', 'png'), maxNative: 6, opacity: 0.75,
          attribution: `Clementine UVVIS TiO2 map via ${NASA}`, legend: 'Blue is low titanium, red is titanium-rich basalt.' },
        { key: 'ratio', name: 'Colour ratio (composition)', url: TREK('Moon', 'Lunar_Clementine_UVVIS_Warp_ClrRatio_Global_200m', 'png'), maxNative: 7, opacity: 0.85,
          attribution: `Clementine UVVIS colour-ratio mosaic via ${NASA}`, legend: 'Blue and orange mare differ in titanium; green and yellow areas are iron-rich, mafic minerals.' },
        { key: 'olivine', name: 'Olivine abundance (Kaguya)', url: TREK('Moon', 'Lunar_Kaguya_MIMap_MineralDeconv_OlivinePercent_50N50S_colorize', 'png'), maxNative: 1, opacity: 0.75,
          attribution: `Kaguya Multiband Imager (JAXA/SELENE) mineral map via ${NASA}`, legend: 'Warmer colours mean more olivine. Coarse, 50°S–50°N only.' }
      ]
    },
    Europa: {
      fallback: 'assets/planets/europa.jpg',
      radius: 1560.8,
      bases: [{ key: 'colour', name: 'Surface', url: TREK('Europa', 'Europa_Voyager_GalileoSSI_global_mosaic_500m', 'png'), maxNative: 5, attribution: `Voyager and Galileo SSI mosaic: NASA/JPL/USGS via ${NASA}` }],
      minerals: []
    },
    Enceladus: {
      fallback: 'assets/planets/enceladus.jpg',
      radius: 252.1,
      // Trek's Enceladus tiles are centred on 180°, so map positions are shifted by 180° of longitude
      lonOffset: 180,
      bases: [
        { key: 'colour', name: 'Colour', url: TREK('Enceladus', 'Enceladus_cyl_KH', 'jpg'), maxNative: 5, attribution: `Cassini ISS colour mosaic: NASA/JPL/Space Science Institute via ${NASA}` },
        { key: 'elevation', name: 'Relief', url: TREK('Enceladus', 'Cassini_ISS_ClrHillshade_375m_Global', 'png'), maxNative: 3, attribution: `Cassini ISS colour hillshade via ${NASA}` }
      ],
      minerals: []
    }
  };

  window.PAC_PLANETS = { EARTH, BODIES };
})();

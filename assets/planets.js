// Map layers for the side-by-side comparison on each site page.
// All planetary tiles are free and keyless (NASA Solar System Treks, USGS). Tested October 2026.
(function () {
  const TREK = (body, id, ext) => `https://trek.nasa.gov/tiles/${body}/EQ/${id}/1.0.0/default/default028mm/{z}/{y}/{x}.${ext}`;
  const NASA = 'NASA Solar System Treks';

  // Mars geologic units: colours and names from the USGS SIM 3292 GIS layer (Mars_Geology_feature_layer, ArcGIS Online)
  const MARS_GEOLOGY_KEY = [
    { code: 'AHi', rgb: [255,255,0], name: 'Amazonian and Hesperian impact unit' },
    { code: 'AHtu', rgb: [250,234,214], name: 'Amazonian and Hesperian transition undivided unit' },
    { code: 'AHv', rgb: [205,78,55], name: 'Amazonian and Hesperian volcanic' },
    { code: 'ANa', rgb: [204,173,0], name: 'Amazonian and Noachian apron unit' },
    { code: 'Aa', rgb: [255,217,0], name: 'Amazonian apron unit' },
    { code: 'Apu', rgb: [0,0,204], name: 'Amazonian polar undivided unit' },
    { code: 'Ap', rgb: [0,232,240], name: 'Amazonian polar unit' },
    { code: 'Ave', rgb: [204,54,0], name: 'Amazonian volcanic edifice' },
    { code: 'Av', rgb: [255,99,71], name: 'Amazonian volcanic unit' },
    { code: 'eAb', rgb: [153,255,255], name: 'Early Amazonian basin unit' },
    { code: 'eHb', rgb: [157,205,157], name: 'Early Hesperian basin unit' },
    { code: 'eHh', rgb: [239,213,184], name: 'Early Hesperian highland unit' },
    { code: 'eHt', rgb: [207,152,12], name: 'Early Hesperian transition unit' },
    { code: 'eHv', rgb: [138,102,138], name: 'Early Hesperian volcanic unit' },
    { code: 'eNhm', rgb: [132,139,139], name: 'Early Noachian highland massif unit' },
    { code: 'eNh', rgb: [139,69,19], name: 'Early Noachian highland unit' },
    { code: 'HNb', rgb: [105,140,105], name: 'Hesperian and Noachian basin unit' },
    { code: 'HNhu', rgb: [178,178,178], name: 'Hesperian and Noachian highland undivided unit' },
    { code: 'HNt', rgb: [205,189,112], name: 'Hesperian and Noachian transition unit' },
    { code: 'Hpe', rgb: [107,165,204], name: 'Hesperian polar edifice unit' },
    { code: 'Hpu', rgb: [154,178,230], name: 'Hesperian polar undivided unit' },
    { code: 'Hp', rgb: [0,133,138], name: 'Hesperian polar unit' },
    { code: 'Hto', rgb: [189,255,255], name: 'Hesperian transition outflow unit' },
    { code: 'Htu', rgb: [204,204,204], name: 'Hesperian transition undivided unit' },
    { code: 'Ht', rgb: [255,235,138], name: 'Hesperian transition unit' },
    { code: 'Hve', rgb: [255,0,0], name: 'Hesperian volcanic edifice unit' },
    { code: 'lAa', rgb: [138,117,0], name: 'Late Amazonian apron unit' },
    { code: 'lApc', rgb: [245,245,245], name: 'Late Amazonian polar cap unit' },
    { code: 'lApd', rgb: [255,227,179], name: 'Late Amazonian polar dunes unit' },
    { code: 'lAvf', rgb: [179,153,153], name: 'Late Amazonian volcanic field unit' },
    { code: 'lAv', rgb: [255,184,193], name: 'Late Amazonian volcanic unit' },
    { code: 'lHb', rgb: [81,138,138], name: 'Late Hesperian basin unit' },
    { code: 'lHl', rgb: [34,140,34], name: 'Late Hesperian lowland unit' },
    { code: 'lHt', rgb: [255,193,36], name: 'Late Hesperian transition unit' },
    { code: 'lHvf', rgb: [204,179,179], name: 'Late Hesperian volcanic field unit' },
    { code: 'lHv', rgb: [205,106,202], name: 'Late Hesperian volcanic unit' },
    { code: 'lNh', rgb: [205,171,126], name: 'Late Noachian highland unit' },
    { code: 'lNv', rgb: [83,26,137], name: 'Late Noachian volcanic unit' },
    { code: 'mAl', rgb: [106,140,34], name: 'Middle Amazonian lowland unit' },
    { code: 'mNhm', rgb: [193,205,205], name: 'Middle Noachian highland massif unit' },
    { code: 'mNh', rgb: [139,115,85], name: 'Middle Noachian highland unit' },
    { code: 'Nhe', rgb: [115,0,0], name: 'Noachian highland edifice unit' },
    { code: 'Nhu', rgb: [104,104,104], name: 'Noachian highland undivided unit' },
    { code: 'Nve', rgb: [204,0,0], name: 'Noachian volcanic edifice unit' }
  ];

  // Earth rock types: colours from Macrostrat lithology definitions (api/v2/defs/lithologies)
  const EARTH_LITHOLOGY_KEY = [
    { name: 'sandstone', color: '#FFD500' },
    { name: 'limestone', color: '#4C71F1' },
    { name: 'shale', color: '#7B8896' },
    { name: 'siltstone', color: '#86919D' },
    { name: 'evaporite', color: '#FFB6C1' },
    { name: 'conglomerate', color: '#FFC000' },
    { name: 'basalt', color: '#3FA03F' },
    { name: 'gabbro', color: '#FF303C' },
    { name: 'granite', color: '#FF4208' },
    { name: 'tuff', color: '#75D475' },
    { name: 'gneiss', color: '#8E491B' },
    { name: 'schist', color: '#9E6244' }
  ];


  const EARTH = {
    bases: [
      { key: 'satellite', name: 'Satellite', url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg', maxNative: 15,
        attribution: '<a href="https://s2maps.eu">Sentinel-2 cloudless</a> by EOX IT Services GmbH (contains modified Copernicus Sentinel data)' },
      { key: 'outline', name: 'Outline', outline: true },
      { key: 'elevation', name: 'Elevation', url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/ASTER_GDEM_Color_Shaded_Relief/default/GoogleMapsCompatible_Level12/{z}/{y}/{x}.jpeg', maxNative: 12,
        attribution: 'Elevation: ASTER GDEM via <a href="https://www.earthdata.nasa.gov/gibs">NASA GIBS</a>', legend: 'Green is low, red and white are high. Grey is below sea level.' }
    ],
    overlays: [
      { key: 'geology', name: 'Geology', legendKey: EARTH_LITHOLOGY_KEY, url: 'https://tiles.macrostrat.org/carto/{z}/{x}/{y}.png', opacity: 0.65, maxNative: 14,
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
      geology: { name: 'Geology', legendKey: MARS_GEOLOGY_KEY, url: 'https://trek.nasa.gov/mars/trekarcgis/rest/services/SIM3292_Global_Geology/MapServer/WMTS/tile/1.0.0/SIM3292_Global_Geology/default/default028mm/{z}/{y}/{x}.png',
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

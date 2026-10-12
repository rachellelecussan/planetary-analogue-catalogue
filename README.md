# Planetary Analogue Catalogue

This is a catalogue of Earth sites used as analogues for other bodies in the Solar System: Mars, the Moon, Europa, Enceladus and early Earth. Each site has its own page, with geology, environment, access and safety information, a side-by-side map against its planetary counterpart, and a reference list.

It's written for students, researchers and lecturers who need to know whether a site is any use for their work, and how far to trust the comparison.

**Live site:** https://rachellelecussan.github.io/planetary-analogue-catalogue/

## The dataset

The data lives in `data/sites.geojson`: one GeoJSON feature per site, with the attributes in its `properties`. Controlled vocabularies (the allowed values for filters and the form) are in `data/vocab.json`.

Each site record includes:

- **Location:** name, alternative names, country, region, coordinates and a coordinate precision flag.
- **Analogue:** the target body, analogue type (geological, mineralogical, volcanic, habitability and so on), the feature being compared, why it's relevant, and where it fails.
- **Geology:** setting, rock types, key minerals, age, environment type, pH range and biological status.
- **Access and safety:** access level, permits and issuing authority, land status, nearest town, sampling rules, a hazard rating, hazards and notes.
- **Comparison:** a matching location on the target body, used for the planetary map layers.
- **Evidence:** references and photos, each with author, licence and source.
- **Status:** date added and review status (`Draft` or `Verified`).

The current dataset has 16 sites, 96 references and 42 photos. The analogue targets so far are Mars, the Moon, Europa, Enceladus and early Earth. There are no Titan, Venus, Mercury or Ceres sites yet.

## Source of truth and build

The spreadsheet `data-source/catalogue.xlsx` is the only file you should edit by hand. The Sites and References tabs feed the data, and the Vocabularies tab sets the dropdown values.

`scripts/build_data.py` converts the workbook into `data/sites.geojson` and `data/vocab.json`. It needs `openpyxl`. Coordinates are rounded to each site's `coordinate_precision` at build time, so the exact position of a sensitive site never reaches the published file.

`scripts/validate.py` checks the output: required fields, that every value has a reference, and that filterable fields use approved vocabulary. The GitHub Actions workflow in `.github/workflows/publish.yml` runs both scripts on every push to `main`, commits any regenerated data, and deploys the site to GitHub Pages. Pages has to be set to deploy from GitHub Actions for this to work.

The site is plain HTML, CSS and JavaScript with no build step for the pages themselves. Maps use Leaflet 1.9.4, vendored under `assets/vendor/leaflet`.

## Maps

- **Main map:** EPSG:4326 (plate carrée) with `makeMap` setting the minimum zoom so the whole world fills the frame.
- **Earth comparison:** Web Mercator (EPSG:3857) with EOX Sentinel-2 imagery, Macrostrat geology, and ASTER elevation from NASA GIBS. Clicking the map queries Macrostrat for the rock unit at that point.
- **Planet comparison:** NASA Solar System Treks WMTS tiles on the same grid as the main map. Mars also has CTX tiles from ArcGIS, the USGS SIM 3292 geology layer with a full unit key, and TES mineral and Clementine composition layers.
- **Offline fallback:** low-resolution planet images in `assets/planets/` show if the live tiles fail to load.

Layer definitions are in `assets/planets.js`. The comparison logic is in `assets/compare.js`.

## Data notes

- **Coordinates:** published precision depends on each site. Sensitive sites (fragile environments, or land held by Indigenous or community groups) are never published more precisely than about 10 km.
- **Ratings:** hazard and access ratings are contributor estimates. They're not a formal risk assessment, and each needs a review date.
- **Missing values:** left blank rather than estimated. A blank field is better than a guessed one.
- **Review:** new entries start as `Draft`. They become `Verified` once someone other than the author has checked the science, references and ratings.

## Running locally

The pages fetch JSON, so they won't work from `file://`. Serve the folder instead:

```
python -m http.server 8000
```

Then open http://localhost:8000.

## Contributing

Use the **Add a site** form, the **Suggest an edit** link on any site page, or open an issue. For direct changes, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Citing

Cite the catalogue using `CITATION.cff`, and cite the original papers listed on each site page.

## Licences

- Data (`data/`, `data-source/`): [CC BY 4.0](LICENSE-DATA.md)
- Code: [MIT](LICENSE)
- Photos: each photo's author and licence are shown on its site page and listed in the Photos tab of the spreadsheet.
- Map layers: each service has its own terms, credited on the map. Natural Earth land outlines are public domain. EOX Sentinel-2 imagery is licensed for non-commercial use.

The ratings and site information are for teaching and research. They are not a safety guide, so check permits, local rules and current conditions before going to any site.

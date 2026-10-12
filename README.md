# Planetary Analogue Catalogue

An open, searchable, citable map of places on Earth that scientists use to study other worlds: Mars, the Moon, the icy moons and the early Earth. Every site entry brings together the science, geology, access and safety information that students, researchers and lecturers need, with a cited source for each value.

**Website:** https://rachellelecussan.github.io/planetary-analogue-catalogue/

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | The home page: search, filters, a large map and a preview of the selected site |
| `browse.html` | Every site as a sortable list, with the same search and filters |
| `site.html` | One page per site, filled from the data (`site.html?id=rio-tinto-es`) |
| `submit.html` | The "Add a site" and "Suggest a correction" form |
| `about.html` | About, how to cite, rating scales, licences and disclaimer |
| `data/sites.geojson` | The dataset: one feature per site, with its references |
| `data/vocab.json` | Controlled vocabularies used by the filters and the form |
| `assets/planets.js` | Map layers for the Earth and planet comparison on each site page |
| `assets/photos/` | Site photos (full size and `-sm` thumbnails) |
| `data-source/catalogue.xlsx` | The data-entry spreadsheet (the source of truth) |
| `scripts/build_data.py` | Turns the spreadsheet into `data/sites.geojson` and `data/vocab.json` |
| `scripts/validate.py` | Checks the dataset; runs automatically on every change |
| `assets/config.js` | Your name, GitHub repository, form address and DOI |

## Publishing on GitHub Pages

1. Create a public repository (this one is called `planetary-analogue-catalogue`).
2. Upload every file and folder from this project (drag them onto "uploading an existing file").
3. In the repository, go to **Settings → Pages**, set **Source** to "Deploy from a branch", choose `main` and `/ (root)`, and save.
4. After a minute or two the site is live at `https://rachellelecussan.github.io/planetary-analogue-catalogue/`.

Then edit `assets/config.js` (pencil icon on GitHub) to set your name, repository and, optionally, a form address for email submissions.

## Updating the data

1. Edit `data-source/catalogue.xlsx` (Sites and References tabs).
2. Run `pip install openpyxl` once, then `python scripts/build_data.py`.
3. Run `python scripts/validate.py` and fix any errors it reports.
4. Commit the updated `data/sites.geojson`, `data/vocab.json` and spreadsheet.

Locations are rounded according to each site's `coordinate_precision`, and sensitive sites are never published more precisely than about 10 km.

## Previewing locally

The pages load data files, so open them through a local web server rather than by double-clicking:

```
python -m http.server 8000
```

then visit http://localhost:8000.

## Citing

See `CITATION.cff` or the About page. Please also cite the original papers listed on each site page.

## Licences

- **Data** (`data/`, `data-source/`): [CC BY 4.0](LICENSE-DATA.md)
- **Code**: [MIT](LICENSE)
- Land outlines and label positions from [Natural Earth](https://www.naturalearthdata.com) (public domain); map library [Leaflet](https://leafletjs.com) (BSD 2-clause, see `assets/vendor/leaflet/LICENSE`).
- Comparison maps load tiles from NASA Solar System Treks, USGS, Macrostrat (CC BY 4.0) and EOX Sentinel-2 cloudless (non-commercial use). Mars mineral detections in `data/planets/` come from NASA Mars Trek.
- Photos in `assets/photos/` are from Wikimedia Commons; each photo's author and licence are listed on the Photos tab of the spreadsheet and shown on the site.

Hazard and access ratings are guidance from contributors, not a risk assessment.

# Planetary Analogue Catalogue

An open, searchable catalogue of places on Earth that scientists use to study other worlds. For each site, it brings together the science, geology, access and safety information that students, researchers and lecturers need, with a cited source for every value.

**Live site:** https://rachellelecussan.github.io/planetary-analogue-catalogue/

## What is a planetary analogue?

An analogue is an Earth place whose rocks, landforms, chemistry or environment resemble those on another body in the Solar System. Scientists study analogues to test instruments, methods and ideas on the ground, before or alongside missions to the real target.

For example, Río Tinto in Spain has acidic, iron-rich water and iron-bearing minerals like those found on Mars.

Each entry records what the site is an analogue for, why the comparison is useful, and where it breaks down.

## What the dataset contains

The dataset has one record per site. There are currently **16 sites**, with **96 references** and **42 photographs**.

Each record covers:

- **Identity:** name, alternative names, country, region and approximate location.
- **Analogue:** the body or bodies compared, the type of analogue (for example geological, mineralogical, volcanic or habitability), the feature being compared, why it is relevant, and where the comparison breaks down.
- **Geology and environment:** setting, rock types, key minerals, age, environment type, pH range and whether life is present.
- **Access and safety:** access level, permits and the authority that issues them, land status, nearest town, sampling rules, a hazard rating, hazards and safety notes.
- **Comparison:** a paired location on another body, used for the side-by-side maps on each site page.
- **Evidence:** references and photographs, each with its author, licence and source.
- **Status:** date added and review status (Draft or Verified).

So far the sites are analogues for **Mars**, the **Moon**, **Europa**, **Enceladus** and **Early Earth**. The dataset does not yet include sites for Titan, Venus, Mercury, Ceres or other bodies.

## How the data is kept

The spreadsheet `data-source/catalogue.xlsx` is the single source of truth. Everything published on the site is generated from it, so changes are always made in the spreadsheet.

Two automatic checks run on every change: one builds the public data, and one validates it. If validation fails, the site is not published.

## Data notes

- **Locations are rounded.** Each site has a coordinate precision, from exact down to region only. Sensitive sites, including fragile environments and sites on Indigenous or community land, are never published more precisely than about 10 km.
- **Ratings are guidance.** Hazard and access ratings come from contributors. They are not a formal risk assessment, and each needs a review date.
- **Every value has a source.** Leave a field blank rather than guess. At least one reference per site should be peer-reviewed.
- **Draft means not yet checked.** Entries start as Draft and become Verified once a second person has checked the science, sources and ratings.

## Citing

Please cite the catalogue and the original papers listed on each site page. See `CITATION.cff` or the About page for the citation format.

## Contributing

To suggest a new site or a correction, use the **Add a site** form on the website, or the **Suggest an edit** link on any site page. Full guidance is in [CONTRIBUTING.md](CONTRIBUTING.md).

## Licences

- **Data:** [CC BY 4.0](LICENSE-DATA.md)
- **Code:** [MIT](LICENSE)
- **Photographs:** each photo's author and licence are shown on its site page and listed in the spreadsheet.
- **Maps:** land outlines and labels from [Natural Earth](https://www.naturalearthdata.com) (public domain). Map imagery comes from NASA Solar System Treks, USGS, NASA GIBS, Macrostrat and EOX, each under its own terms, shown on the map.

## Disclaimer

The catalogue is a teaching and research resource, not a safety guide. Check permits, local rules and conditions before visiting any site.

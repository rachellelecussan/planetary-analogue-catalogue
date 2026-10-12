# Contributing

Thank you for helping to grow the catalogue. There are three ways to contribute.

## 1. Use the website form (easiest)

Use "Add a site" on the website, or "Suggest an edit" on any site page. No GitHub account is needed.

## 2. Open an issue

Choose **New issue → Add or correct a site** and fill in the form.

## 3. Edit the data directly

1. Fork the repository.
2. Edit `data-source/catalogue.xlsx`: one row per site on the Sites tab, one row per source on the References tab.
3. Run `python scripts/build_data.py` and then `python scripts/validate.py`.
4. Open a pull request. The validation check runs automatically.

## What makes a good entry

- **Every value has a source.** Add each paper or official page to the References tab with the site's id. At least one source should be peer-reviewed.
- **Leave unknowns blank.** Never guess a number.
- **Use the dropdown values.** Filterable fields use the lists on the Vocabularies tab; ask a maintainer to add a new value.
- **Rate against the scales.** Hazard and access ratings use the written 1–5 scales on the About page, and need a review date.
- **Protect sensitive sites.** Fragile sites and sites on Indigenous or community land are published at "Approximately 10 km" or "Region only".
- **Say where the analogue breaks down,** not only where it works.

## Review

A maintainer checks each submission's science, sources and ratings before it is merged. Entries start as "Draft" and become "Verified" after a second person has checked them. Contributors are credited in the entry and in each citable release.

# Wei Li — portfolio

Plain HTML, CSS and JavaScript. No build step.

## Run it locally

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## Files

| File | What it is |
| --- | --- |
| `index.html` | Home: hero, two case study previews, link to experience |
| `work.html` | All projects: four cards, each linking to a case study |
| `case-study-1.html` … `case-study-4.html` | Case studies with the scroll-tracking section list |
| `about.html` | Experience timeline with "See works" carousels, resume download, hobbies |
| `contact.html` | Location, phone, email and the "Send Wei an email" menu |
| `css/styles.css` | All styles. Colors and type sizes are tokens at the top |
| `js/site.js` | Shared nav and footer, plus page behaviours |
| `assets/Wei-Li-Resume.pdf` | Placeholder resume |

## Tweaking the design

When the site runs on your computer (localhost), a **Tweak** button appears bottom-right. It lets you change colours, the heading and description typefaces, heading weight and type sizes live, and checks text contrast as you go. Settings carry across pages and reloads in that browser. **Copy CSS** gives you the changed values. Paste them to Claude, or into the `:root` block at the top of `css/styles.css`, to make them permanent. The panel (`js/tweak.js`) never loads on the published site.

## Replacing placeholders

Search the project for `TODO(Wei)` to find every spot.

1. **Contact details**: edit the `SITE` object at the top of `js/site.js` (email, phone, location, LinkedIn). Every page reads from it.
2. **Resume**: replace `assets/Wei-Li-Resume.pdf`, keeping the same file name.
3. **Images**: each grey striped box (`<div class="ph" ...>`) says what image goes there and at what ratio. Replace the whole `div` with an image, for example:
   ```html
   <img src="assets/case-1-cover.jpg" alt="Describe the image" style="aspect-ratio: 4 / 3; object-fit: cover; border-radius: 4px;">
   ```
4. **Jobs**: in `about.html`, each `<li class="job">` is one role. The images for its carousel live in the `<template class="job__works">` inside it; add or remove `<figure class="carousel__slide">` blocks as needed.
5. **Case studies**: rename the files if you like (update the links in `index.html` and the "Next case study" links). The section list on the left must match the `id`s of the `<section class="cs-section">` blocks.

## Publishing on GitHub Pages

1. Create a GitHub repository and push this folder to it.
2. In the repository, go to Settings → Pages, choose "Deploy from a branch", pick `main` and `/ (root)`.
3. The site appears at `https://<your-username>.github.io/<repo-name>/`.

The `logo/` and `hero-video/` folders are earlier explorations and aren't used by the site. Leave them out of the repository (or delete them) to keep it small; the videos are about 22 MB.

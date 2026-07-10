# Entertainme Website Design Changes

> **Design Reference:** Following PageSix.com layout and structure  
> **Overall Background:** White background for entire website

---

## 📱 HOME PAGE LAYOUT

### Header Section
- **Remove Marquee** (image1.png) - Delete the scrolling marquee element at the top

### Hero Section  
- **Remove Hero Section** (image2.png) - Delete the large hero banner section

### Content Layout Pattern
Alternate between left and right sidebars following PageSix pattern:

**Pattern Flow:**
1. One large featured image (full width or near full width)
2. Article text below the image
3. Grid of 3 article boxes (side by side)
4. Right sidebar (Trending Now with images) - (image3.png reference)
5. Single image (like step 1)
6. Grid of 3 article boxes again
7. Left sidebar (article flow pattern) - (image4.png, image5.png, image6.png references)

### Right Sidebar - "Trending Now"
- **Add images like PageSix has** (see image3.png)
- Display trending articles with thumbnail images
- Should have visual weight and engagement elements

### Remove Newsletter Box
- **Delete newsletter subscription box** from right bottom (image7.png)

### Footer
- Keep footer as is (no changes)

### Content Limit
- **Home page shows max 20-25 articles only** then footer
- Improves performance and user experience

---

## 📄 ARTICLE DETAIL PAGE

### Navbar & Sticky Elements
- **Make navbar sticky** across entire website and article pages
- Follows user as they scroll

### Trending Now Bar (Article Page)
- **Add sticky "Trending Now" bar** (image8.png) with scroll functionality
- Stays visible as user scrolls through article
- **Also add right sidebar trending articles** like home page (image3.png reference)
- Include thumbnail images in trending section

### Article Images
- **Allow images to be added anywhere in article content** (like PageSix does)
- Don't restrict image placement to specific positions
- Images can flow naturally within article text

### End of Article Section
- **Add "Read Next Article" links** at article end (image9.png reference)
- These are styled link blocks directing to next articles

### Below "Read Next" Links
- **Add 9-article grid** displaying related/trending articles
- Grid layout (3 columns recommended)
- Clickable article cards

### Remove Comment Section
- **Delete entire comment section** (image10.png)
- No user comments on article pages

### Add Related Stories Section
- **Add horizontal scrolling "Related Stories" section** (image11.png reference)
- Fills the space where comments used to be
- Displays related articles in scrollable carousel
- Includes thumbnail images

### Footer
- Keep footer as is (no changes)

---

## 🏷️ CATEGORY PAGES (Celebrities, etc.)

### Layout Structure
- **Left side:** Follow same PageSix design as main site (reference: https://pagesix.com/entertainment/)
- **Right side:** Same "Trending Now" section as home page or article detail pages
- Article listings with images and descriptions
- Maintains consistency across all category pages

---

## 🎨 VISUAL CONSISTENCY

### Background
- **Entire website background: White**
- Clean, minimal aesthetic

### Component Styling
- Match PageSix design language
- Images prominent and engaging
- Proper spacing and typography

### Responsive Behavior
- All layouts should be responsive
- Sticky elements work on mobile
- Images scale appropriately

---

## 📋 IMPLEMENTATION PRIORITY

**Phase 1 - Home Page (Critical)**
1. Remove marquee
2. Remove hero section  
3. Implement alternating sidebar layout
4. Add images to Trending Now section
5. Remove newsletter box
6. Set white background

**Phase 2 - Article Page (High)**
1. Make navbar sticky
2. Add sticky Trending Now bar
3. Add right sidebar trending
4. Enable flexible image placement
5. Add "Read Next" links
6. Add 9-article grid
7. Remove comments section
8. Add Related Stories carousel

**Phase 3 - Category Pages (Medium)**
1. Implement PageSix-style left sidebar
2. Add Trending Now right sidebar
3. Ensure consistency

---

## 📸 REFERENCE IMAGES

All reference images are in `/reference-images/` folder:

| Image | Purpose |
|-------|---------|
| image1.png | Current Marquee (to remove) |
| image2.png | Current Hero Section (to remove) |
| image3.png | Trending Now section design with images |
| image4.png | Left sidebar article flow example |
| image5.png | Left sidebar article flow example |
| image6.png | Left sidebar article flow example |
| image7.png | Newsletter box (to remove) |
| image8.png | Sticky Trending Now bar for article pages |
| image9.png | "Read Next Article" links style |
| image10.png | Comment section (to remove) |
| image11.png | Related Stories carousel design |

---

## ✅ DESIGN GOALS

- ✓ Mirror PageSix.com layout and structure
- ✓ Prominent image placement throughout
- ✓ Sticky navigation for better UX
- ✓ Related content discovery (trending, read next, related stories)
- ✓ White, clean background
- ✓ Responsive design
- ✓ Remove unnecessary elements (marquee, hero, newsletter, comments)

---

**Status:** Ready for Trae implementation  
**Format:** Markdown (Trae-friendly)  
**Reference Images:** Included in reference-images/ folder

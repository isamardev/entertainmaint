# Entertainme Website - Revision 2 Design Changes

> **Revision Type:** Design Refinement & Color/Layout Updates  
> **Status:** Implementation Ready for Trae

---

## 🎨 COLOR SCHEME UPDATES

### Main Change: Yellow → Pure Black

All yellow highlights and accent colors throughout the website should be changed to **pure black** (#000000).

---

## 📄 ARTICLE CARDS & LISTINGS

### Remove From All Article Cards

- ❌ **Remove Category Tags** (e.g., "Celebrity", "Entertainment", etc.)
  - Currently shown with each article
  - Remove completely from article cards and listings

- ❌ **Remove Timestamp/Date Display**
  - Don't show article posting time on cards
  - Affects: Home page, Category pages, Related articles section

### Reference Images

- **image2.jpeg** - Shows current article card layout with categories and timestamp (to be removed)

---

## 📍 SECTION DIVIDERS & HIGHLIGHTS

### Yellow Bar → Black Bar

Changes needed in multiple locations:

1. **Highlighted Bar** (image3.jpeg)
   - Change color from Yellow → Pure Black

2. **Article Selection Highlight** (image4.jpeg)
   - Change color from Yellow → Pure Black

3. **Share Button Section** (image5.jpeg)
   - Change "Share" text color from Yellow → Pure Black
   - Make "Share" text **Bold**
   - Change bar under Share from Yellow → Pure Black

4. **"Read Next" Section Bar** (image5.jpeg)
   - Change bar color from Yellow → Pure Black

5. **"More Stories" Section Bar** (image5.jpeg)
   - Change bar color from Yellow → Pure Black

6. **All Section Separator Bars** (image7.jpeg)
   - Change from Yellow → Pure Black
   - Apply to every page where section separators appear

### Text Color Updates

- **Change main text color to pure black** (image1.jpeg reference)
  - Ensure all body text is pure black (#000000)

---

## 🗑️ REMOVE TRENDING NOW SECTION

### Key Update: Trending Now Visibility

- ❌ **Remove "Trending Now" from all pages EXCEPT Article Detail Pages**

### Specific Locations to Remove Trending Now:

1. **Home Page** (image11.jpeg)
   - Remove Trending Now section completely

2. **Category Pages** (image6.jpeg)
   - Remove Trending Now sidebar

3. **Keep Only On Article Pages** (image9.jpeg)
   - Article detail pages should still have Trending Now
   - Move bar under "Trending Now" text (not above)

---

## 🏷️ BREAKING NEWS TAG

### Remove Breaking Badge

- ❌ **Remove "Breaking" tag** from all articles
- ❌ Reason: All news is considered breaking news
- Keep simple article title without the Breaking badge

### Reference

- **image8.jpeg** - Shows current Breaking tag (to be removed)

---

## 📰 TRENDING NOW REFINEMENTS

### Article Detail Page Only

- ✅ **Keep Trending Now on article pages**
- ⚠️ **Important Updates:**
  - Remove numbering from trending articles (1, 2, 3, etc.)
  - Remove category tags from trending articles
  - **Display ONLY:** Image + Article Headline
  - **Limit to 5 articles maximum** (not more)
  - Move separating bar under the "Trending Now" text (image9.jpeg)

### Reference

- **image10.jpeg** - Current Trending Now with numbering and categories (needs update)

---

## 📋 SUMMARY OF CHANGES BY PAGE

### HOME PAGE

- ❌ Remove Trending Now section
- ❌ Remove categories from article cards
- ❌ Remove timestamps from article cards
- 🎨 Change all yellow → pure black
- ✅ Keep article grid layout

### CATEGORY PAGES

- ❌ Remove Trending Now sidebar completely
- ❌ Remove categories from article cards
- ❌ Remove timestamps from article cards
- 🎨 Change all yellow → pure black
- ✅ Keep category layout

### ARTICLE DETAIL PAGES

- ✅ Keep Trending Now (refine it)
- ❌ Remove categories from article content
- ❌ Remove timestamp from article
- ❌ Remove "Breaking" tag
- 🎨 Change all yellow → pure black
- ✅ Update Trending Now:
  - Remove numbering
  - Remove categories
  - Show only image + headline
  - Limit to 5 items
  - Move bar under "Trending Now" text

---

## 🎯 IMPLEMENTATION PRIORITY

**Phase 1 - Critical (Do First)**

1. Change text color to pure black
2. Remove all yellow highlights → pure black
3. Remove categories from all article cards
4. Remove timestamps from all article cards

**Phase 2 - Content Refinement (Do Second)**

1. Remove Trending Now from Home page
2. Remove Trending Now from Category pages
3. Remove Breaking tag from all articles
4. Remove categories from article detail pages
5. Remove timestamps from article detail pages

**Phase 3 - Trending Now Polish (Do Last)**

1. Refine Trending Now on article pages
2. Remove numbering from trending articles
3. Remove categories from trending articles
4. Limit to 5 articles
5. Move bar under text

---

## 📸 REFERENCE IMAGES

All reference images are in `/revision2-images/` folder:

| Image        | Purpose                                              |
| ------------ | ---------------------------------------------------- |
| image1.jpeg  | Text color should be pure black                      |
| image2.jpeg  | Current article card (remove categories & timestamp) |
| image3.jpeg  | Highlight bar (yellow → black)                       |
| image4.jpeg  | Article highlight (yellow → black)                   |
| image5.jpeg  | Share section & Read Next bar (yellow → black)       |
| image6.jpeg  | Category page (remove Trending Now)                  |
| image7.jpeg  | Section dividers (yellow → black everywhere)         |
| image8.jpeg  | Breaking tag (to remove)                             |
| image9.jpeg  | Trending Now bar placement                           |
| image10.jpeg | Trending Now refinement needed                       |
| image11.jpeg | Home page (remove Trending Now)                      |

---

## ✅ COLOR CHANGES CHECKLIST

- ✓ Text color → Pure Black (#000000)
- ✓ Highlighted bars → Pure Black
- ✓ Section dividers → Pure Black
- ✓ Share button text → Pure Black + Bold
- ✓ All yellow elements → Pure Black
- ✓ No yellow remaining on website

---

## 📝 NOTES FOR TRAE

**Database/Content:**

- No database changes needed
- Only UI/styling updates

**Files to Update:**

- Check all component CSS for yellow colors
- Update trending article component (remove numbering, categories)
- Update article card component (remove categories, timestamps)
- Update article detail page component

**Testing:**

- Verify all pages have pure black text
- Check all section separators are black
- Confirm Trending Now only on article pages
- Verify Trending Now limited to 5 items with proper styling

---

**Status:** Ready for Trae implementation  
**Format:** Markdown (Trae-friendly)  
**Reference Images:** 11 images in revision2-images/ folder  
**Dependencies:** Build on Revision 1 changes

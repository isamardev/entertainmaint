-- Remove the Summer Movie Preview article from the site
DELETE FROM articles
WHERE slug = 'summer-movie-preview'
   OR title = 'Summer Movie Preview: The Films You Can''t Miss';

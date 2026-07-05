-- Seed English articles
WITH cat_ids AS (SELECT id, slug FROM categories)
INSERT INTO articles (
  slug, title, dek, body, category_id, status, is_breaking, is_featured, published_at,
  hero_image_hd, hero_image_lq
) VALUES
-- 1. Celebrity - Breaking & Featured
(
  'celebrity-spotlight-a-list-event',
  'A-Listers Turn Out For Star-Studded Premiere',
  'Hollywood''s biggest names walked the red carpet last night for the year''s most anticipated film premiere.',
  'Hollywood Boulevard was abuzz last night as A-list celebrities arrived for the world premiere of the summer''s biggest blockbuster. Stars arrived in style, showcasing the latest fashion trends on the red carpet. The evening was filled with laughter, excitement, and plenty of photo opportunities as fans lined the streets to catch a glimpse of their favorite actors.

The film, which has been in production for over two years, is already generating massive buzz among critics and fans alike. With an all-star cast and a compelling storyline, it''s set to be one of the biggest hits of the year.

After the screening, the cast and crew attended an exclusive after-party where they celebrated the successful premiere. The party featured live music, gourmet food, and plenty of champagne as guests toasted to the film''s success.

Stay tuned for more updates on this exciting new release as it hits theaters worldwide next month.',
  (SELECT id FROM cat_ids WHERE slug = 'celebrity'),
  'published', true, true, NOW() - INTERVAL '2 hours',
  'https://picsum.photos/seed/celebrity-red-carpet/1200/800',
  'https://picsum.photos/seed/celebrity-red-carpet/600/400'
),
-- 2. Movies & TV
(
  'new-series-breaks-streaming-records',
  'New Streaming Series Shatters Records In First Week',
  'The latest original series from the world''s biggest streaming platform has broken all viewing records.',
  'A new streaming series has taken the world by storm, breaking all previous viewing records in its first week of release. The show, which combines thrilling drama with stunning visuals, has captivated audiences around the globe.

Viewers have been raving about the incredible performances from the cast, the gripping storyline, and the high production values. Social media has been buzzing with discussions about the show, with fans sharing their favorite moments and theories about what might happen next.

The streaming platform has already announced that a second season is in development, much to the delight of fans worldwide. Production is set to begin later this year, with the entire cast returning to reprise their roles.

If you haven''t watched it yet, now is the perfect time to dive into this incredible series that everyone is talking about.',
  (SELECT id FROM cat_ids WHERE slug = 'movies-tv'),
  'published', false, false, NOW() - INTERVAL '1 day',
  'https://picsum.photos/seed/movie-theater/1200/800',
  'https://picsum.photos/seed/movie-theater/600/400'
),
-- 3. Music
(
  'chart-topping-artist-announces-world-tour',
  'Global Superstar Announces Massive World Tour',
  'The biggest name in music is hitting the road with a world tour that will cover 50 cities across 6 continents.',
  'Music fans around the world are celebrating today as the biggest artist on the planet announced an epic world tour that will visit 50 cities across 6 continents. The tour, which kicks off later this year, promises to be one of the most spectacular live shows ever seen.

Tickets go on sale next week, and fans are already preparing for what is expected to be one of the fastest-selling tours in history. The artist has promised a brand-new stage production, a setlist packed with all their biggest hits, and a few surprises along the way.

The tour announcement comes hot on the heels of the artist''s latest album, which has been dominating the charts since its release last month. The album has already spawned multiple number-one singles and shows no signs of slowing down.

Make sure you get your tickets early – this is one show you won''t want to miss!',
  (SELECT id FROM cat_ids WHERE slug = 'music'),
  'published', true, false, NOW() - INTERVAL '1.5 days',
  'https://picsum.photos/seed/concert-stage/1200/800',
  'https://picsum.photos/seed/concert-stage/600/400'
),
-- 4. Style
(
  'fashion-week-highlights-top-trends',
  'Fashion Week Reveals Hottest Trends For The Season',
  'The world''s top fashion designers have unveiled their latest collections at Fashion Week.',
  'Fashion Week has come to a close, and the style world is buzzing about the incredible collections unveiled by the world''s top designers. From bold colors and dramatic silhouettes to minimalist elegance, this season''s trends offer something for everyone.

The week kicked off with stunning shows from established houses, showcasing everything from luxurious evening wear to casual daytime looks. Emerging designers also made their mark, presenting fresh and innovative designs that have critics talking.

Key trends for the season include oversized outerwear, vibrant prints, sustainable materials, and a return to bold accessories. Whether you prefer classic elegance or cutting-edge style, there''s plenty of inspiration to be found in this season''s collections.

Start planning your wardrobe update now – these trends are too good to miss!',
  (SELECT id FROM cat_ids WHERE slug = 'style'),
  'published', false, false, NOW() - INTERVAL '2 days',
  'https://picsum.photos/seed/fashion-runway/1200/800',
  'https://picsum.photos/seed/fashion-runway/600/400'
),
-- 5. Royals
(
  'royal-family-attends-charity-gala',
  'Royal Family Makes Glamorous Appearance At Charity Gala',
  'Members of the royal family attended a star-studded charity gala last night to raise funds for important causes.',
  'The royal family stepped out in style last night for a glamorous charity gala that raised millions for important causes. The event, which took place at a historic venue, brought together celebrities, philanthropists, and members of the public all united in support of worthy organizations.

The evening featured a dinner, live auction, and performances from world-renowned artists. Members of the royal family gave speeches highlighting the importance of the causes being supported and thanked everyone for their generosity.

The gala was a tremendous success, exceeding all fundraising goals. The funds raised will go towards supporting education, healthcare, and community initiatives both locally and around the world.

It was truly a night to remember, filled with elegance, generosity, and hope for the future.',
  (SELECT id FROM cat_ids WHERE slug = 'royals'),
  'published', false, false, NOW() - INTERVAL '2.5 days',
  'https://picsum.photos/seed/royal-gala/1200/800',
  'https://picsum.photos/seed/royal-gala/600/400'
),
-- 6. Sports
(
  'championship-final-thriller',
  'Underdog Team Wins Championship In Stunning Upset',
  'In a game for the ages, the underdog team came from behind to win the championship in a thrilling final.',
  'Sports history was made last night as the underdog team pulled off one of the greatest upsets in championship history. Trailing by a significant margin at halftime, the team staged an incredible comeback in the second half to win the game in dramatic fashion.

Fans in the stadium and around the world watched in awe as the team scored the winning points in the final seconds of the game. The celebration that followed was one for the ages, with players, coaches, and fans all sharing in the incredible moment.

This victory marks the team''s first championship in decades and cements their place in sports history. The players have already promised that this is just the beginning and that they''ll be back next season to defend their title.

Congratulations to the champions – you''ve earned it!',
  (SELECT id FROM cat_ids WHERE slug = 'sports'),
  'published', true, false, NOW() - INTERVAL '3 days',
  'https://picsum.photos/seed/sports-championship/1200/800',
  'https://picsum.photos/seed/sports-championship/600/400'
);

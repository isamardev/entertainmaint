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
),
-- 7. Celebrity
(
  'celebrity-couple-spotted-vacation',
  'Celebrity Couple Spotted On Romantic Vacation',
  'The hottest couple in Hollywood was seen enjoying a romantic getaway in a tropical paradise.',
  'Love is in the air! The most talked-about celebrity couple was spotted enjoying a romantic vacation in a beautiful tropical location. The pair was seen walking hand in hand on the beach, enjoying sunset dinners, and looking very much in love.

Sources close to the couple say they''re taking some much-needed time off from their busy schedules to relax and reconnect. The couple has been going strong for several years now and fans can''t get enough of their adorable relationship.

Stay tuned for more updates on this celebrity love story as it unfolds!',
  (SELECT id FROM cat_ids WHERE slug = 'celebrity'),
  'published', false, false, NOW() - INTERVAL '3.5 days',
  'https://picsum.photos/seed/celebrity-couple/1200/800',
  'https://picsum.photos/seed/celebrity-couple/600/400'
),
-- 8. Movies & TV
(
  'summer-blockbuster-preview',
  '10 Must-See Movies Coming This Summer',
  'From action flicks to romantic comedies, here are the films you won''t want to miss this summer.',
  'Summer movie season is just around the corner, and this year''s lineup looks better than ever! We''ve rounded up the 10 must-see films that are coming to theaters in the next few months.

From big-budget action movies to hilarious comedies and heartfelt dramas, there''s something for everyone this summer. Get ready for a season filled with entertainment and make sure to mark your calendars for these exciting releases.

Grab your popcorn and get ready for the best summer at the movies in years!',
  (SELECT id FROM cat_ids WHERE slug = 'movies-tv'),
  'published', false, false, NOW() - INTERVAL '4 days',
  'https://picsum.photos/seed/summer-movies/1200/800',
  'https://picsum.photos/seed/summer-movies/600/400'
),
-- 9. Music
(
  'new-album-drops-from-indie-artist',
  'Indie Artist Drops Highly Anticipated New Album',
  'The wait is over! The indie artist everyone has been talking about has finally released their new album.',
  'Music fans rejoice! The incredibly talented indie artist we''ve all been waiting for has finally dropped their new album, and it''s everything we hoped for and more.

Featuring 12 brand-new tracks, the album showcases the artist''s incredible range and unique sound. From upbeat anthems to heartfelt ballads, this album has something for every mood.

Critics are already calling it one of the best albums of the year, and fans can''t stop listening. Make sure to check it out and see what all the hype is about!',
  (SELECT id FROM cat_ids WHERE slug = 'music'),
  'published', false, false, NOW() - INTERVAL '4.5 days',
  'https://picsum.photos/seed/indie-music/1200/800',
  'https://picsum.photos/seed/indie-music/600/400'
),
-- 10. Style
(
  'celeb-style-how-to-copy-the-look',
  'How To Get The Celebrity Look For Less',
  'Love the red carpet style of your favorite stars? Here''s how to recreate their looks without breaking the bank.',
  'Ever looked at a celebrity on the red carpet and wished you could pull off their amazing style? Well, now you can! We''ve got the tips and tricks you need to recreate those iconic looks without spending a fortune.

From affordable fashion finds to clever styling hacks, we''ll show you how to look like a million bucks without actually spending it. Whether it''s for a special occasion or just everyday glam, these tips will help you elevate your style game.

Get ready to turn heads and feel like a celebrity yourself!',
  (SELECT id FROM cat_ids WHERE slug = 'style'),
  'published', false, false, NOW() - INTERVAL '5 days',
  'https://picsum.photos/seed/celebrity-style/1200/800',
  'https://picsum.photos/seed/celebrity-style/600/400'
),
-- 11. Royals
(
  'royal-baby-announcement',
  'Royal Family Announces Exciting Baby News',
  'The palace has just shared some wonderful news – there''s a new royal baby on the way!',
  'Big news from the palace! The royal family has just announced that a new baby is on the way, and fans around the world are absolutely thrilled.

The royal couple shared the happy news in a sweet statement, expressing their excitement for this next chapter in their lives. Well-wishers from around the globe have already begun sending their congratulations and best wishes.

Stay tuned for more updates as we learn more about the upcoming royal addition!',
  (SELECT id FROM cat_ids WHERE slug = 'royals'),
  'published', true, false, NOW() - INTERVAL '5.5 days',
  'https://picsum.photos/seed/royal-baby/1200/800',
  'https://picsum.photos/seed/royal-baby/600/400'
),
-- 12. Sports
(
  'olympic-star-breaks-world-record',
  'Olympic Star Makes History With New World Record',
  'In an incredible performance, a star athlete has shattered a world record that has stood for decades.',
  'History was made at the championships today as an incredible Olympic star broke a world record that has stood strong for over two decades. The athlete''s stunning performance left the crowd speechless and fellow competitors in awe.

The athlete said afterward that they''ve been working towards this moment for years and are grateful for all the support from fans, family, and their coach. This incredible achievement solidifies their place among the greatest athletes of all time.

Congratulations to this amazing athlete – you''ve made the world proud!',
  (SELECT id FROM cat_ids WHERE slug = 'sports'),
  'published', false, false, NOW() - INTERVAL '6 days',
  'https://picsum.photos/seed/olympic-record/1200/800',
  'https://picsum.photos/seed/olympic-record/600/400'
),
-- 13. Celebrity
(
  'actor-lands-dream-role',
  'Talented Actor Lands Dream Role In Major Franchise',
  'After years of hard work, a talented actor has landed their dream role in a huge film franchise.',
  'Dreams really do come true! A hardworking and talented actor has just landed the role of a lifetime in one of the biggest film franchises in the world.

The actor shared the news on social media, expressing their excitement and gratitude for this incredible opportunity. Fans are already buzzing with anticipation about seeing them bring their favorite character to life on the big screen.

We can''t wait to see their amazing performance!',
  (SELECT id FROM cat_ids WHERE slug = 'celebrity'),
  'published', false, false, NOW() - INTERVAL '6.5 days',
  'https://picsum.photos/seed/actor-role/1200/800',
  'https://picsum.photos/seed/actor-role/600/400'
),
-- 14. Movies & TV
(
  'tv-show-revival-announced',
  'Beloved TV Show Getting Revival Season',
  'Great news for fans! Your favorite classic TV show is coming back for an all-new season.',
  'The rumors are true! A beloved classic TV show is finally getting the revival fans have been begging for, and we couldn''t be more excited.

Original cast members are set to return, and there will be some exciting new faces joining the crew as well. The show will pick up where it left off, with plenty of surprises and nostalgic moments for long-time fans.

Get ready to revisit your favorite characters and storylines very soon!',
  (SELECT id FROM cat_ids WHERE slug = 'movies-tv'),
  'published', false, false, NOW() - INTERVAL '7 days',
  'https://picsum.photos/seed/tv-revival/1200/800',
  'https://picsum.photos/seed/tv-revival/600/400'
),
-- 15. Music
(
  'music-festival-lineup-revealed',
  'Massive Music Festival Reveals Epic Lineup',
  'The annual music festival has just dropped its lineup, and it''s even better than we hoped!',
  'Summer music festival season is shaping up to be amazing, with the biggest festival of them all just revealing its incredible lineup. Featuring over 100 artists across multiple stages, this year''s event is set to be the best one yet.

From headlining superstars to emerging artists you need to know about, this lineup has something for every music taste. Tickets go on sale next week – get ready to grab yours before they sell out!

It''s going to be an unforgettable summer of music!',
  (SELECT id FROM cat_ids WHERE slug = 'music'),
  'published', false, false, NOW() - INTERVAL '7.5 days',
  'https://picsum.photos/seed/music-festival/1200/800',
  'https://picsum.photos/seed/music-festival/600/400'
),
-- 16. Style
(
  'sustainable-fashion-trends',
  'The Rise Of Sustainable Fashion: How To Get On Board',
  'Sustainable fashion is more popular than ever – here''s how to build an eco-friendly wardrobe.',
  'Fashion with a conscience is having a major moment! More and more people are looking for ways to dress sustainably, and brands are taking notice.

From recycled materials to ethical production practices, there are so many great options available for anyone who wants to look good and do good for the planet. We''ve rounded up the best sustainable fashion brands and tips for building an eco-friendly wardrobe.

Join the sustainable fashion movement today!',
  (SELECT id FROM cat_ids WHERE slug = 'style'),
  'published', false, false, NOW() - INTERVAL '8 days',
  'https://picsum.photos/seed/sustainable-fashion/1200/800',
  'https://picsum.photos/seed/sustainable-fashion/600/400'
),
-- 17. Royals
(
  'royal-wedding-anniversary',
  'Royal Couple Celebrates Major Wedding Anniversary',
  'A beloved royal couple is celebrating their anniversary, and we''re looking back at their sweet love story.',
  'Wedding anniversary wishes are pouring in for a beloved royal couple who are celebrating a major milestone today. From their beautiful wedding day to their growing family, we''ve loved following along on their journey together.

The couple shared some sweet photos and messages to mark the occasion, and fans can''t get enough of their enduring love. Here''s to many more happy years together!',
  (SELECT id FROM cat_ids WHERE slug = 'royals'),
  'published', false, false, NOW() - INTERVAL '8.5 days',
  'https://picsum.photos/seed/royal-anniversary/1200/800',
  'https://picsum.photos/seed/royal-anniversary/600/400'
),
-- 18. Sports
(
  'tennis-grand-slam-finals',
  'Thrilling Finals At The Tennis Grand Slam',
  'Two incredible players faced off in an unforgettable match that went down to the wire.',
  'Tennis fans were treated to an unforgettable final match at the Grand Slam tournament, with two incredible players giving it their all in a nail-biting match that went down to the very last point.

The atmosphere in the stadium was electric, with fans on the edge of their seats until the final point was won. It was one of those matches that will be remembered for years to come.

Congratulations to both players for such an amazing performance!',
  (SELECT id FROM cat_ids WHERE slug = 'sports'),
  'published', false, false, NOW() - INTERVAL '9 days',
  'https://picsum.photos/seed/tennis-finals/1200/800',
  'https://picsum.photos/seed/tennis-finals/600/400'
),
-- 19. Celebrity
(
  'celebrity-launches-business',
  'Celebrity Launches Exciting New Business Venture',
  'A well-known celebrity has just launched a new business, and it''s already getting amazing reviews.',
  'Many celebrities have ventured into business, but few do it as well as this one! A favorite star has just launched a brand-new business, and it''s already receiving rave reviews from customers and critics alike.

The celebrity says this has been a passion project years in the making, and they''re thrilled to finally share it with the world. The business aligns with their personal values and interests, which makes it extra special.

We wish them all the best with this exciting new venture!',
  (SELECT id FROM cat_ids WHERE slug = 'celebrity'),
  'published', false, false, NOW() - INTERVAL '9.5 days',
  'https://picsum.photos/seed/celebrity-business/1200/800',
  'https://picsum.photos/seed/celebrity-business/600/400'
),
-- 20. Movies & TV
(
  'behind-the-scenes-movie',
  'Behind The Scenes Look At The Year''s Biggest Movie',
  'Go behind the scenes of the year''s most anticipated film and see how the magic was made.',
  'Ever wondered what goes into making a blockbuster movie? We''re taking you behind the scenes of the year''s biggest film to show you how all the movie magic was created.

From the incredible sets and special effects to the amazing costume design and makeup work, it took a huge team of talented people to bring this story to life. The cast and crew share their favorite memories from set and what it was like working on this epic project.

Get ready for an exclusive behind-the-scenes look!',
  (SELECT id FROM cat_ids WHERE slug = 'movies-tv'),
  'published', false, false, NOW() - INTERVAL '10 days',
  'https://picsum.photos/seed/behind-scenes/1200/800',
  'https://picsum.photos/seed/behind-scenes/600/400'
),
-- 21. Music
(
  'collaboration-of-the-year',
  'Two Music Icons Announce Surprise Collaboration',
  'In a move that no one saw coming, two music icons have teamed up for a brand-new song together.',
  'The music world is buzzing today after two legendary artists unexpectedly announced that they have collaborated on a brand-new song together, and we can''t wait to hear it!

Both artists have such unique and incredible sounds, so we know this collaboration is going to be something really special. The song is set to drop next month, and it''s sure to top the charts immediately.

Get ready for the collaboration of the year!',
  (SELECT id FROM cat_ids WHERE slug = 'music'),
  'published', true, false, NOW() - INTERVAL '10.5 days',
  'https://picsum.photos/seed/music-collab/1200/800',
  'https://picsum.photos/seed/music-collab/600/400'
),
-- 22. Style
(
  'fall-fashion-preview',
  'First Look At Fall''s Hottest Fashion Trends',
  'Summer isn''t over yet, but we''re already looking forward to the amazing fashion trends coming this fall.',
  'The seasons might be changing soon, and we''re getting a first look at all the incredible fashion trends coming our way this fall. From rich, warm colors to cozy fabrics and chic silhouettes, fall fashion this year is absolutely stunning.

We''ve rounded up all the biggest trends and the pieces you need to add to your wardrobe now. Get a head start on updating your closet for the new season so you can look stylish all autumn long.

Get ready to fall in love with fall fashion!',
  (SELECT id FROM cat_ids WHERE slug = 'style'),
  'published', false, false, NOW() - INTERVAL '11 days',
  'https://picsum.photos/seed/fall-fashion/1200/800',
  'https://picsum.photos/seed/fall-fashion/600/400'
),
-- 23. Royals
(
  'royal-tour-announced',
  'Royal Family Announces International Tour',
  'The royal family will be embarking on an international tour to visit several countries around the world.',
  'Exciting news from the palace! The royal family has just announced plans for an international tour that will take them to several countries around the world over the next few months.

The tour will focus on strengthening diplomatic ties, celebrating cultural exchanges, and supporting important charitable causes. It''s sure to be a busy and rewarding trip for everyone involved.

Stay tuned for updates as they embark on this exciting journey!',
  (SELECT id FROM cat_ids WHERE slug = 'royals'),
  'published', false, false, NOW() - INTERVAL '11.5 days',
  'https://picsum.photos/seed/royal-tour/1200/800',
  'https://picsum.photos/seed/royal-tour/600/400'
),
-- 24. Sports
(
  'new-coach-hired-for-team',
  'Major Sports Team Hires High-Profile New Coach',
  'A major sports team has just made a big move, hiring a high-profile new coach to lead them to victory.',
  'Big changes are coming for a major sports team! The organization has just announced the hiring of a high-profile new coach, and fans are incredibly optimistic about the future.

The new coach has a proven track record of success and is known for turning teams around. Players and fans alike are excited to see what the next season will bring with this new leadership at the helm.

Here''s to a winning season ahead!',
  (SELECT id FROM cat_ids WHERE slug = 'sports'),
  'published', false, false, NOW() - INTERVAL '12 days',
  'https://picsum.photos/seed/new-coach/1200/800',
  'https://picsum.photos/seed/new-coach/600/400'
),
-- 25. Celebrity
(
  'red-carpet-fashion-recap',
  'All The Best Looks From The Awards Show',
  'The awards show was incredible, but let''s talk about the real showstopper: the red carpet fashion!',
  'The awards show was full of unforgettable moments, amazing performances, and well-deserved wins, but as always, we''re also obsessed with all the incredible fashion from the red carpet.

From glamorous gowns to sharp suits, the stars really brought it this year. We''ve rounded up all the best looks from the evening so you can relive all the style magic.

Which look was your favorite?',
  (SELECT id FROM cat_ids WHERE slug = 'celebrity'),
  'published', false, false, NOW() - INTERVAL '12.5 days',
  'https://picsum.photos/seed/red-carpet/1200/800',
  'https://picsum.photos/seed/red-carpet/600/400'
);

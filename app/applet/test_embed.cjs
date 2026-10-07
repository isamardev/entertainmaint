const https = require("https");

const options = {
  hostname: "www.instagram.com",
  path: "/reel/DVQnFtyjQC_/embed/",
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  }
};
https.get(options, (res) => {
  let data = "";
  res.on("data", chunk => data += chunk);
  res.on("end", () => {
    console.log("Status:", res.statusCode);
    const ogImage = data.match(/property="og:image"\s+content="([^"]+)"/);
    console.log("og:image:", ogImage ? ogImage[1] : null);
    const videoMatches = data.match(/https:\/\/[^"'\\]+\.mp4[^"'\\]*/g);
    console.log("mp4 matches:", videoMatches ? videoMatches.length : 0);
    if (videoMatches) console.log("video[0]:", videoMatches[0]);
    // find all img src
    const imgMatches = data.match(/<img[^>]+src="([^"]+)"/g);
    console.log("img matches:", imgMatches ? imgMatches.slice(0, 3) : null);
    // search for EmbeddedMedia
    const embeddedMedia = data.match(/class="[^"]*EmbeddedMedia[^"]*"/g);
    console.log("EmbeddedMedia:", embeddedMedia);
    // search for background or black
    const blackMatches = data.match(/.{0,50}(background|black|#000|rgba\(0).{0,50}/g);
    console.log("black matches count:", blackMatches ? blackMatches.length : 0);
    if (blackMatches) console.log("sample black matches:", blackMatches.slice(0, 5));
  });
});

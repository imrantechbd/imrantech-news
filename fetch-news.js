import Parser from "rss-parser";
import fs from "fs";

const parser = new Parser({ timeout: 15000 });

const FEEDS = [
  "https://www.theverge.com/rss/index.xml",
  "https://techcrunch.com/feed/",
  "https://feeds.arstechnica.com/arstechnica/index",
];

const PER_FEED = 10;
const MAX_ITEMS = 40;

function cleanText(s = "") {
  return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

const items = [];

for (const url of FEEDS) {
  try {
    const feed = await parser.parseURL(url);
    for (const item of feed.items.slice(0, PER_FEED)) {
      if (!item.title || !item.link) continue;
      items.push({
        title: cleanText(item.title),
        link: item.link,
        source: feed.title || new URL(url).hostname,
        date: item.isoDate || item.pubDate || new Date().toISOString(),
        summary: cleanText(item.contentSnippet || item.content || "").slice(0, 200),
      });
    }
    console.log(`OK: ${url} (${feed.items.length} items)`);
  } catch (err) {
    console.error(`FAILED: ${url} -> ${err.message}`);
  }
}

const seen = new Set();
const unique = items.filter((it) => {
  if (seen.has(it.link)) return false;
  seen.add(it.link);
  return true;
});

unique.sort((a, b) => new Date(b.date) - new Date(a.date));

if (unique.length === 0) {
  console.error("Kono news pawa jayni. Purono news.json rakha holo.");
  process.exit(1);
}

fs.writeFileSync("news.json", JSON.stringify(unique.slice(0, MAX_ITEMS), null, 2));
console.log(`news.json update hoyeche: ${Math.min(unique.length, MAX_ITEMS)} ti khobor`);

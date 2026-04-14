const INVALID_PATH_PREFIXES = [
  "/explore",
  "/reel/",
  "/p/",
  "/stories/",
  "/accounts/",
  "/direct/",
  "/direct",
];

const PROFILE_URL_REGEX = /^https:\/\/www\.instagram\.com\/[a-zA-Z0-9_.]+\/?$/;

const NICHE_KEYWORDS = {
  "Pet/Grooming": ["pet", "dog", "cat", "grooming", "paw", "puppy", "kitten", "vet", "animal"],
  "Food/Bakery": ["food", "cake", "bakery", "chef", "recipe", "kitchen", "bake", "cook", "cafe", "restaurant"],
  "Fashion/Boutique": ["fashion", "boutique", "clothing", "style", "outfit", "wear", "apparel", "designer"],
  "Fitness/Gym": ["gym", "fitness", "workout", "training", "coach", "health", "yoga", "nutrition", "personal trainer"],
  "Agriculture/Organic": ["organic", "farm", "agri", "natural", "herb", "plant", "garden", "harvest"],
  "Interior Design": ["interior", "design", "decor", "home", "furniture", "architect", "renovation"],
  "Photography/Studio": ["photo", "photography", "studio", "camera", "portrait", "wedding", "event"],
  "Restaurant/Cloud Kitchen": ["restaurant", "kitchen", "biryani", "food", "delivery", "menu", "dine"],
  "Salon/Beauty": ["salon", "beauty", "hair", "makeup", "skincare", "nail", "spa", "parlour"],
  "Wellness/Yoga": ["yoga", "meditation", "wellness", "mindful", "retreat", "healing", "chakra"],
};

function parseFollowersToNumber(rawFollowers) {
  if (!rawFollowers || typeof rawFollowers !== "string") return null;
  const normalized = rawFollowers.trim().replace(/,/g, "").toUpperCase();
  const match = normalized.match(/([0-9]*\.?[0-9]+)\s*([KM])?/);

  if (!match) return null;

  const value = Number(match[1]);
  if (!Number.isFinite(value)) return null;

  if (match[2] === "K") return Math.round(value * 1000);
  if (match[2] === "M") return Math.round(value * 1000000);

  return Math.round(value);
}

function decodeInstagramTracker(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "l.instagram.com") return url;
    const target = parsed.searchParams.get("u");
    return target ? decodeURIComponent(target) : url;
  } catch {
    return url;
  }
}

function parseMetaFollowers(description) {
  if (!description) return null;
  const match = description.match(/([\d.,]+\s*[KMk]?)\s*Followers/i);
  return match ? match[1].replace(/\s+/g, "") : null;
}

function extractBioFromOgDescription(description) {
  if (!description) return null;
  const parts = description.split(" - ");
  if (parts.length > 1) {
    const bio = parts.slice(1).join(" - ").trim();
    return bio || null;
  }

  const cleaned = description.replace(/^[^,]+Followers,\s*[^,]+Following,\s*[^-]+Posts\s*/i, "").trim();
  return cleaned || null;
}

function detectNiche(text) {
  const haystack = (text || "").toLowerCase();
  if (!haystack.trim()) return null;

  let bestNiche = null;
  let bestScore = 0;

  Object.entries(NICHE_KEYWORDS).forEach(([niche, keywords]) => {
    let score = 0;
    keywords.forEach((word) => {
      if (haystack.includes(word.toLowerCase())) score += 1;
    });

    if (score > bestScore) {
      bestScore = score;
      bestNiche = niche;
    }
  });

  return bestScore > 0 ? bestNiche : null;
}

function findFollowersInDom() {
  const matcher = /([\d.,]+\s*[KMk]?)\s*(Followers|followers)\b/;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

  while (walker.nextNode()) {
    const text = (walker.currentNode && walker.currentNode.nodeValue ? walker.currentNode.nodeValue : "").trim();
    if (!text) continue;

    const match = text.match(matcher);
    if (match) {
      return match[1].replace(/\s+/g, "");
    }
  }

  return null;
}

function findWebsiteSignal() {
  const anchors = Array.from(document.querySelectorAll("a[href]"));
  const candidates = anchors.slice(0, 80);

  for (let i = 0; i < candidates.length; i += 1) {
    const href = candidates[i].getAttribute("href");
    if (!href) continue;

    const resolved = decodeInstagramTracker(href);

    try {
      const parsed = new URL(resolved, window.location.origin);
      const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();

      const isBlockedDomain =
        hostname.endsWith("instagram.com") ||
        hostname.endsWith("facebook.com") ||
        hostname.endsWith("l.instagram.com");

      if (!isBlockedDomain && ["http:", "https:"].includes(parsed.protocol)) {
        return { hasWebsite: "yes", websiteUrl: parsed.toString() };
      }
    } catch {
      continue;
    }
  }

  return { hasWebsite: "no", websiteUrl: null };
}

function scrapeInstagramProfile() {
  const currentUrl = window.location.href;

  const hasInvalidPrefix = INVALID_PATH_PREFIXES.some((prefix) => window.location.pathname.startsWith(prefix));
  if (hasInvalidPrefix || !PROFILE_URL_REGEX.test(currentUrl)) {
    return { isProfilePage: false };
  }

  const username = window.location.pathname.replace(/\//g, "").trim();
  if (!username) {
    return { isProfilePage: false };
  }

  const profileUrl = `https://www.instagram.com/${username}/`;
  const ogTitle = document.querySelector('meta[property="og:title"]')?.content || "";
  const ogDescription = document.querySelector('meta[property="og:description"]')?.content || "";
  const ogImage = document.querySelector('meta[property="og:image"]')?.content || "";

  let displayName = null;
  const titleMatch = ogTitle.match(/^(.*?)\s*\(@[a-zA-Z0-9_.]+\)/);
  if (titleMatch && titleMatch[1]) {
    displayName = titleMatch[1].trim();
  }

  if (!displayName) {
    const pageTitleMatch = document.title.match(/^(.*?)\s*\(@[a-zA-Z0-9_.]+\)/);
    if (pageTitleMatch && pageTitleMatch[1]) {
      displayName = pageTitleMatch[1].trim();
    }
  }

  const metaFollowers = parseMetaFollowers(ogDescription);
  const domFollowers = findFollowersInDom();
  const followers = metaFollowers || domFollowers || null;
  const followersCount = parseFollowersToNumber(followers);

  const bio = extractBioFromOgDescription(ogDescription);
  const website = findWebsiteSignal();
  const detectedNiche = detectNiche(`${bio || ""} ${username}`);

  return {
    username,
    displayName,
    profileUrl,
    followers,
    followersCount,
    bio,
    hasWebsite: website.hasWebsite,
    websiteUrl: website.websiteUrl,
    detectedNiche,
    avatarUrl: ogImage || null,
    scrapedAt: new Date().toISOString(),
    isProfilePage: true,
  };
}

window.scrapeInstagramProfile = scrapeInstagramProfile;

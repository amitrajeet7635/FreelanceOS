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

function formatFollowersCompact(rawFollowers, followersCount) {
  const raw = String(rawFollowers || "").trim();
  const hasCompactSuffix = /[KMB]$/i.test(raw.replace(/\s+/g, ""));

  if (hasCompactSuffix) {
    return raw.toUpperCase();
  }

  if (!Number.isFinite(followersCount) || followersCount === null) {
    return raw || null;
  }

  const count = Number(followersCount);
  if (count >= 1_000_000_000) {
    const n = (count / 1_000_000_000).toFixed(1).replace(/\.0$/, "");
    return `${n}B`;
  }
  if (count >= 1_000_000) {
    const n = (count / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `${n}M`;
  }
  if (count >= 1_000) {
    const n = (count / 1_000).toFixed(1).replace(/\.0$/, "");
    return `${n}K`;
  }

  return String(count);
}

function normalizeFollowerString(value) {
  if (!value) return null;
  const compact = String(value).trim().replace(/\s+/g, "");
  return compact || null;
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
  return match ? normalizeFollowerString(match[1]) : null;
}

function cleanBioCandidate(text, username, displayName) {
  if (!text) return null;

  const normalized = String(text)
    .replace(/\s+/g, " ")
    .replace(/^["'\-•\s]+|["'\-•\s]+$/g, "")
    .trim();

  if (!normalized) return null;

  const lower = normalized.toLowerCase();
  const usernameLower = (username || "").toLowerCase();
  const displayLower = (displayName || "").toLowerCase();

  if (!lower) return null;
  if (usernameLower && lower === usernameLower) return null;
  if (usernameLower && lower === `@${usernameLower}`) return null;
  if (displayLower && lower === displayLower) return null;
  if (/^[\d.,]+\s*[km]?$/i.test(lower)) return null;

  if (
    lower.includes("see instagram photos and videos from") ||
    lower.includes("instagram photos and videos") ||
    /followers?\b|following\b|posts?\b/i.test(lower)
  ) {
    return null;
  }

  return normalized;
}

function extractBioFromOgDescription(description, username, displayName) {
  if (!description) return null;

  const statsPrefix = /^\s*[\d.,]+\s*[KMkMm]?\s*Followers?,\s*[\d.,]+\s*[KMkMm]?\s*Following,?\s*[\d.,]+\s*[KMkMm]?\s*Posts?\s*-?\s*/i;
  const withoutStats = description.replace(statsPrefix, "").trim();

  const dashSplit = withoutStats.split(" - ");
  if (dashSplit.length > 1) {
    const candidate = dashSplit.slice(1).join(" - ").trim();
    const cleaned = cleanBioCandidate(candidate, username, displayName);
    if (cleaned) return cleaned;
  }

  return cleanBioCandidate(withoutStats, username, displayName);
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
      return normalizeFollowerString(match[1]);
    }
  }

  return null;
}

function findFollowersFromProfileLinks(username) {
  if (!username) return null;

  const anchors = Array.from(document.querySelectorAll("a[href]"));
  const targetPath = `/${username}/followers`;

  for (let i = 0; i < anchors.length; i += 1) {
    const href = anchors[i].getAttribute("href") || "";
    if (!href.startsWith(targetPath)) continue;

    const titleNode = anchors[i].querySelector("span[title]");
    const titleValue = titleNode?.getAttribute("title");
    if (titleValue) {
      return normalizeFollowerString(titleValue);
    }

    const text = anchors[i].textContent || "";
    const match = text.match(/([\d.,]+\s*[KMk]?)/);
    if (match) {
      return normalizeFollowerString(match[1]);
    }
  }

  return null;
}

function findBioFromDom() {
  const header = document.querySelector("main header") || document.querySelector("header");
  if (!header) return null;

  const badChunks = [
    "follow",
    "following",
    "message",
    "contact",
    "edit profile",
    "professional dashboard",
    "ad tools",
  ];

  const nodes = header.querySelectorAll("h1, h2, span, div[dir='auto']");
  let best = null;

  for (let i = 0; i < nodes.length; i += 1) {
    const raw = nodes[i]?.textContent?.trim();
    if (!raw) continue;
    if (raw.length < 2 || raw.length > 500) continue;

    const lower = raw.toLowerCase();
    if (/followers?\b|following\b|posts?\b/i.test(lower)) continue;
    if (badChunks.some((chunk) => lower === chunk || lower.includes(chunk))) continue;

    if (!best || raw.length > best.length) best = raw;
  }

  if (best) return best;
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
  const cleanUrl = `${window.location.origin}${window.location.pathname}`;

  const hasInvalidPrefix = INVALID_PATH_PREFIXES.some((prefix) => window.location.pathname.startsWith(prefix));
  if (hasInvalidPrefix || !PROFILE_URL_REGEX.test(cleanUrl)) {
    return { isProfilePage: false };
  }

  const username = window.location.pathname.split("/").filter(Boolean)[0] || "";
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
  const linkFollowers = findFollowersFromProfileLinks(username);
  const domFollowers = findFollowersInDom();
  const followers = metaFollowers || linkFollowers || domFollowers || null;
  const followersCount = parseFollowersToNumber(followers);
  const compactFollowers = formatFollowersCompact(followers, followersCount);

  const metaBio = extractBioFromOgDescription(ogDescription, username, displayName);
  const domBioRaw = findBioFromDom();
  const domBio = cleanBioCandidate(domBioRaw, username, displayName);
  const bio = metaBio || domBio || null;
  const website = findWebsiteSignal();
  const detectedNiche = detectNiche(`${bio || ""} ${username}`);

  return {
    username,
    displayName,
    profileUrl,
  followers: compactFollowers,
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

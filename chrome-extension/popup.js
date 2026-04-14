const STATES = {
  NOT_INSTAGRAM: "NOT_INSTAGRAM",
  LOADING: "LOADING",
  READY: "READY",
  SUBMITTING: "SUBMITTING",
  SUCCESS: "SUCCESS",
  DUPLICATE: "DUPLICATE",
  ERROR: "ERROR",
  NOT_CONFIGURED: "NOT_CONFIGURED",
};

const PRIORITIES = ["P0", "P1", "P2", "P3"];
const PRIORITY_COLORS = {
  P0: "#E24B4A",
  P1: "#EF9F27",
  P2: "#378ADD",
  P3: "#888780",
};

const NICHES = [
  "Pet/Grooming",
  "Food/Bakery",
  "Fashion/Boutique",
  "Fitness/Gym",
  "Agriculture",
  "Interior Design",
  "Photography",
  "Restaurant",
  "Salon/Beauty",
  "Wellness/Yoga",
  "Tech/Startup",
  "E-commerce",
  "Real Estate",
  "Education",
  "Other",
];

const stateEls = {
  NOT_CONFIGURED: document.getElementById("state-not-configured"),
  NOT_INSTAGRAM: document.getElementById("state-not-instagram"),
  LOADING: document.getElementById("state-loading"),
  READY: document.getElementById("state-ready"),
  SUCCESS: document.getElementById("state-success"),
  DUPLICATE: document.getElementById("state-duplicate"),
  ERROR: document.getElementById("state-error"),
};

const settingsBtn = document.getElementById("settingsBtn");
const configureBtn = document.getElementById("configureBtn");
const addLeadBtn = document.getElementById("addLeadBtn");
const addAnotherBtn = document.getElementById("addAnotherBtn");
const tryAgainBtn = document.getElementById("tryAgainBtn");
const notInstagramMessage = document.getElementById("notInstagramMessage");
const errorMessage = document.getElementById("errorMessage");
const successTitle = document.getElementById("successTitle");
const duplicateTitle = document.getElementById("duplicateTitle");
const duplicateStage = document.getElementById("duplicateStage");
const viewInAppLink = document.getElementById("viewInAppLink");
const viewLeadLink = document.getElementById("viewLeadLink");
const profileUrlLink = document.getElementById("profileUrlLink");
const usernameLabel = document.getElementById("usernameLabel");
const displayNameLabel = document.getElementById("displayNameLabel");
const followersBadge = document.getElementById("followersBadge");
const avatarBox = document.getElementById("avatarBox");
const followersInput = document.getElementById("followersInput");
const bioInput = document.getElementById("bioInput");
const notesInput = document.getElementById("notesInput");
const nicheSelect = document.getElementById("nicheSelect");
const priorityCycle = document.getElementById("priorityCycle");
const priorityLabel = document.getElementById("priorityLabel");
const priorityDot = document.getElementById("priorityDot");

let appState = STATES.LOADING;
let storage = { apiKey: "", freelanceOsUrl: "" };
let activeTabId = null;
let scraped = null;
let websiteValue = "unknown";
let priorityValue = "P3";

function showState(nextState) {
  appState = nextState;
  Object.values(stateEls).forEach((el) => el && el.classList.add("hidden"));

  if (nextState === STATES.SUBMITTING) {
    stateEls.READY.classList.remove("hidden");
    addLeadBtn.disabled = true;
    addLeadBtn.innerHTML = '<span class="spinner"></span> Adding...';
    return;
  }

  const target = stateEls[nextState];
  if (target) target.classList.remove("hidden");

  if (addLeadBtn) {
    addLeadBtn.disabled = false;
    addLeadBtn.textContent = "Add to FreelanceOS";
  }
}

function mapErrorMessage(raw) {
  const text = String(raw || "");
  if (text.includes("Invalid API key")) return "Invalid API key. Generate a new one in FreelanceOS Settings.";
  if (text.includes("Can't reach FreelanceOS")) return "Can't reach FreelanceOS. Is it running?";
  if (text.includes("Failed to fetch") || text.includes("Network")) return "Connection error. Check your internet and try again.";
  if (text.includes("already") || text.includes("duplicate")) return "Already in your pipeline";
  return text || "FreelanceOS returned an error. Try again in a moment.";
}

function isInstagramTab(url) {
  return /^https:\/\/www\.instagram\.com\//.test(url || "");
}

function isInstagramProfileUrl(url) {
  if (!url) return false;
  const invalid = /\/explore|\/reel\/|\/p\/|\/stories\/|\/accounts\/|\/direct\/?/;
  if (invalid.test(url)) return false;
  return /^https:\/\/www\.instagram\.com\/[a-zA-Z0-9_.]+\/?$/.test(url);
}

function setWebsitePills(value) {
  websiteValue = value;
  document.querySelectorAll(".website-pill").forEach((btn) => {
    if (btn.dataset.value === value) btn.classList.add("active");
    else btn.classList.remove("active");
  });
}

function cyclePriority() {
  const current = PRIORITIES.indexOf(priorityValue);
  const next = PRIORITIES[(current + 1) % PRIORITIES.length];
  priorityValue = next;
  priorityLabel.textContent = next;
  priorityDot.style.background = PRIORITY_COLORS[next];
}

function initialsFromProfile(data) {
  const candidate = data?.displayName || data?.username || "IG";
  return candidate
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() || "")
    .join("") || "IG";
}

function populateNicheSelect(selected) {
  nicheSelect.innerHTML = "";
  NICHES.forEach((niche) => {
    const option = document.createElement("option");
    option.value = niche;
    option.textContent = niche;
    nicheSelect.appendChild(option);
  });

  nicheSelect.value = selected && NICHES.includes(selected) ? selected : "Other";
}

function applyScrapedData(data) {
  scraped = data;
  usernameLabel.textContent = `@${data.username}`;
  displayNameLabel.textContent = data.displayName || "Instagram profile";
  profileUrlLink.textContent = data.profileUrl;
  profileUrlLink.href = data.profileUrl;
  followersBadge.textContent = data.followers ? `${data.followers} followers` : "followers unknown";
  followersInput.value = data.followers || "";
  bioInput.value = data.bio || "";
  notesInput.value = "";
  populateNicheSelect(data.detectedNiche);
  setWebsitePills(data.hasWebsite || "unknown");
  priorityValue = "P3";
  priorityLabel.textContent = priorityValue;
  priorityDot.style.background = PRIORITY_COLORS[priorityValue];
  avatarBox.textContent = initialsFromProfile(data);
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function scrapeCurrentTab(tabId) {
  await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      if (typeof window.scrapeInstagramProfile === "function") {
        return window.scrapeInstagramProfile();
      }
      return { isProfilePage: false };
    },
  });

  return result?.result || { isProfilePage: false };
}

function buildLeadData() {
  return {
    username: String(scraped?.username || "").trim(),
    followers: followersInput.value.trim() || null,
    bio: bioInput.value.trim() || null,
    profileUrl: scraped?.profileUrl || null,
    hasWebsite: websiteValue,
    niche: nicheSelect.value,
    priority: priorityValue,
    notes: notesInput.value.trim() || null,
  };
}

async function submitLead() {
  const leadData = buildLeadData();

  if (!leadData.username) {
    errorMessage.textContent = "Couldn't read this profile. Try refreshing the page.";
    showState(STATES.ERROR);
    return;
  }

  showState(STATES.SUBMITTING);

  chrome.runtime.sendMessage(
    {
      type: "SAVE_LEAD",
      leadData,
      apiKey: storage.apiKey,
      freelanceOsUrl: storage.freelanceOsUrl,
    },
    (response) => {
      if (chrome.runtime.lastError) {
        errorMessage.textContent = "Connection error. Check your internet and try again.";
        showState(STATES.ERROR);
        return;
      }

      if (response?.success) {
        successTitle.textContent = `Lead added! @${leadData.username} is now in your pipeline`;
        viewInAppLink.href = `${storage.freelanceOsUrl}/leads`;
        showState(STATES.SUCCESS);
        return;
      }

      if (response?.isDuplicate) {
        duplicateTitle.textContent = `@${leadData.username} is already in your pipeline`;
        duplicateStage.textContent = response?.existingLead?.stage || "Found";
        viewLeadLink.href = `${storage.freelanceOsUrl}/leads`;
        showState(STATES.DUPLICATE);
        return;
      }

      errorMessage.textContent = mapErrorMessage(response?.error);
      showState(STATES.ERROR);
    }
  );
}

async function bootstrap() {
  chrome.runtime.sendMessage({ type: "GET_STORAGE" }, async (stored) => {
    if (chrome.runtime.lastError) {
      errorMessage.textContent = "Connection error. Check your internet and try again.";
      showState(STATES.ERROR);
      return;
    }

    storage = {
      apiKey: String(stored?.apiKey || "").trim(),
      freelanceOsUrl: String(stored?.freelanceOsUrl || "").trim(),
    };

    if (!storage.apiKey || !storage.freelanceOsUrl) {
      showState(STATES.NOT_CONFIGURED);
      return;
    }

    const activeTab = await getActiveTab();
    if (!activeTab?.id || !isInstagramTab(activeTab.url || "")) {
      notInstagramMessage.textContent = "Open an Instagram profile to capture a lead";
      showState(STATES.NOT_INSTAGRAM);
      return;
    }

    activeTabId = activeTab.id;

    if (!isInstagramProfileUrl(activeTab.url || "")) {
      notInstagramMessage.textContent = "Navigate to a specific account profile page";
      showState(STATES.NOT_INSTAGRAM);
      return;
    }

    showState(STATES.LOADING);

    try {
      const data = await scrapeCurrentTab(activeTabId);

      if (!data?.isProfilePage) {
        notInstagramMessage.textContent = "Navigate to a specific account profile page";
        showState(STATES.NOT_INSTAGRAM);
        return;
      }

      if (!data?.username) {
        errorMessage.textContent = "Couldn't read this profile. Try refreshing the page.";
        showState(STATES.ERROR);
        return;
      }

      applyScrapedData(data);
      showState(STATES.READY);
    } catch {
      errorMessage.textContent = "Couldn't read this profile. Try refreshing the page.";
      showState(STATES.ERROR);
    }
  });
}

settingsBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());
configureBtn?.addEventListener("click", () => chrome.runtime.openOptionsPage());
addLeadBtn.addEventListener("click", submitLead);
addAnotherBtn?.addEventListener("click", () => {
  if (scraped) {
    applyScrapedData(scraped);
    showState(STATES.READY);
  }
});
tryAgainBtn?.addEventListener("click", bootstrap);

priorityCycle.addEventListener("click", cyclePriority);

document.querySelectorAll(".website-pill").forEach((button) => {
  button.addEventListener("click", () => setWebsitePills(button.dataset.value || "unknown"));
});

bootstrap();

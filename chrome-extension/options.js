const urlInput = document.getElementById("urlInput");
const keyInput = document.getElementById("keyInput");
const toggleKeyBtn = document.getElementById("toggleKeyBtn");
const saveBtn = document.getElementById("saveBtn");
const testBtn = document.getElementById("testBtn");
const saveStatus = document.getElementById("saveStatus");
const connectionStatus = document.getElementById("connectionStatus");
const settingsPageLink = document.getElementById("settingsPageLink");
const recentList = document.getElementById("recentList");

function setStatus(el, text, ok) {
  el.textContent = text;
  el.className = `status ${ok ? "ok" : "bad"}`;
}

function normalizeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    return parsed.origin;
  } catch {
    return raw.replace(/\/+$/, "");
  }
}

function isValidUrl(value) {
  return /^https?:\/\//.test(value || "");
}

function renderConnection(text, ok) {
  connectionStatus.innerHTML = `<span class="indicator" style="background:${ok ? "#4ADE80" : "#F87171"}"></span>${text}`;
  connectionStatus.className = `status ${ok ? "ok" : "bad"}`;
}

function renderRecentLeads(leads) {
  recentList.innerHTML = "";

  if (!Array.isArray(leads) || leads.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No leads captured yet.";
    recentList.appendChild(li);
    return;
  }

  leads.forEach((lead) => {
    const li = document.createElement("li");
    li.textContent = `@${lead.username} • ${lead.stage}`;
    recentList.appendChild(li);
  });
}

function loadSettings() {
  chrome.runtime.sendMessage({ type: "GET_STORAGE" }, (res) => {
    if (chrome.runtime.lastError) {
      renderConnection("Unable to load settings", false);
      return;
    }

    const apiKey = String(res?.apiKey || "");
    const freelanceOsUrl = String(res?.freelanceOsUrl || "");

    urlInput.value = freelanceOsUrl;
    keyInput.value = apiKey;

    if (freelanceOsUrl) {
      settingsPageLink.href = `${freelanceOsUrl}/settings`;
    }
  });

  chrome.runtime.sendMessage({ type: "GET_RECENT_LEADS" }, (res) => {
    if (chrome.runtime.lastError || !res?.success) {
      renderRecentLeads([]);
      return;
    }
    renderRecentLeads(res.recentLeads || []);
  });
}

async function testConnection() {
  const freelanceOsUrl = normalizeUrl(urlInput.value);
  const apiKey = keyInput.value.trim();

  if (!isValidUrl(freelanceOsUrl)) {
    renderConnection("FreelanceOS URL must start with http:// or https://", false);
    return;
  }

  if (apiKey.length !== 40) {
    renderConnection("API key must be exactly 40 characters", false);
    return;
  }

  try {
    const res = await fetch(`${freelanceOsUrl}/api/ext/ping`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401) {
        renderConnection("Invalid API key. Generate a new one in FreelanceOS Settings.", false);
        return;
      }

      if (res.status === 404) {
        renderConnection("FreelanceOS URL looks incorrect. Use base URL like http://localhost:3000", false);
        return;
      }

      renderConnection("FreelanceOS returned an error. Try again in a moment.", false);
      return;
    }

    renderConnection(`Connected as ${data?.user?.email || "user"}`, true);
  } catch {
    renderConnection("Can't reach FreelanceOS. Is it running?", false);
  }
}

saveBtn.addEventListener("click", () => {
  const freelanceOsUrl = normalizeUrl(urlInput.value);
  const apiKey = keyInput.value.trim();

  if (!isValidUrl(freelanceOsUrl)) {
    setStatus(saveStatus, "FreelanceOS URL must start with http:// or https://", false);
    return;
  }

  if (apiKey.length !== 40) {
    setStatus(saveStatus, "API key must be exactly 40 characters", false);
    return;
  }

  chrome.runtime.sendMessage(
    {
      type: "SAVE_SETTINGS",
      apiKey,
      freelanceOsUrl,
    },
    (res) => {
      if (chrome.runtime.lastError || !res?.success) {
        setStatus(saveStatus, "Failed to save settings", false);
        return;
      }

      setStatus(saveStatus, "Settings saved ✓", true);
      settingsPageLink.href = `${freelanceOsUrl}/settings`;
    }
  );
});

testBtn.addEventListener("click", testConnection);

toggleKeyBtn.addEventListener("click", () => {
  const show = keyInput.type === "password";
  keyInput.type = show ? "text" : "password";
  toggleKeyBtn.textContent = show ? "Hide" : "Show";
});

loadSettings();

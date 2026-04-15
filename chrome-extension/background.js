const MAX_RECENT_LEADS = 10;

function safeMessage(errorMessage) {
  if (!errorMessage) return "Something went wrong. Try again.";
  return String(errorMessage);
}

async function getStorageValues() {
  return chrome.storage.local.get(["apiKey", "freelanceOsUrl", "recentLeads"]);
}

async function appendRecentLead(lead) {
  const { recentLeads = [] } = await chrome.storage.local.get(["recentLeads"]);
  const next = [
    {
      id: lead?.id || crypto.randomUUID(),
      username: lead?.username || "unknown",
      stage: lead?.stage || "found",
      createdAt: new Date().toISOString(),
    },
    ...recentLeads,
  ].slice(0, MAX_RECENT_LEADS);

  await chrome.storage.local.set({ recentLeads: next });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || !message.type) {
    sendResponse({ success: false, error: "Invalid message" });
    return false;
  }

  if (message.type === "GET_STORAGE") {
    getStorageValues()
      .then(({ apiKey = "", freelanceOsUrl = "" }) => {
        sendResponse({ apiKey, freelanceOsUrl });
      })
      .catch((err) => sendResponse({ success: false, error: safeMessage(err?.message) }));
    return true;
  }

  if (message.type === "SAVE_SETTINGS") {
    const apiKey = String(message.apiKey || "").trim();
    const freelanceOsUrl = String(message.freelanceOsUrl || "").trim();

    chrome.storage.local
      .set({ apiKey, freelanceOsUrl })
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: safeMessage(err?.message) }));

    return true;
  }

  if (message.type === "GET_RECENT_LEADS") {
    chrome.storage.local
      .get(["recentLeads"])
      .then(({ recentLeads = [] }) => sendResponse({ success: true, recentLeads }))
      .catch((err) => sendResponse({ success: false, error: safeMessage(err?.message) }));

    return true;
  }

  if (message.type === "SAVE_LEAD") {
    const { leadData, apiKey, freelanceOsUrl } = message;

    console.log("[Extension] Submitting lead:", { username: leadData.username, niche: leadData.niche });

    fetch(`${freelanceOsUrl}/api/ext/add-lead`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(leadData),
    })
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));

        console.log(`[Extension] API response: ${res.status}`, payload);

        if (!res.ok) {
          if (res.status === 409 && payload?.isDuplicate) {
            sendResponse({
              success: false,
              isDuplicate: true,
              error: payload?.error || "This lead already exists in your pipeline",
              existingLead: payload.existingLead,
            });
            return;
          }

          if (res.status === 401) {
            sendResponse({
              success: false,
              error: "Invalid API key. Generate a new one in FreelanceOS Settings.",
            });
            return;
          }

          if (res.status >= 500) {
            sendResponse({
              success: false,
              error: "FreelanceOS returned an error. Try again in a moment.",
            });
            return;
          }

          sendResponse({
            success: false,
            error: payload?.error || "Could not add lead.",
          });
          return;
        }

        if (payload?.lead) {
          await appendRecentLead(payload.lead);
        }

        sendResponse({
          success: true,
          lead: payload?.lead,
        });
      })
      .catch(() => {
        console.error("[Extension] Network error connecting to FreelanceOS");
        sendResponse({
          success: false,
          error: "Can't reach FreelanceOS. Is it running?",
        });
      });

    return true;
  }

  sendResponse({ success: false, error: "Unsupported message type" });
  return false;
});

const toggle = document.getElementById("enabled-toggle");

chrome.storage.sync.get({ enabled: true }, (items) => {
  toggle.checked = items.enabled;
});

toggle.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: toggle.checked });
});

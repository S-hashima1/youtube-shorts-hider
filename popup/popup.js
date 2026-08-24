const DEFAULT_KEYWORDS = ["乃木坂"];

const toggle = document.getElementById("enabled-toggle");
const keywordsArea = document.getElementById("keywords");
const saveButton = document.getElementById("save-keywords");
const saveStatus = document.getElementById("save-status");

chrome.storage.sync.get(
  { enabled: true, blockKeywords: DEFAULT_KEYWORDS },
  (items) => {
    toggle.checked = items.enabled;
    keywordsArea.value = items.blockKeywords.join("\n");
  }
);

toggle.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: toggle.checked });
});

saveButton.addEventListener("click", () => {
  const keywords = keywordsArea.value
    .split("\n")
    .map((k) => k.trim())
    .filter(Boolean);
  chrome.storage.sync.set({ blockKeywords: keywords }, () => {
    saveStatus.textContent = "保存しました";
    setTimeout(() => {
      saveStatus.textContent = "";
    }, 2000);
  });
});

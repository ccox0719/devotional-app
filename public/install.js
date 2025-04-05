// install.js

let deferredPrompt;
const installBtn = document.getElementById("install-button");

// If you want to completely remove the dismissal logic, you can comment out or remove this function:
// function shouldShowInstallPrompt() {
//   const dismissedAt = localStorage.getItem("pwaInstallDismissed");
//   if (!dismissedAt) return true;
//   const lastDismissed = new Date(dismissedAt);
//   const now = new Date();
//   const daysSinceDismissed = (now - lastDismissed) / (1000 * 60 * 60 * 24);
//   console.log(`[PWA] Days since dismiss: ${daysSinceDismissed}`);
//   return daysSinceDismissed >= 7;
// }

window.addEventListener("beforeinstallprompt", (e) => {
  console.log("[PWA] beforeinstallprompt event fired");
  // Remove any condition that skips the prompt:
  // if (!shouldShowInstallPrompt()) { return; }
  
  e.preventDefault();
  deferredPrompt = e;
  console.log("[PWA] Install prompt captured");

  // Always show the install button
  installBtn.style.display = "block";

  installBtn.addEventListener("click", () => {
    console.log("[PWA] User clicked install button");
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      console.log(`[PWA] User choice: ${choiceResult.outcome}`);
      // Optionally, you can still record a dismissal:
      if (choiceResult.outcome === "dismissed") {
        localStorage.setItem("pwaInstallDismissed", new Date().toISOString());
      }
      deferredPrompt = null;
      // Do not hide the install button—keep it visible
    });
  });
});

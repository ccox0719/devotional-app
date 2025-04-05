// install.js

let deferredPrompt;
const installBtn = document.getElementById("install-button");

// Listen for the beforeinstallprompt event to capture the install prompt
window.addEventListener("beforeinstallprompt", (e) => {
  console.log("[PWA] beforeinstallprompt event fired");
  e.preventDefault();
  deferredPrompt = e;
  // Always show the install button if not in standalone mode
  installBtn.style.display = "block";
});
document.addEventListener('DOMContentLoaded', function() {
    const installBtn = document.getElementById("install-button");
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      installBtn.style.display = "none";
    }
  });
  
// When the install button is clicked:
installBtn.addEventListener("click", () => {
  // Check if the app is already installed.
  // This works for Chrome (display-mode: standalone) and iOS (navigator.standalone)
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    alert("App is already installed.");
    return;
  }
  
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      console.log(`[PWA] User choice: ${choiceResult.outcome}`);
      deferredPrompt = null;
    });
  } else {
    // If no deferred prompt exists, it may mean the app is already installed.
    alert("App is already installed.");
  }
});

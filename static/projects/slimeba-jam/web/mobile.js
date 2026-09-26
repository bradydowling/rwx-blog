"use strict";

function pulse(duration = 12) {
  if (typeof navigator.vibrate === "function") navigator.vibrate(duration);
}

const stage = document.querySelector(".stage");
const fullscreenButton = document.getElementById("fullscreen-button");
function refreshFullscreenButton() {
  const expanded = document.fullscreenElement === stage || stage.classList.contains("expanded");
  fullscreenButton.textContent = expanded ? "EXIT FULLSCREEN" : "FULLSCREEN";
  fullscreenButton.setAttribute("aria-pressed", String(expanded));
}
fullscreenButton.addEventListener("click", async () => {
  pulse();
  if (document.fullscreenElement === stage) await document.exitFullscreen();
  else if (stage.classList.contains("expanded")) stage.classList.remove("expanded");
  else if (stage.requestFullscreen) {
    try { await stage.requestFullscreen(); }
    catch { stage.classList.add("expanded"); }
  } else stage.classList.add("expanded");
  refreshFullscreenButton();
});
document.addEventListener("fullscreenchange", refreshFullscreenButton);

// The game owns the input rules; these buttons only hold and release the
// corresponding action so multiple fingers can move and shoot together.
for (const button of document.querySelectorAll("[data-control]")) {
  const action = button.dataset.control;
  let pointer = null;
  button.addEventListener("pointerdown", event => {
    event.preventDefault();
    if (pointer !== null) return;
    pointer = event.pointerId;
    pulse();
    button.setPointerCapture(event.pointerId);
    button.classList.add("pressed");
    window.slimebaInput.control(action, true);
  });
  const release = event => {
    if (pointer !== event.pointerId) return;
    pointer = null;
    button.classList.remove("pressed");
    window.slimebaInput.control(action, false);
  };
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
  window.addEventListener("blur", () => {
    if (pointer === null) return;
    pointer = null;
    button.classList.remove("pressed");
    window.slimebaInput.control(action, false);
  });
}

document.getElementById("match-button").addEventListener("click", () => { pulse(18); window.slimebaInput.start(); });
document.getElementById("touch-start").addEventListener("click", () => { pulse(18); window.slimebaInput.start(); });

function refreshMenu() {
  const state = window.trashBasketballState();
  const values = [state.teams[0], state.teams[1], state.arena, state.ballType];
  for (const row of document.querySelectorAll(".mobile-option")) {
    const index = Number(row.dataset.option);
    row.querySelector("output").textContent = values[index];
    const badge = row.querySelector(".cpu-toggle");
    if (badge) {
      badge.textContent = state.cpuChoices[index] ? "CPU" : "HUMAN";
      badge.classList.toggle("is-cpu", state.cpuChoices[index]);
    }
  }
}
for (const row of document.querySelectorAll(".mobile-option")) {
  const index = Number(row.dataset.option);
  row.querySelector(".prev").addEventListener("click", () => { pulse(); window.slimebaInput.menuChange(index, -1); refreshMenu(); });
  row.querySelector(".next").addEventListener("click", () => { pulse(); window.slimebaInput.menuChange(index, 1); refreshMenu(); });
  const badge = row.querySelector(".cpu-toggle");
  if (badge) badge.addEventListener("click", () => { pulse(); window.slimebaInput.menuCpu(index); refreshMenu(); });
}
refreshMenu();

// The browser game also works as a file; service workers only register on
// HTTPS (or localhost) and stay inside this game's directory on the blog.
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(error => {
      console.warn("Offline game setup failed:", error);
    });
  });
}

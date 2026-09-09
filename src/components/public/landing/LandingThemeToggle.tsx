"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../LandingPage.module.css";

type ScoutTheme = "light" | "dark";

function currentTheme(): ScoutTheme {
  return document.documentElement.dataset.scoutTheme === "dark" ? "dark" : "light";
}

function syncControl(button: HTMLButtonElement | null, theme: ScoutTheme) {
  if (!button) return;
  button.setAttribute("aria-pressed", String(theme === "dark"));
  button.setAttribute(
    "aria-label",
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
  );
}

export function LandingThemeToggle() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    syncControl(buttonRef.current, currentTheme());
    setReady(true);
  }, []);

  function toggleTheme() {
    const nextTheme: ScoutTheme = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.scoutTheme = nextTheme;
    syncControl(buttonRef.current, nextTheme);
    try {
      window.localStorage.setItem("scoutlane-theme", nextTheme);
    } catch {
      // The theme remains usable when storage is unavailable or quota-blocked.
    }
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className={styles.themeToggle}
      aria-label="Switch to dark theme"
      aria-pressed="false"
      disabled={!ready}
      onClick={toggleTheme}
    >
      <span className={styles.themeTrack} aria-hidden="true">
        <span />
      </span>
      <span className={styles.themeLabelLight} aria-hidden="true">Light</span>
      <span className={styles.themeLabelDark} aria-hidden="true">Dark</span>
    </button>
  );
}

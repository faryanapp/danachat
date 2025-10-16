import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useColorScheme } from "../useColorScheme";

const STORAGE_KEY = "chatkit-color-scheme";

type MediaQueryListener = (event: MediaQueryListEvent) => void;

type MatchMediaMock = MediaQueryList & {
  setMatches: (value: boolean) => void;
};

const PREFERS_DARK_QUERY = "(prefers-color-scheme: dark)";

const listeners = new Set<MediaQueryListener>();

let matchMediaMock: MatchMediaMock;

function createMatchMediaMock(initialMatches: boolean): MatchMediaMock {
  let matches = initialMatches;

  const notify = () => {
    const event = { matches } as MediaQueryListEvent;
    listeners.forEach((listener) => listener(event));
  };

  return {
    matches,
    media: PREFERS_DARK_QUERY,
    onchange: null,
    addEventListener: (_type: string, listener: MediaQueryListener) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: MediaQueryListener) => {
      listeners.delete(listener);
    },
    addListener: (listener: MediaQueryListener) => {
      listeners.add(listener);
    },
    removeListener: (listener: MediaQueryListener) => {
      listeners.delete(listener);
    },
    dispatchEvent: () => true,
    setMatches: (value: boolean) => {
      if (matches === value) {
        return;
      }
      matches = value;
      matchMediaMock.matches = value;
      notify();
    },
  } as MatchMediaMock;
}

function setupMatchMedia(initialMatches: boolean) {
  listeners.clear();
  matchMediaMock = createMatchMediaMock(initialMatches);
  window.matchMedia = vi.fn().mockImplementation(() => matchMediaMock);
}

function resetDocumentScheme() {
  const { documentElement } = document;
  documentElement.dataset.colorScheme = "";
  documentElement.classList.remove("dark");
  documentElement.style.colorScheme = "";
}

describe("useColorScheme", () => {
  beforeEach(() => {
    localStorage.clear();
    resetDocumentScheme();
    setupMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses the system preference when set to system and reacts to media changes", () => {
    const { result } = renderHook(() => useColorScheme("system"));

    expect(result.current.scheme).toBe("light");
    expect(result.current.preference).toBe("system");
    expect(document.documentElement.dataset.colorScheme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);

    act(() => {
      matchMediaMock.setMatches(true);
    });

    expect(result.current.scheme).toBe("dark");
    expect(document.documentElement.dataset.colorScheme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("reads the persisted preference when available", () => {
    localStorage.setItem(STORAGE_KEY, "dark");
    setupMatchMedia(false);

    const { result } = renderHook(() => useColorScheme());

    expect(result.current.preference).toBe("dark");
    expect(result.current.scheme).toBe("dark");
    expect(document.documentElement.dataset.colorScheme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("persists updates when the preference changes", () => {
    const { result } = renderHook(() => useColorScheme());

    act(() => {
      result.current.setPreference("dark");
    });

    expect(result.current.preference).toBe("dark");
    expect(result.current.scheme).toBe("dark");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.dataset.colorScheme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    act(() => {
      result.current.resetPreference();
    });

    expect(result.current.preference).toBe("system");
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("responds to storage events from other tabs", () => {
    const { result } = renderHook(() => useColorScheme());

    expect(result.current.preference).toBe("system");
    expect(result.current.scheme).toBe("light");

    act(() => {
      localStorage.setItem(STORAGE_KEY, "dark");
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: STORAGE_KEY,
          newValue: "dark",
        })
      );
    });

    expect(result.current.preference).toBe("dark");
    expect(result.current.scheme).toBe("dark");
    expect(document.documentElement.dataset.colorScheme).toBe("dark");
  });
});

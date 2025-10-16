import "@testing-library/jest-dom/vitest";

// Provide a noop scrollTo implementation to avoid jsdom warnings during tests.
if (typeof window !== "undefined" && !window.scrollTo) {
  window.scrollTo = () => {
    // no-op
  };
}

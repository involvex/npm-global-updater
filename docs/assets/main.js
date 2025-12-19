/**
 * npm-updater Documentation Site
 * Interactive functionality for the documentation website
 */

// Theme Management
class ThemeManager {
  constructor() {
    this.theme = localStorage.getItem("theme") || "light";
    this.init();
  }

  init() {
    this.applyTheme();
    this.bindEvents();
  }

  applyTheme() {
    document.documentElement.setAttribute("data-theme", this.theme);
    localStorage.setItem("theme", this.theme);
  }

  toggle() {
    this.theme = this.theme === "light" ? "dark" : "light";
    this.applyTheme();
  }

  bindEvents() {
    const themeToggle = document.querySelector(".theme-toggle");
    if (themeToggle) {
      themeToggle.addEventListener("click", () => this.toggle());
    }
  }
}

// Navigation Management
class NavigationManager {
  constructor() {
    this.init();
  }

  init() {
    this.bindMobileNav();
    this.highlightActiveNav();
  }

  bindMobileNav() {
    const navToggle = document.querySelector(".nav-toggle");
    const navMenu = document.querySelector(".nav-links");

    if (navToggle && navMenu) {
      navToggle.addEventListener("click", () => {
        const isExpanded = navToggle.getAttribute("aria-expanded") === "true";
        navToggle.setAttribute("aria-expanded", !isExpanded);
        navMenu.classList.toggle("active");
      });

      // Close mobile menu when clicking outside
      document.addEventListener("click", e => {
        if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
          navToggle.setAttribute("aria-expanded", "false");
          navMenu.classList.remove("active");
        }
      });

      // Close mobile menu when clicking on a link
      const navLinks = navMenu.querySelectorAll(".nav-link");
      navLinks.forEach(link => {
        link.addEventListener("click", () => {
          navToggle.setAttribute("aria-expanded", "false");
          navMenu.classList.remove("active");
        });
      });
    }
  }

  highlightActiveNav() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll(".nav-link");

    navLinks.forEach(link => {
      const href = link.getAttribute("href");
      if (href && currentPath.includes(href.replace(".html", ""))) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }
}

// Code Copy Functionality
class CodeManager {
  constructor() {
    this.init();
  }

  init() {
    this.bindCopyButtons();
  }

  bindCopyButtons() {
    const copyButtons = document.querySelectorAll(".code-copy-btn");

    copyButtons.forEach(button => {
      button.addEventListener("click", () => {
        const codeBlock = button.nextElementSibling;
        if (codeBlock) {
          this.copyCode(button, codeBlock);
        }
      });
    });
  }

  copyCode(button, codeBlock) {
    const code = codeBlock.textContent;

    navigator.clipboard
      .writeText(code)
      .then(() => {
        const originalText = button.textContent;
        button.textContent = "Copied!";
        button.classList.add("copied");

        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove("copied");
        }, 2000);
      })
      .catch(err => {
        console.error("Failed to copy code: ", err);
        // Fallback for older browsers
        this.fallbackCopyTextToClipboard(code, button);
      });
  }

  fallbackCopyTextToClipboard(text, button) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand("copy");
      if (successful) {
        const originalText = button.textContent;
        button.textContent = "Copied!";
        button.classList.add("copied");

        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove("copied");
        }, 2000);
      }
    } catch (err) {
      console.error("Fallback: Oops, unable to copy", err);
    }

    document.body.removeChild(textArea);
  }
}

// Smooth Scrolling
class ScrollManager {
  constructor() {
    this.init();
  }

  init() {
    this.bindSmoothScrolling();
    this.addScrollAnimations();
  }

  bindSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
      link.addEventListener("click", e => {
        const href = link.getAttribute("href");
        if (href && href !== "#") {
          e.preventDefault();
          const target = document.querySelector(href);

          if (target) {
            const headerHeight = document.querySelector(".header").offsetHeight;
            const targetPosition = target.offsetTop - headerHeight - 20;

            window.scrollTo({
              top: targetPosition,
              behavior: "smooth",
            });
          }
        }
      });
    });
  }

  addScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("fade-in");
        }
      });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll(
      ".feature-card, .step, .command-card, .hero-text, .hero-terminal",
    );

    animateElements.forEach(el => {
      observer.observe(el);
    });
  }
}

// Search Functionality (for future enhancement)
class SearchManager {
  constructor() {
    this.init();
  }

  init() {
    // Placeholder for search functionality
    // This can be expanded to include search across the documentation
  }
}

// Performance Manager
class PerformanceManager {
  constructor() {
    this.init();
  }

  init() {
    this.lazyLoadImages();
    this.optimizeAnimations();
  }

  lazyLoadImages() {
    if ("IntersectionObserver" in window) {
      const imageObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute("data-src");
              imageObserver.unobserve(img);
            }
          }
        });
      });

      const lazyImages = document.querySelectorAll("img[data-src]");
      lazyImages.forEach(img => imageObserver.observe(img));
    }
  }

  optimizeAnimations() {
    // Respect user's motion preferences
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.classList.add("reduce-motion");
    }
  }
}

// Accessibility Manager
class AccessibilityManager {
  constructor() {
    this.init();
  }

  init() {
    this.enhanceKeyboardNavigation();
    this.addSkipLinks();
    this.manageFocus();
  }

  enhanceKeyboardNavigation() {
    // Enhanced keyboard navigation for interactive elements
    const interactiveElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    interactiveElements.forEach(element => {
      element.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
          if (
            element.tagName === "BUTTON" ||
            element.getAttribute("role") === "button"
          ) {
            e.preventDefault();
            element.click();
          }
        }
      });
    });
  }

  addSkipLinks() {
    // Skip links are already in HTML, but ensure they're properly configured
    const skipLink = document.querySelector(".skip-link");
    if (skipLink) {
      skipLink.addEventListener("click", e => {
        e.preventDefault();
        const target = document.querySelector(skipLink.getAttribute("href"));
        if (target) {
          target.focus();
          target.scrollIntoView();
        }
      });
    }
  }

  manageFocus() {
    // Manage focus for modal dialogs and other interactive components
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        // Close any open modals or dropdowns
        const navMenu = document.querySelector(".nav-links");
        const navToggle = document.querySelector(".nav-toggle");

        if (navMenu && navMenu.classList.contains("active")) {
          navToggle.setAttribute("aria-expanded", "false");
          navMenu.classList.remove("active");
          navToggle.focus();
        }
      }
    });
  }
}

// Error Handling
class ErrorManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupGlobalErrorHandling();
  }

  setupGlobalErrorHandling() {
    window.addEventListener("error", e => {
      console.error("Global error:", e.error);
      // Could send error reports to analytics service
    });

    window.addEventListener("unhandledrejection", e => {
      console.error("Unhandled promise rejection:", e.reason);
      // Could send error reports to analytics service
    });
  }
}

// Main Application
class App {
  constructor() {
    this.managers = {};
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        this.initializeManagers(),
      );
    } else {
      this.initializeManagers();
    }
  }

  initializeManagers() {
    try {
      // Initialize all managers
      this.managers.theme = new ThemeManager();
      this.managers.navigation = new NavigationManager();
      this.managers.code = new CodeManager();
      this.managers.scroll = new ScrollManager();
      this.managers.search = new SearchManager();
      this.managers.performance = new PerformanceManager();
      this.managers.accessibility = new AccessibilityManager();
      this.managers.error = new ErrorManager();

      // Add any page-specific initialization here
      this.initializePageSpecific();
    } catch (error) {
      console.error("Error initializing app:", error);
    }
  }

  initializePageSpecific() {
    // Page-specific initialization logic
    this.initializeTerminalAnimations();
    this.initializeFeatureCards();
  }

  initializeTerminalAnimations() {
    // Add typing animation to terminal
    const terminalLines = document.querySelectorAll(".terminal-line");
    terminalLines.forEach((line, index) => {
      line.style.animationDelay = `${index * 0.5}s`;
      line.classList.add("fade-in");
    });
  }

  initializeFeatureCards() {
    // Add hover effects to feature cards
    const featureCards = document.querySelectorAll(".feature-card");
    featureCards.forEach((card, index) => {
      card.style.animationDelay = `${index * 0.1}s`;
    });
  }

  // Public API for external scripts
  static getInstance() {
    if (!window.npmUpdaterDocs) {
      window.npmUpdaterDocs = new App();
    }
    return window.npmUpdaterDocs;
  }
}

// Initialize the application
const app = App.getInstance();

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    App,
    ThemeManager,
    NavigationManager,
    CodeManager,
    ScrollManager,
  };
}

// Make app available globally
window.npmUpdaterDocs = app;

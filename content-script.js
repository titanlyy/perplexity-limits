// content-script.js — minimal presence on perplexity.ai pages
(function () {
  let lastPath = location.pathname;
  setInterval(() => {
    if (location.pathname !== lastPath) {
      lastPath = location.pathname;
    }
  }, 1000);
})();

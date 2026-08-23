(() => {
  const PLAN_PRICES_RUB = [199.99, 449.99, 905];
  const FALLBACK_USD_RUB = 83.88;
  const CACHE_KEY = "veicloud_usd_rub_rate";
  const CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
  const REFRESH_INTERVAL_MS = 30 * 60 * 1000;

  function priceElements() {
    return Array.from(document.querySelectorAll(".plan-choice-price strong"));
  }

  function formatUsd(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  function renderPrices(usdRubRate) {
    if (!Number.isFinite(usdRubRate) || usdRubRate <= 0) return;

    const elements = priceElements();
    PLAN_PRICES_RUB.forEach((rubPrice, index) => {
      if (!elements[index]) return;
      elements[index].textContent = formatUsd(rubPrice / usdRubRate);
    });
  }

  function readCachedRate() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (!cached || !Number.isFinite(cached.rate) || cached.rate <= 0) return null;
      if (!Number.isFinite(cached.savedAt)) return null;
      if (Date.now() - cached.savedAt > CACHE_MAX_AGE_MS) return null;
      return cached.rate;
    } catch {
      return null;
    }
  }

  function saveRate(rate) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        rate,
        savedAt: Date.now()
      }));
    } catch {
      // Si el navegador bloquea localStorage, simplemente seguimos sin caché.
    }
  }

  async function fetchUsdRubRate() {
    const sources = [
      async () => {
        const response = await fetch("https://open.er-api.com/v6/latest/USD", {
          cache: "no-store"
        });
        if (!response.ok) throw new Error("FX_SOURCE_1");
        const payload = await response.json();
        return Number(payload?.rates?.RUB);
      },
      async () => {
        const response = await fetch("https://api.frankfurter.app/latest?from=USD&to=RUB", {
          cache: "no-store"
        });
        if (!response.ok) throw new Error("FX_SOURCE_2");
        const payload = await response.json();
        return Number(payload?.rates?.RUB);
      }
    ];

    for (const source of sources) {
      try {
        const rate = await source();
        if (Number.isFinite(rate) && rate > 0) return rate;
      } catch {
        // Probamos automáticamente la siguiente fuente.
      }
    }

    return null;
  }

  async function refreshMarketPrices() {
    const liveRate = await fetchUsdRubRate();
    if (liveRate) {
      saveRate(liveRate);
      renderPrices(liveRate);
      return;
    }

    const cachedRate = readCachedRate();
    renderPrices(cachedRate || FALLBACK_USD_RUB);
  }

  function bootMarketPrices() {
    renderPrices(readCachedRate() || FALLBACK_USD_RUB);
    refreshMarketPrices();

    setInterval(() => {
      if (!document.hidden) refreshMarketPrices();
    }, REFRESH_INTERVAL_MS);

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) refreshMarketPrices();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootMarketPrices, { once: true });
  } else {
    bootMarketPrices();
  }
})();

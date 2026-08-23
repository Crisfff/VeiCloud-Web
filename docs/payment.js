(() => {
  const API_BASE = "https://api.veicloud.online:8443";
  const POLL_INTERVAL_MS = 4000;

  const checkoutCard = document.getElementById("checkoutCard");
  const paymentSuccess = document.getElementById("paymentSuccess");
  const loading = document.getElementById("checkoutLoading");
  const content = document.getElementById("checkoutContent");
  const errorBox = document.getElementById("checkoutError");
  const errorText = document.getElementById("checkoutErrorText");
  const statusLabel = document.getElementById("statusLabel");
  const paymentState = document.getElementById("paymentState");
  const paymentTimer = document.getElementById("paymentTimer");
  const planName = document.getElementById("planName");
  const invoiceId = document.getElementById("invoiceId");
  const paymentAmount = document.getElementById("paymentAmount");
  const currencyName = document.getElementById("currencyName");
  const networkName = document.getElementById("networkName");
  const addressNetwork = document.getElementById("addressNetwork");
  const currencyIcon = document.getElementById("currencyIcon");
  const walletAddress = document.getElementById("walletAddress");
  const copyAddress = document.getElementById("copyAddress");
  const verificationStatus = document.getElementById("verificationStatus");
  const confirmations = document.getElementById("confirmations");
  const progressBar = document.getElementById("progressBar");
  const verificationHelp = document.getElementById("verificationHelp");
  const txRow = document.getElementById("txRow");
  const txHash = document.getElementById("txHash");
  const paymentQr = document.getElementById("paymentQr");

  const token = new URLSearchParams(location.search).get("token") || "";
  let expiresAtMs = null;
  let timerHandle = null;
  let pollHandle = null;
  let lastQrValue = "";
  let finalState = false;

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons();
  }

  function showError(message) {
    paymentSuccess?.classList.add("hidden");
    checkoutCard?.classList.remove("hidden");
    loading.classList.add("hidden");
    content.classList.add("hidden");
    errorText.textContent = message || "This payment link is invalid or unavailable.";
    errorBox.classList.remove("hidden");
  }

  function showPaymentSuccess() {
    finalState = true;
    checkoutCard?.classList.add("hidden");
    paymentSuccess?.classList.remove("hidden");
    refreshIcons();

    if (pollHandle) {
      clearInterval(pollHandle);
      pollHandle = null;
    }
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
    }
  }

  function planLabel(value) {
    const normalized = String(value || "").toLowerCase();
    if (normalized === "premium") return "Premium";
    if (normalized === "gold") return "Gold";
    return "Standard";
  }

  function networkLabel(currency, network) {
    const n = String(network || "").toUpperCase();
    if (String(currency || "").toUpperCase() === "USDT") {
      return n.includes("BEP") || n.includes("BSC") ? "BNB Smart Chain · BEP20" : network || "BNB Smart Chain";
    }
    if (String(currency || "").toUpperCase() === "LTC") return "Litecoin";
    return network || "Network";
  }

  function iconFor(currency) {
    return String(currency || "").toUpperCase() === "USDT"
      ? "assets/payments/usdt-bep20.png"
      : "assets/payments/ltc-litecoin.png";
  }

  function formatCryptoAmount(rawValue) {
    const raw = String(rawValue ?? "0").trim();
    const number = Number(raw);
    if (!Number.isFinite(number)) return "0.00";

    const decimalsInSource = raw.includes(".") ? raw.split(".")[1].length : 0;
    const maxDecimals = Math.min(Math.max(decimalsInSource, 2), 8);
    let formatted = number.toFixed(maxDecimals);

    if (formatted.includes(".")) {
      const [whole, fraction] = formatted.split(".");
      const trimmed = fraction.replace(/0+$/, "");
      formatted = `${whole}.${trimmed.padEnd(2, "0")}`;
    }

    return formatted;
  }

  function makeQrValue(data) {
    const address = data?.crypto?.address || "";
    const amount = data?.crypto?.amount || "";
    const currency = String(data?.crypto?.currency || "").toUpperCase();
    if (currency === "LTC" && address) return `litecoin:${address}?amount=${amount}`;
    return address;
  }

  function renderQr(value) {
    if (!value || value === lastQrValue) return;
    lastQrValue = value;
    paymentQr.innerHTML = "";
    if (window.QRCode) {
      new window.QRCode(paymentQr, {
        text: value,
        width: 188,
        height: 188,
        correctLevel: window.QRCode.CorrectLevel.M
      });
    } else {
      paymentQr.textContent = "QR unavailable";
    }
  }

  function setStatusVisual(status, confs, received) {
    const normalized = String(status || "PENDING").toUpperCase();
    paymentState.classList.remove("detected", "paid", "expired");

    if (normalized === "PAID") {
      showPaymentSuccess();
      return;
    }

    if (normalized === "EXPIRED") {
      paymentState.classList.add("expired");
      statusLabel.textContent = "Payment expired";
      verificationStatus.textContent = "Invoice expired";
      verificationHelp.textContent = "This invoice can no longer accept a payment. Create a new invoice from your account.";
      progressBar.style.width = "0%";
      finalState = true;
      return;
    }

    if (Number(confs) > 0 || Number(received) > 0 || normalized !== "PENDING") {
      paymentState.classList.add("detected");
      statusLabel.textContent = "Payment detected";
      verificationStatus.textContent = "Confirming transaction";
      verificationHelp.textContent = "Your transaction was detected. VeiCloud is waiting for the required blockchain confirmations.";
      progressBar.style.width = `${Math.min(92, 20 + Number(confs || 0) * 12)}%`;
      return;
    }

    statusLabel.textContent = "Waiting for payment";
    verificationStatus.textContent = "Waiting for transaction";
    verificationHelp.textContent = "The page checks your payment automatically every few seconds.";
    progressBar.style.width = "8%";
  }

  function renderInvoice(data) {
    const crypto = data?.crypto || {};
    const currency = String(crypto.currency || "").toUpperCase();
    const network = networkLabel(currency, crypto.network);

    if (String(data?.status || "").toUpperCase() === "PAID") {
      showPaymentSuccess();
      return;
    }

    planName.textContent = planLabel(data?.plan);
    invoiceId.textContent = data?.invoice_id || "VC-";
    paymentAmount.textContent = `${formatCryptoAmount(crypto.amount)} ${currency}`;
    currencyName.textContent = currency || "Crypto";
    networkName.textContent = network;
    addressNetwork.textContent = network;
    currencyIcon.src = iconFor(currency);
    currencyIcon.alt = currency || "Crypto";
    walletAddress.textContent = crypto.address || "Unavailable";
    confirmations.textContent = `${Number(data?.confirmations || 0)} confirmation${Number(data?.confirmations || 0) === 1 ? "" : "s"}`;

    const received = Number(crypto.received_amount || 0);
    setStatusVisual(data?.status, data?.confirmations, received);

    if (data?.tx_hash) {
      txHash.textContent = data.tx_hash;
      txRow.classList.remove("hidden");
    } else {
      txRow.classList.add("hidden");
    }

    const secondsRemaining = Number(data?.seconds_remaining);
    if (Number.isFinite(secondsRemaining) && secondsRemaining >= 0) {
      expiresAtMs = Date.now() + (secondsRemaining * 1000);
    }

    renderQr(makeQrValue(data));

    paymentSuccess?.classList.add("hidden");
    checkoutCard?.classList.remove("hidden");
    loading.classList.add("hidden");
    errorBox.classList.add("hidden");
    content.classList.remove("hidden");
  }

  async function fetchInvoice() {
    if (!token) {
      showError("Missing payment token.");
      return null;
    }

    const response = await fetch(`${API_BASE}/api/payments/crypto/checkout/${encodeURIComponent(token)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    let payload = null;
    try { payload = await response.json(); } catch {}

    if (!response.ok) {
      const message = payload?.detail?.message || payload?.detail || "This payment link is invalid or unavailable.";
      throw new Error(String(message));
    }

    return payload;
  }

  async function refreshInvoice() {
    try {
      const data = await fetchInvoice();
      if (!data) return;
      renderInvoice(data);
    } catch (error) {
      if (content.classList.contains("hidden") && paymentSuccess?.classList.contains("hidden")) {
        showError(error.message);
      }
    }
  }

  function updateTimer() {
    if (!Number.isFinite(expiresAtMs)) {
      paymentTimer.textContent = "20:00";
      return;
    }

    const remaining = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    paymentTimer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

    if (remaining <= 0 && !finalState) refreshInvoice();
  }

  copyAddress.addEventListener("click", async () => {
    const value = walletAddress.textContent.trim();
    if (!value || value === "Unavailable") return;
    try {
      await navigator.clipboard.writeText(value);
      const old = copyAddress.textContent;
      copyAddress.textContent = "Copied";
      setTimeout(() => { copyAddress.textContent = old; }, 1200);
    } catch {
      window.prompt("Copy wallet address:", value);
    }
  });

  async function boot() {
    refreshIcons();

    if (!token) {
      showError("Missing payment token.");
      return;
    }

    paymentTimer.textContent = "20:00";
    await refreshInvoice();

    if (!finalState) {
      updateTimer();
      timerHandle = setInterval(updateTimer, 1000);
      pollHandle = setInterval(refreshInvoice, POLL_INTERVAL_MS);
    }
  }

  window.addEventListener("load", refreshIcons);
  window.addEventListener("beforeunload", () => {
    if (timerHandle) clearInterval(timerHandle);
    if (pollHandle) clearInterval(pollHandle);
  });

  boot();
})();

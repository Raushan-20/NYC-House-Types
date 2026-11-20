const API_BASE_URL = "http://127.0.0.1:8000";

const PRESETS = {
  manhattan_apt: {
    neighbourhood_group: "Manhattan",
    neighbourhood: "Midtown",
    latitude: 40.7549,
    longitude: -73.984,
    price: 230,
    minimum_nights: 2,
    availability_365: 140,
    number_of_reviews: 68,
    reviews_per_month: 2.4,
    calculated_host_listings_count: 1,
  },
  brooklyn_private: {
    neighbourhood_group: "Brooklyn",
    neighbourhood: "Bedford-Stuyvesant",
    latitude: 40.6834,
    longitude: -73.9412,
    price: 78,
    minimum_nights: 4,
    availability_365: 215,
    number_of_reviews: 94,
    reviews_per_month: 3.1,
    calculated_host_listings_count: 3,
  },
  queens_shared: {
    neighbourhood_group: "Queens",
    neighbourhood: "Astoria",
    latitude: 40.7644,
    longitude: -73.9235,
    price: 45,
    minimum_nights: 1,
    availability_365: 310,
    number_of_reviews: 19,
    reviews_per_month: 0.85,
    calculated_host_listings_count: 6,
  },
  bronx_budget: {
    neighbourhood_group: "Bronx",
    neighbourhood: "Fordham",
    latitude: 40.8626,
    longitude: -73.8966,
    price: 62,
    minimum_nights: 2,
    availability_365: 260,
    number_of_reviews: 31,
    reviews_per_month: 1.4,
    calculated_host_listings_count: 2,
  },
};

// DOM Elements
const form = document.getElementById("predictForm");
const submitBtn = document.getElementById("submitBtn");
const submitLabel = document.getElementById("submitLabel");
const btnSpinner = document.getElementById("btnSpinner");
const resetBtn = document.getElementById("resetBtn");
const formError = document.getElementById("formError");

const apiStatus = document.getElementById("apiStatus");
const statusText = document.getElementById("statusText");
const latencyBadge = document.getElementById("latencyBadge");

const idleState = document.getElementById("idleState");
const resultState = document.getElementById("resultState");
const predictedRoomTypeEl = document.getElementById("predictedRoomType");
const confidencePill = document.getElementById("confidencePill");
const probabilityList = document.getElementById("probabilityList");
const jsonInspector = document.getElementById("jsonInspector");

// Check FastAPI health on load
async function checkBackendStatus() {
  try {
    const res = await fetch(`${API_BASE_URL}/`, { method: "GET" });
    if (res.ok) {
      apiStatus.classList.remove("offline");
      apiStatus.classList.add("online");
      statusText.textContent = "API Connected (:8000)";
    } else {
      throw new Error(`HTTP ${res.status}`);
    }
  } catch {
    apiStatus.classList.remove("online");
    apiStatus.classList.add("offline");
    statusText.textContent = "API Offline (:8000)";
  }
}

function applyPreset(presetKey) {
  const data = PRESETS[presetKey];
  if (!data) return;

  Object.entries(data).forEach(([key, val]) => {
    const el = document.getElementById(key);
    if (el) el.value = val;
  });

  document.querySelectorAll(".chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.preset === presetKey);
  });

  hideError();
}

function showError(msg) {
  formError.textContent = msg;
  formError.classList.remove("hidden");
}

function hideError() {
  formError.textContent = "";
  formError.classList.add("hidden");
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitLabel.textContent = isLoading ? "Predicting..." : "Predict Room Type";
  btnSpinner.classList.toggle("hidden", !isLoading);
}

function collectPayload() {
  const payload = {
    latitude: parseFloat(document.getElementById("latitude").value),
    longitude: parseFloat(document.getElementById("longitude").value),
    price: parseFloat(document.getElementById("price").value),
    minimum_nights: parseInt(document.getElementById("minimum_nights").value, 10),
    number_of_reviews: parseInt(document.getElementById("number_of_reviews").value, 10),
    reviews_per_month: parseFloat(document.getElementById("reviews_per_month").value),
    calculated_host_listings_count: parseInt(
      document.getElementById("calculated_host_listings_count").value,
      10
    ),
    availability_365: parseInt(document.getElementById("availability_365").value, 10),
    neighbourhood_group: document.getElementById("neighbourhood_group").value.trim(),
    neighbourhood: document.getElementById("neighbourhood").value.trim(),
  };

  if (Object.values(payload).some((v) => typeof v === "number" && Number.isNaN(v))) {
    throw new Error("Please enter valid numeric values in all number fields.");
  }
  if (!payload.neighbourhood) {
    throw new Error("Neighbourhood name cannot be empty.");
  }
  if (payload.price <= 0) {
    throw new Error("Price per night must be greater than 0.");
  }

  return payload;
}

// Map probability array to room type labels cleanly even if class count varies
function buildProbabilityEntries(probs, predictedLabel) {
  const standardLabels = ["Entire home/apt", "Private room", "Shared room"];

  if (probs.length === standardLabels.length) {
    return probs.map((score, idx) => ({
      label: standardLabels[idx],
      score: Number(score) || 0,
    }));
  }

  return probs.map((score, idx) => ({
    label: idx === 0 && predictedLabel ? predictedLabel : `Class ${idx + 1}`,
    score: Number(score) || 0,
  }));
}

function renderPrediction(data, payload, elapsedMs) {
  const predicted = data.Predicted_room_type ?? "Unknown";
  const probs = Array.isArray(data.Probability) ? data.Probability : [];

  idleState.classList.add("hidden");
  resultState.classList.remove("hidden");

  // Re-trigger pop animation
  resultState.style.animation = "none";
  void resultState.offsetWidth;
  resultState.style.animation = "";

  predictedRoomTypeEl.textContent = predicted;
  latencyBadge.textContent = `${elapsedMs} ms`;

  const entries = buildProbabilityEntries(probs, predicted).sort((a, b) => b.score - a.score);
  const topScore = entries.length ? entries[0].score : 0;
  confidencePill.textContent = `Top confidence: ${(topScore * 100).toFixed(1)}%`;

  probabilityList.innerHTML = "";
  entries.forEach((item, index) => {
    const pct = Math.max(0, Math.min(100, item.score * 100));
    const card = document.createElement("div");
    card.className = `prob-item ${index === 0 ? "top" : ""}`;
    card.innerHTML = `
      <div class="prob-meta">
        <span class="prob-label">${item.label}</span>
        <span class="prob-pct">${pct.toFixed(1)}%</span>
      </div>
      <div class="prob-track">
        <div class="prob-fill" style="width: 0%;"></div>
      </div>
    `;
    probabilityList.appendChild(card);

    // Animate bar fill on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const fill = card.querySelector(".prob-fill");
        if (fill) fill.style.width = `${pct}%`;
      });
    });
  });

  jsonInspector.textContent = JSON.stringify(
    {
      request: payload,
      response: data,
    },
    null,
    2
  );
}

// Event Listeners
document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => applyPreset(chip.dataset.preset));
});

resetBtn.addEventListener("click", () => {
  document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
  applyPreset("manhattan_apt");
  resultState.classList.add("hidden");
  idleState.classList.remove("hidden");
  latencyBadge.textContent = "— ms";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideError();

  let payload;
  try {
    payload = collectPayload();
  } catch (err) {
    showError(err.message);
    return;
  }

  setLoading(true);
  const startTime = performance.now();

  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const elapsedMs = Math.round(performance.now() - startTime);
    const data = await response.json();

    if (!response.ok) {
      const detail = Array.isArray(data.detail)
        ? data.detail.map((d) => `${d.loc?.join(".")}: ${d.msg}`).join(" | ")
        : data.detail || `Server error (${response.status})`;
      throw new Error(detail);
    }

    apiStatus.classList.remove("offline");
    apiStatus.classList.add("online");
    statusText.textContent = "API Connected (:8000)";

    renderPrediction(data, payload, elapsedMs);
  } catch (err) {
    showError(
      err.message === "Failed to fetch"
        ? "Could not reach FastAPI at http://127.0.0.1:8000. Make sure uvicorn is running."
        : err.message
    );
  } finally {
    setLoading(false);
  }
});

checkBackendStatus();

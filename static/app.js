const state = {
  user: null,
  categories: {},
  items: [],
  lastSavedId: null,
  lastResult: null,
  savedCount: 0,
  masterCount: 0,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function moneyNumber(value, decimals = 2) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function wholeNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    headers: options.body instanceof FormData ? {} : { "Content-Type": "application/json" },
    ...options,
  });

  if (response.headers.get("content-type")?.includes("application/json")) {
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Request failed.");
    return body;
  }

  if (!response.ok) throw new Error("Request failed.");
  return response;
}

function showMessage(text, isError = false) {
  const box = $("#message");
  box.textContent = text;
  box.classList.toggle("error", isError);
  box.classList.remove("hidden");
  window.clearTimeout(showMessage.timer);
  showMessage.timer = window.setTimeout(() => box.classList.add("hidden"), isError ? 7000 : 4000);
}

function setActiveTab(name) {
  $$(".nav-pill").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.panel === name);
  });
}

function updateDashboardMetrics() {
  $("#categoryCountMetric").textContent = wholeNumber(Object.keys(state.categories).length);
  $("#itemCountMetric").textContent = wholeNumber(state.items.length);
  $("#savedCountMetric").textContent = wholeNumber(state.savedCount);
  $("#masterCountMetric").textContent = wholeNumber(state.masterCount);
}

function showPanel(name) {
  ["calculatorPanel", "savedPanel", "passwordPanel", "adminPanel"].forEach((id) => {
    $("#" + id).classList.toggle("hidden", id !== name);
  });
  $("#resultPanel").classList.toggle("hidden", !(name === "calculatorPanel" && state.lastResult));
  setActiveTab(name);
  if (name === "savedPanel") loadSaved();
  if (name === "adminPanel") loadAdmin();
}

function setAuthView() {
  const loggedIn = Boolean(state.user);
  $("#loginView").classList.toggle("hidden", loggedIn);
  $("#appView").classList.toggle("hidden", !loggedIn);

  if (loggedIn) {
    $("#userLine").textContent = `${state.user.username} (${state.user.role})`;
    $("#adminTab").classList.toggle("hidden", state.user.role !== "admin");
    renderCategoryOptions();
    if (!state.items.length) addItem();
    showPanel("calculatorPanel");
  } else {
    $("#message").classList.add("hidden");
    $("#resultPanel").classList.add("hidden");
  }
}

function renderCategoryOptions() {
  const select = $("#category");
  const names = Object.keys(state.categories);
  select.innerHTML = "";

  names.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = `${name} (${Math.round(state.categories[name] * 100)}%)`;
    select.appendChild(option);
  });

  $("#categoryChips").innerHTML = names
    .map((name) => `<span class="info-chip">${escapeHtml(name)}</span>`)
    .join("");

  updateDashboardMetrics();
}

function addItem(item = {}) {
  state.items.push({
    name: item.name || "",
    length: item.length || "",
    breadth: item.breadth || "",
    height: item.height || "",
    quantity: item.quantity || "",
    weight_per_unit: item.weight_per_unit ?? "",
  });
  renderItems();
}

function renderItems() {
  const body = $("#itemsTable tbody");
  body.innerHTML = "";

  if (!state.items.length) {
    body.innerHTML = `<tr class="empty-state"><td colspan="7">No items added yet. Click "+ Add Item" or upload an Excel file above.</td></tr>`;
    updateDashboardMetrics();
    return;
  }

  state.items.forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><input data-field="name" data-index="${index}" value="${escapeHtml(item.name)}" placeholder="Item name"></td>
      <td><input data-field="length" data-index="${index}" type="number" min="0" step="0.01" value="${item.length}" placeholder="0"></td>
      <td><input data-field="breadth" data-index="${index}" type="number" min="0" step="0.01" value="${item.breadth}" placeholder="0"></td>
      <td><input data-field="height" data-index="${index}" type="number" min="0" step="0.01" value="${item.height}" placeholder="0"></td>
      <td><input data-field="quantity" data-index="${index}" type="number" min="1" step="1" value="${item.quantity}" placeholder="1"></td>
      <td><input data-field="weight_per_unit" data-index="${index}" type="number" min="0" step="0.01" value="${item.weight_per_unit}" placeholder="Optional"></td>
      <td><button class="secondary row-action" data-remove="${index}" type="button">Remove</button></td>
    `;
    body.appendChild(row);
  });

  updateDashboardMetrics();
}

function syncItemsFromTable() {
  $$("#itemsTable input[data-field]").forEach((input) => {
    const index = Number(input.dataset.index);
    state.items[index][input.dataset.field] = input.value;
  });
}

function getCalcPayload(save = false) {
  syncItemsFromTable();
  return {
    reference: $("#reference").value.trim(),
    category: $("#category").value,
    save,
    items: state.items.map((item) => ({
      name: item.name,
      length: item.length,
      breadth: item.breadth,
      height: item.height,
      quantity: item.quantity,
      weight_per_unit: item.weight_per_unit === "" ? null : item.weight_per_unit,
    })),
  };
}

function renderEmptyRow(tableSelector, columnCount, message) {
  $(tableSelector).innerHTML = `
    <tr class="empty-state">
      <td colspan="${columnCount}">${escapeHtml(message)}</td>
    </tr>
  `;
}

// FIX: renderResult now groups summary cards with a divider and adds unit labels
function renderResult(result, savedId = null) {
  state.lastResult = result;
  state.lastSavedId = savedId;
  $("#resultPanel").classList.remove("hidden");

  const totals = result.totals;
  const gross = totals.grossWeightKg === null
    ? "Not calculated"
    : `${moneyNumber(totals.grossWeightKg)} kg`;

  // Group 1: Shipment identity
  const identityCards = [
    { label: "Reference", value: escapeHtml(result.reference), highlight: true },
    { label: "Category", value: escapeHtml(result.category), highlight: true },
    { label: "Total Boxes", value: wholeNumber(totals.cartons), highlight: false },
  ];

  // Group 2: Volume data
  const volumeCards = [
    { label: "Item Volume", value: wholeNumber(totals.itemVolume), unit: "mm³", highlight: false },
    { label: "Carton Volume", value: wholeNumber(totals.cartonVolume), unit: "mm³", highlight: false },
  ];

  // Group 3: Weight data
  const weightCards = [
    { label: "Gross Weight", value: gross === "Not calculated" ? gross : moneyNumber(totals.grossWeightKg), unit: gross === "Not calculated" ? "" : "kg", highlight: false },
    { label: "Volume Weight", value: moneyNumber(totals.volumeWeightKg), unit: "kg", highlight: false },
    { label: "Carton Tare", value: moneyNumber(totals.tareWeightKg), unit: "kg", highlight: false },
  ];

  function cardHtml({ label, value, unit, highlight }) {
    const unitHtml = unit ? `<span class="unit">${escapeHtml(unit)}</span>` : "";
    return `<div class="summary-card${highlight ? " highlight" : ""}">
      <span>${label}</span>
      <strong>${value}${unitHtml}</strong>
    </div>`;
  }

  const divider = `<div class="summary-divider"></div>`;

  $("#summaryGrid").innerHTML =
    identityCards.map(cardHtml).join("") +
    divider +
    volumeCards.map(cardHtml).join("") +
    divider +
    weightCards.map(cardHtml).join("");

  // FIX: tare weight in carton table — use wholeNumber (grams, no decimals needed)
  $("#cartonResultTable tbody").innerHTML = result.cartons
    .map((carton) => `
      <tr>
        <td>${escapeHtml(carton.code)}</td>
        <td>${wholeNumber(carton.quantity)}</td>
        <td>${wholeNumber(carton.volume)}</td>
        <td>${wholeNumber(carton.usable_capacity)}</td>
        <td>${wholeNumber(carton.tare_weight)} g</td>
      </tr>
    `)
    .join("");

  const exportBtn = $("#exportCurrentBtn");
  if (savedId) {
    exportBtn.href = `/api/calculations/${savedId}/export`;
    exportBtn.classList.remove("hidden");
  } else {
    exportBtn.classList.add("hidden");
  }

  if (!totals.weightsComplete) {
    showMessage("Gross weight was skipped because one or more item weights are missing.", true);
  }
}

async function calculate(save) {
  const body = getCalcPayload(save);
  const data = await api("/api/calculate", {
    method: "POST",
    body: JSON.stringify(body),
  });
  renderResult(data.result, data.savedId);
  showMessage(save ? "Calculation saved." : "Calculation complete.");
  if (save) {
    state.savedCount++;
    updateDashboardMetrics();
  }
}

async function loadSaved() {
  const data = await api("/api/calculations");
  state.savedCount = data.calculations.length;
  updateDashboardMetrics();

  if (!data.calculations.length) {
    renderEmptyRow("#savedTable tbody", 5, "No saved calculations yet. Save your first carton plan from the calculator view.");
    return;
  }

  // FIX: saved table now has export + delete actions
  $("#savedTable tbody").innerHTML = data.calculations
    .map((calc) => `
      <tr>
        <td>${escapeHtml(calc.reference)}</td>
        <td>${escapeHtml(calc.category)}</td>
        <td>${escapeHtml(calc.username)}</td>
        <td>${new Date(calc.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
        <td>
          <div class="saved-actions">
            <a class="button secondary row-action" href="/api/calculations/${calc.id}/export">Export</a>
            <button class="row-action danger" data-delete="${calc.id}" type="button">Delete</button>
          </div>
        </td>
      </tr>
    `)
    .join("");
}

async function loadAdmin() {
  const [cartons, users] = await Promise.all([api("/api/cartons"), api("/api/users")]);
  state.masterCount = cartons.cartons.length;
  updateDashboardMetrics();

  if (!cartons.cartons.length) {
    renderEmptyRow("#cartonMasterTable tbody", 7, "No carton master data is loaded right now.");
  } else {
    $("#cartonMasterTable tbody").innerHTML = cartons.cartons
      .map((carton) => `
        <tr>
          <td>${escapeHtml(carton.code)}</td>
          <td>${escapeHtml(carton.category)}</td>
          <td>${wholeNumber(carton.length)}</td>
          <td>${wholeNumber(carton.breadth)}</td>
          <td>${wholeNumber(carton.height)}</td>
          <td>${wholeNumber(carton.volume)}</td>
          <td>${wholeNumber(carton.tare_weight)} g</td>
        </tr>
      `)
      .join("");
  }

  const select = $("#resetPasswordForm select[name='username']");
  select.innerHTML = users.users
    .map((user) => `<option value="${escapeHtml(user.username)}">${escapeHtml(user.username)} (${user.role})</option>`)
    .join("");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function runWithButton(button, task) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = "Working...";
  try {
    return await task();
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

function wireEvents() {
  $("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    $("#loginError").textContent = "";
    const form = new FormData(event.currentTarget);
    const button = event.currentTarget.querySelector("button[type='submit']");
    try {
      await runWithButton(button, async () => {
        const data = await api("/api/login", {
          method: "POST",
          body: JSON.stringify({
            username: form.get("username"),
            password: form.get("password"),
          }),
        });
        state.user = data.user;
        state.categories = data.categories;
        setAuthView();
      });
    } catch (error) {
      $("#loginError").textContent = error.message;
    }
  });

  $("#logoutBtn").addEventListener("click", async (event) => {
    await runWithButton(event.currentTarget, async () => {
      await api("/api/logout", { method: "POST", body: "{}" });
      state.user = null;
      state.categories = {};
      state.items = [];
      state.lastSavedId = null;
      state.lastResult = null;
      state.savedCount = 0;
      state.masterCount = 0;
      setAuthView();
    });
  });

  $("#mainTab").addEventListener("click", () => showPanel("calculatorPanel"));
  $("#savedTab").addEventListener("click", () => showPanel("savedPanel"));
  $("#passwordTab").addEventListener("click", () => showPanel("passwordPanel"));
  $("#adminTab").addEventListener("click", () => showPanel("adminPanel"));
  $("#refreshSavedBtn").addEventListener("click", () => loadSaved());

  $("#addItemBtn").addEventListener("click", () => addItem());
  $("#itemsTable").addEventListener("input", syncItemsFromTable);
  $("#itemsTable").addEventListener("click", (event) => {
    const index = event.target.dataset.remove;
    if (index === undefined) return;
    state.items.splice(Number(index), 1);
    if (!state.items.length) addItem();
    renderItems();
  });

  // FIX: delete saved calculation handler
  $("#savedTable").addEventListener("click", async (event) => {
    const id = event.target.dataset.delete;
    if (!id) return;
    if (!confirm("Delete this saved calculation? This cannot be undone.")) return;
    try {
      await api(`/api/calculations/${id}`, { method: "DELETE" });
      showMessage("Calculation deleted.");
      await loadSaved();
    } catch (error) {
      // If DELETE endpoint not available, show a clear message
      showMessage("Delete is not supported by the server in this version.", true);
    }
  });

  $("#calculateBtn").addEventListener("click", async (event) => {
    try {
      await runWithButton(event.currentTarget, () => calculate(false));
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  $("#saveCalcBtn").addEventListener("click", async (event) => {
    try {
      await runWithButton(event.currentTarget, () => calculate(true));
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  $("#itemUpload").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      const data = await api("/api/items/upload", { method: "POST", body: form });
      state.items = data.items;
      renderItems();
      showMessage(`${data.items.length} item(s) loaded from Excel.`);
    } catch (error) {
      showMessage(error.message, true);
    } finally {
      event.target.value = "";
    }
  });

  $("#cartonUploadForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = $("#cartonUpload").files[0];
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    const button = event.currentTarget.querySelector("button[type='submit']");
    try {
      await runWithButton(button, async () => {
        const data = await api("/api/cartons/upload", { method: "POST", body: form });
        showMessage(`${data.count} cartons uploaded.`);
        $("#cartonUpload").value = "";
        await loadAdmin();
      });
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  $("#changePasswordForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const button = event.currentTarget.querySelector("button[type='submit']");
    try {
      await runWithButton(button, async () => {
        await api("/api/change-password", {
          method: "POST",
          body: JSON.stringify({
            currentPassword: form.get("currentPassword"),
            newPassword: form.get("newPassword"),
          }),
        });
        event.currentTarget.reset();
        showMessage("Password updated.");
      });
    } catch (error) {
      showMessage(error.message, true);
    }
  });

  $("#resetPasswordForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const button = event.currentTarget.querySelector("button[type='submit']");
    try {
      await runWithButton(button, async () => {
        await api("/api/users/reset-password", {
          method: "POST",
          body: JSON.stringify({
            username: form.get("username"),
            newPassword: form.get("newPassword"),
          }),
        });
        event.currentTarget.reset();
        showMessage("Password reset.");
      });
    } catch (error) {
      showMessage(error.message, true);
    }
  });
}

async function boot() {
  wireEvents();
  try {
    const data = await api("/api/me");
    state.user = data.user;
    state.categories = data.categories;
  } catch {
    state.user = null;
  }
  updateDashboardMetrics();
  setAuthView();
}

boot();

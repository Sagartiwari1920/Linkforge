const SESSION_KEY = "LinkForge.session";

async function readBody(res) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options,
  });

  const body = await readBody(res);

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && (body.message || body.error)) ||
      (typeof body === "string" && body) ||
      "Something went wrong. Please try again.";

    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return body;
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

function setSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function showAlert(el, message, type = "error") {
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  el.className = `alert alert-${type}`;
}

function hideAlert(el) {
  if (!el) return;
  el.hidden = true;
  el.textContent = "";
}


//  ELEMENTS 

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const otpForm = document.getElementById("otpForm");
const otpEmail = document.getElementById("otpEmail");
const backToRegister = document.getElementById("backToRegister");
const authAlert = document.getElementById("authAlert");

let pendingEmail = null;


//  REGISTER 

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(authAlert);

    const formData = new FormData(registerForm);

    const payload = {
      name: formData.get("name").trim(),
      emailId: formData.get("emailId").trim(),
      password: formData.get("password"),
    };

    const age = formData.get("age");
    if (age) payload.age = Number(age);

    const gender = formData.get("gender");
    if (gender) payload.gender = gender;

    const btn = registerForm.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Sending OTP…";

    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      pendingEmail = payload.emailId;

      if (otpEmail) {
        otpEmail.textContent = pendingEmail;
      }

      registerForm.hidden = true;
      otpForm.hidden = false;

      showAlert(authAlert, "OTP sent to your email.", "success");

      const otpInput = otpForm.querySelector('input[name="otp"]');
      if (otpInput) otpInput.focus();

    } catch (err) {
      showAlert(authAlert, err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Create account";
    }
  });
}


//  VERIFY OTP 

if (otpForm) {
  otpForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(authAlert);

    const formData = new FormData(otpForm);
    const otp = formData.get("otp").trim();

    if (!/^\d{6}$/.test(otp)) {
      showAlert(authAlert, "OTP must contain exactly 6 digits.");
      return;
    }

    if (!pendingEmail) {
      showAlert(authAlert, "Registration session lost. Register again.");
      return;
    }

    const btn = otpForm.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Verifying…";

    try {
      await apiFetch("/auth/verify-register-otp", {
        method: "POST",
        body: JSON.stringify({
          emailId: pendingEmail,
          otp
        })
      });

      showAlert(
        authAlert,
        "Email verified successfully. Redirecting...",
        "success"
      );

      registerForm.reset();
      otpForm.reset();
      pendingEmail = null;

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);

    } catch (err) {
      showAlert(authAlert, err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Verify OTP";
    }
  });
}


//  BACK TO REGISTER 

if (backToRegister) {
  backToRegister.addEventListener("click", () => {
    hideAlert(authAlert);
    otpForm.hidden = true;
    registerForm.hidden = false;
    otpForm.reset();
  });
}


//  LOGIN 

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(authAlert);

    const formData = new FormData(loginForm);

    const payload = {
      emailId: formData.get("emailId").trim(),
      password: formData.get("password"),
    };

    const btn = loginForm.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Logging in…";

    try {
      await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      setSession({ emailId: payload.emailId });
      window.location.href = "dashboard.html";

    } catch (err) {
      showAlert(authAlert, err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = "Log in";
    }
  });
}


//  LOGOUT 

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await apiFetch("/auth/logout", {
        method: "POST"
      });
    } catch {
    } finally {
      clearSession();
      window.location.href = "login.html";
    }
  });
}


//  URL SHORTENER 

const shortenForm = document.getElementById("shortenForm");

if (shortenForm) {
  const shortenAlert = document.getElementById("shortenAlert");
  const resultBox = document.getElementById("result");
  const shortenBtn = document.getElementById("shortenBtn");

  shortenForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(shortenAlert);
    resultBox.hidden = true;

    const originalUrl = document.getElementById("urlInput").value.trim();

    if (!originalUrl) {
      showAlert(shortenAlert, "Paste a URL first.");
      return;
    }

    shortenBtn.disabled = true;
    shortenBtn.textContent = "Shortening…";

    try {
      const data = await apiFetch("/url/shorten", {
        method: "POST",
        body: JSON.stringify({ originalUrl })
      });

      renderResult(data);
      loadAnalytics();
      shortenForm.reset();

    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        clearSession();
        window.location.href = "login.html";
        return;
      }

      showAlert(shortenAlert, err.message);

    } finally {
      shortenBtn.disabled = false;
      shortenBtn.textContent = "Shorten";
    }
  });

  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", loadAnalytics);
  }
}


//  RESULT 

function renderResult(data) {
  const resultBox = document.getElementById("result");
  if (!resultBox) return;

  resultBox.hidden = false;

  resultBox.innerHTML = `
    <div class="result-info">
      ${data.alreadyPresent
        ? '<span class="result-badge">Already shortened</span><br>'
        : ""
      }

      <div class="result-label">Your short link</div>

      <a class="result-link"
         href="${escapeAttr(data.shortenedUrl)}"
         target="_blank"
         rel="noopener">
        ${escapeHtml(data.shortenedUrl)}
      </a>

      <div class="result-actions">
        <button type="button" class="btn btn-ghost" id="copyBtn">
          Copy link
        </button>
      </div>
    </div>

    <div class="result-qr">
      <img src="${data.qrCode}" width="96" height="96" alt="QR code">
    </div>
  `;

  document.getElementById("copyBtn").addEventListener("click", () => {
    copyToClipboard(data.shortenedUrl);
  });
}


//  COPY 

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 1800);
  });
}


//  ANALYTICS 

async function loadAnalytics() {
  const analyticsBody = document.getElementById("analyticsBody");
  const totalCount = document.getElementById("totalCount");

  if (!analyticsBody) return;

  analyticsBody.innerHTML =
    `<tr><td colspan="4" class="empty-msg">Loading…</td></tr>`;

  try {
    const data = await apiFetch("/url/analytics");
    const items = data.data || [];

    if (totalCount) {
      totalCount.textContent = data.totalUrls ?? items.length;
    }

    if (items.length === 0) {
      analyticsBody.innerHTML =
        `<tr><td colspan="4" class="empty-msg">
          No links yet — shorten one above to see it here.
        </td></tr>`;

      return;
    }

    analyticsBody.innerHTML = [...items]
      .reverse()
      .map((url) => {
        const original = url.originalUrl || "";

        const shortLabel =
          original.length > 60
            ? original.slice(0, 60) + "…"
            : original;

        const created = url.createdAt
          ? new Date(url.createdAt).toLocaleDateString()
          : "—";

        return `
          <tr>
            <td>
              <a href="${escapeAttr(original)}"
                 target="_blank"
                 rel="noopener"
                 title="${escapeAttr(original)}">
                ${escapeHtml(shortLabel)}
              </a>
            </td>

            <td>
              <a class="mono"
                 href="/${escapeAttr(url.shortCode)}"
                 target="_blank"
                 rel="noopener">
                ${escapeHtml(url.shortCode)}
              </a>
            </td>

            <td>
              <span class="clicks-badge">
                ${url.clicks ?? 0} clicks
              </span>
            </td>

            <td>${created}</td>
          </tr>
        `;
      })
      .join("");

  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      clearSession();
      window.location.href = "login.html";
      return;
    }

    analyticsBody.innerHTML =
      `<tr><td colspan="4" class="empty-msg">
        Couldn't load your links: ${escapeHtml(err.message)}
      </td></tr>`;
  }
}


// ESCAPE HELPERS 

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttr(str = "") {
  return escapeHtml(str).replaceAll('"', "&quot;");
}


//  PAGE PROTECTION 

document.addEventListener("DOMContentLoaded", () => {
  const session = getSession();
  const path = window.location.pathname;

  if (session) {
    if (
      path.includes("login.html") ||
      path.includes("register.html") ||
      path.endsWith("/") ||
      path.includes("index.html")
    ) {
      window.location.href = "dashboard.html";
    } else if (path.includes("dashboard.html")) {
      const userEmailEl = document.getElementById("userEmail");

      if (userEmailEl) {
        userEmailEl.textContent = session.emailId || "";
      }

      loadAnalytics();
    }
  } else {
    if (path.includes("dashboard.html")) {
      window.location.href = "login.html";
    }
  }
});
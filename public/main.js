/**
 * The browser half of Jokebox.
 *
 * Plain ES modules loaded straight from a <script type="module"> tag: there is
 * no build step, so what is in this file is exactly what runs. Everything it
 * displays comes from the same API you can hit yourself with curl.
 */

const els = {
  setup: document.querySelector("#setup"),
  punchline: document.querySelector("#punchline"),
  reveal: document.querySelector("#reveal"),
  next: document.querySelector("#next"),
  category: document.querySelector("#category"),
  tag: document.querySelector("#tag"),
  error: document.querySelector("#error"),
  build: document.querySelector("#build"),
};

let current = null;

/** GET a JSON endpoint, turning any non-2xx into a thrown Error. */
async function getJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText} from ${url}`);
  }
  return response.json();
}

function showError(message) {
  els.error.textContent = message;
  els.error.hidden = false;
}

function clearError() {
  els.error.hidden = true;
}

/** Render a joke with its punchline hidden. */
function showJoke(joke) {
  current = joke;
  els.setup.textContent = joke.setup;
  els.punchline.textContent = joke.punchline;
  els.punchline.hidden = true;
  els.reveal.disabled = false;
  els.reveal.textContent = "Reveal punchline";
  els.tag.textContent = joke.category;
  els.tag.hidden = false;
}

async function loadJoke() {
  clearError();
  els.next.disabled = true;
  try {
    // TODO(assignment): once /api/jokes/random supports a category filter,
    // pass els.category.value through as a query parameter here.
    showJoke(await getJSON("/api/jokes/random"));
  } catch (err) {
    showError(`Could not load a joke. ${err.message}`);
  } finally {
    els.next.disabled = false;
  }
}

async function loadCategories() {
  try {
    for (const category of await getJSON("/api/categories")) {
      const option = document.createElement("option");
      option.value = category;
      option.textContent = category;
      els.category.append(option);
    }
  } catch {
    // A missing filter is a degraded UI, not a broken one - the joke card
    // still works, so this failure is deliberately not surfaced to the user.
  }
}

async function loadBuildInfo() {
  try {
    const health = await getJSON("/healthz");
    els.build.textContent = `${health.env} · ${health.commit.slice(0, 7)}`;
  } catch {
    els.build.textContent = "";
  }
}

els.reveal.addEventListener("click", () => {
  if (!current) return;
  els.punchline.hidden = !els.punchline.hidden;
  els.reveal.textContent = els.punchline.hidden
    ? "Reveal punchline"
    : "Hide punchline";
});

els.next.addEventListener("click", loadJoke);
els.category.addEventListener("change", loadJoke);

loadCategories();
loadBuildInfo();
loadJoke();

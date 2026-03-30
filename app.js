const DATA_URL = "./data/articles.json";
const RESULTS_LIMIT = 5;

const THEMES = [
  {
    name: "Space",
    keywords: ["space", "galaxy", "telescope", "planet", "cosmic", "star", "astronomy", "universe", "exoplanet", "orbit"],
  },
  {
    name: "Climate",
    keywords: ["climate", "warming", "temperature", "heat", "carbon", "weather", "emissions", "drought", "atmosphere"],
  },
  {
    name: "Ocean",
    keywords: ["ocean", "sea", "coral", "reef", "marine", "fish", "coast", "current", "plankton"],
  },
  {
    name: "Biology",
    keywords: ["biology", "cell", "gene", "species", "microbe", "protein", "evolution", "organism", "genome"],
  },
  {
    name: "Health",
    keywords: ["health", "disease", "virus", "immune", "vaccine", "medical", "therapy", "patient", "infection"],
  },
  {
    name: "Neuroscience",
    keywords: ["brain", "memory", "neuron", "neural", "cognition", "signals", "sleep", "learning", "synapse"],
  },
  {
    name: "Energy",
    keywords: ["energy", "battery", "solar", "storage", "power", "electric", "grid", "renewable", "fuel"],
  },
  {
    name: "Materials",
    keywords: ["material", "materials", "crystal", "nanotube", "alloy", "polymer", "graphene", "semiconductor"],
  },
  {
    name: "Physics",
    keywords: ["physics", "quantum", "particle", "fusion", "laser", "matter", "forces", "plasma"],
  },
  {
    name: "AI",
    keywords: ["ai", "artificial", "machine", "algorithm", "model", "robot", "data", "automation"],
  },
];

const elements = {
  form: document.querySelector("#search-form"),
  input: document.querySelector("#query-input"),
  results: document.querySelector("#results"),
  resultsMeta: document.querySelector("#results-meta"),
  datasetStatus: document.querySelector("#dataset-status"),
  template: document.querySelector("#result-template"),
  presetButtons: document.querySelectorAll(".preset-query"),
};

let dataset = [];

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function normalize(vector) {
  const magnitude = Math.hypot(...vector);
  if (!magnitude) {
    return vector.map(() => 0);
  }
  return vector.map((value) => value / magnitude);
}

function buildQueryEmbedding(query) {
  const tokens = tokenize(query);
  const rawVector = THEMES.map((theme) => {
    return theme.keywords.reduce((score, keyword) => {
      return score + tokens.filter((token) => token === keyword).length;
    }, 0);
  });

  // Add a tiny fallback weight when a token partially matches a theme keyword.
  THEMES.forEach((theme, index) => {
    if (rawVector[index] > 0) {
      return;
    }
    const partialHits = tokens.some((token) =>
      theme.keywords.some((keyword) => keyword.includes(token) || token.includes(keyword)),
    );
    if (partialHits) {
      rawVector[index] = 0.5;
    }
  });

  return normalize(rawVector);
}

function cosineSimilarity(vectorA, vectorB) {
  return vectorA.reduce((sum, value, index) => sum + value * vectorB[index], 0);
}

function topThemes(vector, limit = 2) {
  return vector
    .map((score, index) => ({ name: THEMES[index].name, score }))
    .filter((entry) => entry.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.name);
}

function renderEmptyState(message) {
  elements.results.innerHTML = `<div class="empty-state">${message}</div>`;
}

function showProtocolWarning() {
  elements.datasetStatus.textContent = "This demo must be served over HTTP or HTTPS.";
  elements.resultsMeta.textContent = "Opening index.html directly with file:// will not work.";
  renderEmptyState(
    'Run a static server such as "python3 -m http.server 8000" in this folder, then open http://localhost:8000.',
  );
}

function renderResults(query, matches) {
  elements.results.replaceChildren();

  if (!matches.length) {
    elements.resultsMeta.textContent = `No strong matches found for "${query}".`;
    renderEmptyState("Try a broader science topic or use one of the example queries.");
    return;
  }

  elements.resultsMeta.textContent = `Showing ${matches.length} best matches for "${query}".`;

  matches.forEach(({ article, score }) => {
    const fragment = elements.template.content.cloneNode(true);
    fragment.querySelector(".result-category").textContent = article.category;
    fragment.querySelector(".result-score").textContent = `Similarity ${(score * 100).toFixed(1)}%`;
    fragment.querySelector(".result-title").textContent = article.title;
    fragment.querySelector(".result-summary").textContent = article.summary;
    fragment.querySelector(".result-source").textContent = article.source;
    fragment.querySelector(".result-themes").textContent = `Themes: ${topThemes(article.embedding).join(", ") || "General science"}`;
    elements.results.appendChild(fragment);
  });
}

function renderAllArticles() {
  const allArticles = dataset.map((article) => ({
    article,
    score: 1,
  }));

  elements.results.replaceChildren();
  elements.resultsMeta.textContent = `Showing all ${allArticles.length} articles.`;

  allArticles.forEach(({ article }) => {
    const fragment = elements.template.content.cloneNode(true);
    fragment.querySelector(".result-category").textContent = article.category;
    fragment.querySelector(".result-score").textContent = "Full dataset";
    fragment.querySelector(".result-title").textContent = article.title;
    fragment.querySelector(".result-summary").textContent = article.summary;
    fragment.querySelector(".result-source").textContent = article.source;
    fragment.querySelector(".result-themes").textContent = `Themes: ${topThemes(article.embedding).join(", ") || "General science"}`;
    elements.results.appendChild(fragment);
  });
}

function searchArticles(query) {
  const queryEmbedding = buildQueryEmbedding(query);
  const hasSignal = queryEmbedding.some((value) => value > 0);

  if (!hasSignal) {
    elements.resultsMeta.textContent = `The query "${query}" did not map to the demo vocabulary.`;
    renderEmptyState("Try terms like climate, telescope, coral, neurons, batteries, quantum, or disease.");
    return;
  }

  const ranked = dataset
    .map((article) => ({
      article,
      score: cosineSimilarity(queryEmbedding, article.embedding),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, RESULTS_LIMIT);

  renderResults(query, ranked);
}

async function loadDataset() {
  if (window.location.protocol === "file:") {
    showProtocolWarning();
    return;
  }

  const response = await fetch(DATA_URL);
  if (!response.ok) {
    throw new Error(`Failed to load dataset: ${response.status}`);
  }

  const payload = await response.json();
  dataset = payload.articles.map((article) => ({
    ...article,
    embedding: normalize(article.embedding),
  }));
  elements.datasetStatus.textContent = `Loaded ${dataset.length} articles with ${payload.embeddingDimensions} embedding dimensions.`;
  renderAllArticles();
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = elements.input.value.trim();

  if (!query) {
    renderAllArticles();
    return;
  }

  searchArticles(query);
});

elements.presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const query = button.dataset.query;
    elements.input.value = query;
    searchArticles(query);
  });
});

loadDataset().catch((error) => {
  console.error(error);
  elements.datasetStatus.textContent = "Dataset loading failed.";
  elements.resultsMeta.textContent = "The app could not load the JSON file.";
  renderEmptyState("Serve the project from a local web server or GitHub Pages so fetch() can read the JSON dataset.");
});

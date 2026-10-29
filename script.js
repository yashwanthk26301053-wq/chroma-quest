// DOM References
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const clearButton = document.getElementById("clear-button");
const resultsContainer = document.getElementById("results");
const resultCount = document.getElementById("result-count");

// State Elements
const emptyState = document.getElementById("empty-state");
const emptyTitle = document.getElementById("empty-title");
const emptyMessage = document.getElementById("empty-message");

const loadingState = document.getElementById("loading-state");

const errorState = document.getElementById("error-state");
const errorMessage = document.getElementById("error-message");
const retryButton = document.getElementById("retry-button");

const categoryChips = document.querySelectorAll(".chip");

// Track last searched query for Retry button
let lastQuery = "";

/**
 * Main Search Execution Function
 * @param {string} rawQuery
 */
async function performSearch(rawQuery) {
  const query = rawQuery.trim();

  // Task 4 (Part 2): Ignore empty searches
  if (!query) return;

  lastQuery = query;
  searchInput.value = query;
  toggleClearButton();

  // Reset UI View States before initiating fetch
  hideAllStates();
  showLoadingState();
  resultCount.textContent = `Searching for "${query}"...`;

  // Build key-free API URL
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=24&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`;

  try {
    const response = await fetch(apiUrl);

    // Task 3: Response check
    if (!response.ok) {
      throw new Error(`Server returned status code ${response.status}`);
    }

    const data = await response.json();
    const pages = data.query?.pages;

    hideLoadingState();

    // Task 2: Check for empty results
    if (!pages) {
      showEmptyState(
        `No results for "${query}"`,
        "We couldn't find any images matching your search term. Try searching for a broader keyword or a popular category above.",
      );
      resultCount.textContent = `Showing 0 results for "${query}"`;
      return;
    }

    const items = Object.values(pages);
    let renderedCount = 0;

    // Task 3 (Part 2): Render Results
    items.forEach((item) => {
      const imageInfo = item.imageinfo?.[0];
      if (!imageInfo || !imageInfo.url) return;

      const imageUrl = imageInfo.url;

      // Filter non-image media types
      if (!/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(imageUrl)) return;

      renderedCount++;

      // Title & Author extraction
      let title = item.title.replace(/^File:/i, "").replace(/\.[^/.]+$/, "");
      title = title.replace(/_/g, " ");

      const rawArtist = imageInfo.extmetadata?.Artist?.value;
      const artist = rawArtist ? stripHtml(rawArtist) : "Wikimedia Commons";

      // Build DOM elements
      const card = document.createElement("article");
      card.className = "image-card";

      const cardLink = document.createElement("a");
      cardLink.className = "card-link";
      cardLink.href = imageInfo.descriptionurl || imageUrl;
      cardLink.target = "_blank";
      cardLink.rel = "noopener noreferrer";

      const img = document.createElement("img");
      img.className = "card-image";
      img.src = imageUrl;
      img.alt = title;
      img.loading = "lazy";

      const cardBody = document.createElement("div");
      cardBody.className = "card-body";

      const cardTitle = document.createElement("h3");
      cardTitle.className = "card-title";
      cardTitle.textContent = title;

      const cardAuthor = document.createElement("p");
      cardAuthor.className = "card-author";
      cardAuthor.textContent = `By: ${artist}`;

      cardBody.appendChild(cardTitle);
      cardBody.appendChild(cardAuthor);

      cardLink.appendChild(img);
      cardLink.appendChild(cardBody);

      card.appendChild(cardLink);

      resultsContainer.appendChild(card);
    });

    if (renderedCount > 0) {
      resultsContainer.classList.remove("hidden");
      resultCount.textContent = `Showing ${renderedCount} result${renderedCount === 1 ? "" : "s"} for "${query}"`;
    } else {
      showEmptyState(
        `No images found for "${query}"`,
        "The server returned assets, but none were previewable image files. Try another keyword.",
      );
      resultCount.textContent = `Showing 0 results for "${query}"`;
    }
  } catch (error) {
    console.error("Search fetch error:", error);
    hideLoadingState();
    showErrorState(
      "Something went wrong while loading results. Please check your internet connection or try again shortly.",
    );
    resultCount.textContent = "Search failed";
  }
}

// State Helper Functions
function hideAllStates() {
  emptyState.classList.add("hidden");
  loadingState.classList.add("hidden");
  errorState.classList.add("hidden");
  resultsContainer.classList.add("hidden");
  resultsContainer.innerHTML = "";
}

function showLoadingState() {
  loadingState.classList.remove("hidden");
  resultsContainer.setAttribute("aria-busy", "true");
}

function hideLoadingState() {
  loadingState.classList.add("hidden");
  resultsContainer.setAttribute("aria-busy", "false");
}

function showEmptyState(title, message) {
  emptyTitle.textContent = title;
  emptyMessage.textContent = message;
  emptyState.classList.remove("hidden");
}

function showErrorState(message) {
  errorMessage.textContent = message;
  errorState.classList.remove("hidden");
}

function stripHtml(html) {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "Unknown";
}

function toggleClearButton() {
  if (searchInput.value.trim().length > 0) {
    clearButton.classList.remove("hidden");
  } else {
    clearButton.classList.add("hidden");
  }
}

// Event Listeners
searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  performSearch(searchInput.value);
});

searchInput.addEventListener("input", toggleClearButton);

clearButton.addEventListener("click", () => {
  searchInput.value = "";
  toggleClearButton();
  searchInput.focus();
});

categoryChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    performSearch(chip.textContent.trim());
  });
});

retryButton.addEventListener("click", () => {
  if (lastQuery) performSearch(lastQuery);
});

// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

const searchBtn = document.getElementById("getImagesButton");
const galleryElement = document.getElementById("gallery");
const placeholderElement = galleryElement.querySelector(".placeholder");
const placeholderMessage = placeholderElement.querySelector(".placeholder-message");
// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

searchBtn.addEventListener("click", fetchImages);

function toLegacyDate(date) {
  const [year, month, day] = date.split("-");
  return year.slice(-2) + month + day;
}

// Fetch Images function
async function fetchImages() {
  const dateFrom = toLegacyDate(startInput.value);
  const dateTo = toLegacyDate(endInput.value);

  // Show the loading message and remove images from the previous search.
  placeholderElement.classList.remove("hidden");
  placeholderMessage.textContent = "Fetching space images...";
  galleryElement.querySelectorAll(".gallery-item").forEach(card => card.remove());

  try {
    const response = await fetch(`https://science.nasa.gov/wp-json/wp/v2/apod-basic?date_from=${dateFrom}&date_to=${dateTo}`);
    
    if (!response.ok) {
      throw new Error("Failed to fetch images");
    }
    const data = await response.json();

    // Keep only picture results and show no more than nine.
    const images = data
      .filter(item => item.hdurl && item.media_type !== "video")
      .slice(0, 9);

    if (images.length === 0) {
      placeholderMessage.textContent = "No pictures were found for this date range.";
      return;
    }

    placeholderElement.classList.add("hidden");
    images.forEach(item => {
      const card = document.createElement("article");
      card.className = "gallery-item";

      const image = document.createElement("img");
      image.src = item.hdurl;
      image.alt = item.title || "NASA space image";

      const date = document.createElement("p");
      date.className = "gallery-date";
      date.textContent = item.date || "Date unavailable";

      const title = document.createElement("h2");
      title.textContent = item.title || "Untitled space image";

      card.append(image, date, title);
      galleryElement.appendChild(card);
    });
  } catch (error) {
    placeholderMessage.textContent = `Unable to load space images: ${error.message}`;
  }
}






// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

const searchBtn = document.getElementById("getImagesButton");
const galleryElement = document.getElementById("gallery");
const placeholderElement = galleryElement.querySelector(".placeholder");
const placeholderMessage = placeholderElement.querySelector(".placeholder-message");
const placeholderIcon = placeholderElement.querySelector(".placeholder-icon");
const imageModal = document.getElementById("imageModal");
const modalCloseButton = document.getElementById("modalCloseButton");
const modalImage = document.getElementById("modalImage");
const modalDate = document.getElementById("modalDate");
const modalTitle = document.getElementById("modalTitle");
const modalExplanation = document.getElementById("modalExplanation");

const funFacts = [
  "The Hubble Space Telescope has been in operation for over 30 years, capturing stunning images of the universe.",
  "The James Webb Space Telescope, launched in December 2021, is designed to observe the universe in infrared light.",
  "Mars has the largest volcano in the solar system, Olympus Mons, which is about three times the height of Mount Everest.",
  "The Milky Way galaxy contains an estimated 100 to 400 billion stars.",
  "Black holes are regions of space where gravity is so strong that nothing, not even light, can escape from them.",
  "Saturn is less dense than water! If you could find a bathtub big enough, the ringed planet would float.",
  "Getty Ethyl formate, which gives raspberries their flavour and smells of rum, has now been found in deep space. The center of the galaxy tastes like raspberries and smells of rum.",
  "Neutron stars are so dense that a sugar-cube-sized amount of material from one would weigh about a billion tons on Earth.",
  "The observable universe is estimated to be around 93 billion light-years in diameter."
];

// Display a random fun fact on page load
window.addEventListener("load", () => {
  const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];
  document.getElementById("funFactText").textContent = randomFact;
});

modalCloseButton.addEventListener("click", () => imageModal.close());
imageModal.addEventListener("click", event => {
  if (event.target === imageModal) {
    imageModal.close();
  }
});

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
  placeholderIcon.classList.add("hidden");
  placeholderMessage.textContent = "Fetching space images...";
  galleryElement.querySelectorAll(".gallery-item").forEach(card => card.remove());

  try {
    const response = await fetch(`https://science.nasa.gov/wp-json/wp/v2/apod-basic?date_from=${dateFrom}&date_to=${dateTo}`);
    
    //console.log(`response`, response);

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
      const card = document.createElement("article"); // create a new <article> element for the gallery item
      card.className = "gallery-item";

      card.tabIndex = 0; // Make the card focusable via keyboard navigation.
      card.setAttribute("role", "button"); // Indicate that the card is interactive and behaves like a button.
      card.setAttribute("aria-haspopup", "dialog"); // Indicate that the card opens a dialog when activated.
      card.setAttribute("aria-controls", "imageModal"); // Indicate that the card controls the image modal.

      const image = document.createElement("img");
      image.src = item.hdurl;
      image.alt = item.title || "NASA space image";

      const date = document.createElement("p");
      date.className = "gallery-date";
      date.textContent = item.date || "Date unavailable";

      const title = document.createElement("h2");
      title.textContent = item.title || "Untitled space image";

      card.append(image, date, title);

      // Add click and keydown event listeners to the card to open the image modal
      card.addEventListener("click", () => openImageModal(item));
      // Add keydown event listener to the card to open the image modal when Enter or Space is pressed
      card.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openImageModal(item);
        }
      });

      // Append the card to the gallery element
      galleryElement.appendChild(card);

    });
  } catch (error) {
    placeholderMessage.textContent = `Unable to load space images: ${error.message}`;
  }
}

function openImageModal(item) {
  modalImage.src = item.hdurl;
  modalImage.alt = item.title || "NASA space image";
  modalDate.textContent = item.date || "Date unavailable";
  modalTitle.textContent = item.title || "Untitled space image";
  const explanation = item.explanation || "No explanation is available for this image.";
  // Use innerHTML to allow HTML content in the explanation.
  modalExplanation.innerHTML = explanation;

  imageModal.showModal();
}





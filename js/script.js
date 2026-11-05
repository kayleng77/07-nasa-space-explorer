// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

const searchBtn = document.getElementById("getImagesButton");
const galleryElement = document.getElementById("gallery");

// Placeholder Elements
const placeholderElement = galleryElement.querySelector(".placeholder");
const placeholderMessage = placeholderElement.querySelector(".placeholder-message");
const placeholderIcon = placeholderElement.querySelector(".placeholder-icon");

// Modal Elements
const imageModal = document.getElementById("imageModal");
const modalCloseButton = document.getElementById("modalCloseButton");
const modalMedia = document.getElementById("modalMedia");
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

// Close the modal when the close button is clicked
modalCloseButton.addEventListener("click", () => imageModal.close()); 
// Close the modal when clicking outside the modal content
imageModal.addEventListener("click", event => {
  if (event.target === imageModal) {
    imageModal.close();
  }
});

// Pause and reset the video when the modal is closed
imageModal.addEventListener("close", () => {
  const modalVideo = modalMedia.querySelector("video");
  if (modalVideo) {
    modalVideo.pause();
    modalVideo.removeAttribute("src");
    modalVideo.load();
  }
});

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

searchBtn.addEventListener("click", fetchImages);

// Convert date from YYYY-MM-DD to YYMMDD format for the NASA API
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

    if (!response.ok) {
      throw new Error("Failed to fetch images");
    }
    
    const data = await response.json();
    const images = data;

    // Keep only picture results and show no more than nine.
    /*const images = data
      .filter(item => item.hdurl && item.media_type !== "video")
      .slice(0, 9);
      */
     
    if (images.length === 0) {
      placeholderMessage.textContent = "No pictures were found for this date range.";
      return;
    }

    placeholderElement.classList.add("hidden");

    images.forEach(item => {
      const card = document.createElement("article"); // create a new <article> element for the gallery item
      card.className = "gallery-item";

      card.tabIndex = 0; // Make the card focusable via keyboard 
      card.setAttribute("role", "button"); // Indicate that the card is interactive and behaves like a button
      card.setAttribute("aria-haspopup", "dialog"); // Indicate that the card opens a modal when activated
      card.setAttribute("aria-controls", "imageModal"); // Indicate that the card controls the image modal

      const isVideo = item.media_type === "video";
      let media;

      if (isVideo) {
        media = createVideoElement(item, "gallery-video");
        if (!media) {
          media = createNASAArticleLink(item, "Watch this NASA video");
        }
        media.addEventListener("click", event => event.stopPropagation());
      } else if (item.hdurl) {
        media = document.createElement("img");
        media.src = item.hdurl;
        media.alt = item.title || "NASA space image";
      } else {
        media = createNASAArticleLink(item);
      }

      const date = document.createElement("p");
      date.className = "gallery-date";
      date.textContent = item.date || "Date unavailable";

      const title = document.createElement("h2");
      title.textContent = item.title || "Untitled space image";

      card.append(media, date, title);

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

function createVideoElement(item, className) {
  // The API's url points to an article; its basic_html contains the actual video source.
  const html = new DOMParser().parseFromString(item.basic_html || "", "text/html");
  const video = html.querySelector("video");
  // Get the video source from the <source> tag or the <video> tag itself
  const videoSource = video?.querySelector("source[src]")?.getAttribute("src") || video?.getAttribute("src");

  if (!videoSource) {
    return null;
  }

  const videoElement = document.createElement("video");
  videoElement.className = className; // Add the provided class name for styling
  videoElement.src = videoSource; // Set the video source from the API's basic_html
  videoElement.controls = true; // Enable video controls (play, pause, volume, etc.)
  videoElement.preload = "metadata"; // Preload only the metadata to save bandwidth
  videoElement.title = item.title || "NASA space video"; 

  if (item.hdurl) {
    videoElement.poster = item.hdurl;
  }

  return videoElement;
}

// Create a link to the NASA article for videos that cannot be embedded
function createNASAArticleLink(item, label = "View this NASA entry") {
  const link = document.createElement("a"); // Create a new <a> element for the link
  link.className = "video-fallback"; // Add a class for styling
  link.href = item.url; // Use the article URL from the API response
  link.target = "_blank"; // Open in a new tab
  link.rel = "noopener noreferrer"; // Security best practice for external links
  link.textContent = label; // Set the link text to the provided label
  link.addEventListener("click", event => event.stopPropagation()); // Prevent the click from propagating to the card's click event
  return link;
}

function openImageModal(item) {
  modalMedia.replaceChildren();

  if (item.media_type === "video") {
    const video = createVideoElement(item, "modal-video");
    modalMedia.append(video || createNASAArticleLink(item, "Watch this NASA video"));
  } else if (item.hdurl) {
    const image = document.createElement("img");
    image.className = "modal-image";
    image.src = item.hdurl;
    image.alt = item.title || "NASA space image";
    modalMedia.append(image);
  }

  modalDate.textContent = item.date || "Date unavailable";
  modalTitle.textContent = item.title || "Untitled space image";
  const explanation = item.explanation || "No explanation is available for this image.";
  // Use innerHTML to allow HTML content in the explanation.
  modalExplanation.innerHTML = explanation;

  imageModal.showModal();
}


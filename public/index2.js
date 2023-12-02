// Constants
const MAX_COPY_LENGTH = 1500;

// DOM Elements
const urlInput = document.getElementById('urlInput');
const scrapeButton = document.getElementById('scrapeButton');
const contentElement = document.getElementById('content');
const copyButtonsContainer = document.getElementById('copyButtonsContainer');
const pasteButton = document.getElementById('pasteButton');

// Event Listeners
scrapeButton.addEventListener('click', scrapeContent);
pasteButton.addEventListener('click', pasteFromClipboard);
window.addEventListener('scroll', showBackToTopButton);

// Initial Setup
checkStorage();

// Functions
async function scrapeContent() {
  const url = urlInput.value.trim();
  if (url === '') return;

  // Save the URL to localStorage
  localStorage.setItem('lastUrl', url);

  setScrapeButtonState(true);

  try {
    const response = await fetch(`/scrape?url=${encodeURIComponent(url)}`);
    const data = await response.json();
    const content = data.content.replace(/\u2003/g, '');
    console.log(content);
    displayContent(content);
    saveContent(content);
    createCopyButtons(content);
    savePrevNextChapterLinks(data.prevContent, data.nextContent);
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    setScrapeButtonState(false);
  }
}

function setScrapeButtonState(isScraping) {
  scrapeButton.innerText = isScraping ? 'Scraping...' : 'Scrape';
  scrapeButton.disabled = isScraping;
}

function displayContent(content) {
  contentElement.innerText = content;
}

function createCopyButtons(content) {
  const copyButtonsContainer = document.getElementById('copyButtonsContainer');
  copyButtonsContainer.innerHTML = '';

  if (content.length > 0) {
    const paragraphs = content.split('\n');
    const numCopyButtons = Math.ceil(paragraphs.length / 60);

    // Create an array to store copy button data
    const copyButtonData = [];

    for (let i = 0; i < numCopyButtons; i++) {
      const startIdx = i * 60;
      const endIdx = (i + 1) * 60;
      const buttonText = `Copy ${i + 1}`;
      const copiedText = paragraphs.slice(startIdx, endIdx).join('\n');

      // Store copy button data in the array
      copyButtonData.push({ buttonText, copiedText });

      const copyButton = createCopyButton(buttonText, copiedText);
      copyButtonsContainer.appendChild(copyButton);
    }

    // Save copy button data in localStorage
    localStorage.setItem('copyButtonData', JSON.stringify(copyButtonData));
  }
}

function createCopyButton(buttonText, copiedText) {
  const copyButton = document.createElement('button');
  copyButton.innerText = buttonText;
  copyButton.id = buttonText.replace(/\s+/g, '').toLowerCase(); // Copy 1 to copy1
  copyButton.addEventListener('click', () => {
    copyToClipboard(copiedText, copyButton); // Pass the button as an argument
  });
  return copyButton;
}


/*
function copyToClipboard(text, button) {
  navigator.clipboard.writeText(text)
    .then(() => {
      saveLastCopy(button.innerText);
      checkLastCopy();
    })
    .catch(error => {
      console.error('An error occurred while copying:', error);
    });
}
*/

function copyToClipboard(text, button) {
  // Remove brackets [ and ] from the text
  const cleanedText = text.replace(/[\【\】]/g, '”');

  // Create a temporary textarea element
  const textarea = document.createElement('textarea');
  textarea.value = cleanedText;
  
  // Append the textarea to the document
  document.body.appendChild(textarea);
  
  // Select the text in the textarea
  textarea.select();
  
  try {
    // Copy the selected text to the clipboard
    document.execCommand('copy');
    
    // Change the button text to "Copied"
    //button.innerText = 'Copied';
    //button.disabled = true; // Disable the button to prevent further copying
    // Save the 'Copied' state in localStorage
    saveLastCopy(button.innerText);
    checkLastCopy();
    console.log('Text copied to clipboard!');
    
    // Remove the temporary textarea from the document
    document.body.removeChild(textarea);
  } catch (error) {
    console.error('An error occurred while copying:', error);
  }
}



function checkStorage() {
  const savedInnerText = localStorage.getItem('savedInnerText');
  if (savedInnerText) {
    displayContent(savedInnerText);
  }

  const copyButtonDataJSON = localStorage.getItem('copyButtonData');
  if (copyButtonDataJSON) {
    const copyButtonData = JSON.parse(copyButtonDataJSON);
    copyButtonsContainer.innerHTML = ''; // Clear existing copy buttons

    // Recreate copy buttons from saved data
    for (const { buttonText, copiedText } of copyButtonData) {
      const copyButton = createCopyButton(buttonText, copiedText);
      copyButtonsContainer.appendChild(copyButton);
    }
  }
}

function checkLastCopy() {
  const lastCopyJSON = localStorage.getItem('lastCopyData');
  if (lastCopyJSON) {
    document.getElementById('lastCopy').innerText = lastCopyJSON;
  }
}

checkLastCopy();

function saveContent(content) {
  localStorage.setItem('savedInnerText', content);
}

function saveLastCopy(buttonText) {
  localStorage.setItem('lastCopyData', buttonText);
}

function savePrevNextChapterLinks(prevChapterLink, nextChapterLink) {
  localStorage.setItem('prevChapterLink', prevChapterLink);
  localStorage.setItem('nextChapterLink', nextChapterLink);
}

function goToChapterLink(chapterLink) {
  urlInput.value = chapterLink;
  scrapeContent();
  scrollToTop();
}

function goToPrevChapterLink() {
  const prevChapterLink = localStorage.getItem('prevChapterLink');
  goToChapterLink(prevChapterLink);
}

function goToNextChapterLink() {
  const nextChapterLink = localStorage.getItem('nextChapterLink');
  goToChapterLink(nextChapterLink);
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showBackToTopButton() {
  const button = document.querySelector('.backToTop');
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  button.classList.toggle('show', scrollTop > 20);
}

function pasteFromClipboard() {
  if (navigator.clipboard) {
    navigator.clipboard.readText().then(clipboardText => {
      urlInput.value = clipboardText;
    });
  } else {
    urlInput.focus();
    urlInput.select();
    document.execCommand('paste');
  }
}

// Function to check localStorage for the last saved URL and set it in the input
function checkLastUrl() {
  const lastUrl = localStorage.getItem('lastUrl');
  if (lastUrl) {
    urlInput.value = lastUrl;
  }
}

// Call checkLastUrl when the page loads to set the URL input value if it's available
checkLastUrl()
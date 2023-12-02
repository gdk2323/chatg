const memory = [];

async function scrapeContent() {
  const url = document.getElementById('urlInput').value.trim();
  if (url === '') {
    return;
  }

  const scrapeButton = document.getElementById('scrapeButton');
  scrapeButton.innerText = 'Scraping...'
  scrapeButton.disabled = true;

  try {
    const response = await fetch(`/scrape?url=${encodeURIComponent(url)}`);

    let data = await response.json();
    let content = data.content;
    console.log(content);
    content = content.replace(/\u2003/g, ''); // Replace emsp character with an empty string
    document.getElementById('content').innerText = content;
    saveContent();
    saveLang('CN');
    const btn = document.getElementById('translateButton');
    btn.disabled = false;

    const scrapeButton = document.getElementById('scrapeButton');
    scrapeButton.innerText = 'Scrape'
    scrapeButton.disabled = false;

    let prevContent = data.prevContent;
    console.log(prevContent);
    savePrevChapterLink(prevContent)

    let nextContent = data.nextContent;
    saveNextChapterLink(nextContent)

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

async function translateContent() {
  if (checkLang()) {
    return;
  }

  const btn = document.getElementById('translateButton');
  btn.innerText = 'Wait';
  btn.disabled = true;

  const message = document.getElementById('content').innerText;
  //const prompt = 'You are a professional translator and proofreader, your task is to accurately translate and proofread. Your goal is to capture the full essence and literary style of the original text, ensuring that the translated version maintains the same impact and artistic quality. Pay attention to the cultural context of the original text, especially Chinese cultural references, and find appropriate equivalents or explanations in the translated version. Maintain the flow and coherence of the text, ensuring that the translated version reads naturally and fluently while preserving the original author style and voice.';
  //const prompt = 'I want you to act as an English translator, spelling corrector and improver. I will speak to you in any language and you will detect the language, translate it and answer in the corrected and improved version of my text, in English. I want you to replace my simplified A0-level words and sentences with more beautiful and elegant, upper level English words and sentences. Keep the meaning same, but make them more literary. I want you to only reply the correction, the improvements and nothing else, do not write explanations.';
  const prompt = 'I want you to act as an English translator, spelling corrector and improver. I will speak to you in any language and you will detect the language, translate it and answer in the corrected and improved version of my text, in English. Keep the meaning same, but make them more literary. I want you to only reply the correction, the improvements and nothing else, do not write explanations.';

  try {
    const messages = [
      { role: 'system', content: prompt }, // Contextual prompt
      ...getLastSixMessages(memory).slice(1), // Exclude the first message from memory
      { role: 'user', content: message }
    ];

    const response = await fetch(
      //https://github.com/LiLittleCat/awesome-free-chatgpt
      //'https://cf1.easychat.work/api/openai/v1/chat/completions',  //16k
      'https://chat.acytoo.com/api/completions',
      //'https://free.freet.top/api/openai/v1/chat/completions',
      //'https://chatgpt.kiask.xyz/api/openai/v1/chat/completions', //16k-0613
      //'https://gpt4.ezchat.top/api/openai/v1/chat/completions', //16k-0613
      //'https://gptleg.zeabur.app/api/openai/v1/chat/completions', //16k
      //'https://gpt4.xunika.uk/api/openai/v1/chat/completions', //16k-0613
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          stream: true,
          model: 'gpt-3.5-turbo-16k', //gpt-3.5-turbo-16k-0613
          temperature: 0.5,
          presence_penalty: 0,
          frequency_penalty: 0,
          top_p: 1,
        }),
      }
    );

    if (response.ok) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let aiResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        const parsedLines = lines
          .map((line) => line.replace(/^data: /, "").trim())
          .filter((line) => line !== "" && line !== "[DONE]")
          .map((line) => {
            try {
              return JSON.parse(line);
            } catch (error) {
              console.error('Error parsing JSON:', error);
              return null;
            }
          })
          .filter((parsedLine) => parsedLine !== null);

        for (const parsedLine of parsedLines) {
          const { choices } = parsedLine;
          const { delta } = choices[0];
          const { content } = delta;

          if (content) {
            aiResponse += content;
          }
        }

        document.getElementById('content').innerText = aiResponse;
        saveContent();
        saveLang('EN');
      }

      document.getElementById('content').innerText = aiResponse;
      btn.innerText = 'Translate';

      memory.push({ role: 'user', content: message });
      memory.push({ role: 'assistant', content: aiResponse });

      trimMemory();
    } else {
      document.getElementById('content').innerText = 'Failed to receive a response from the API.';
    }
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('content').innerText = error;
  } finally {
    btn.disabled = true;
  }
}


function trimMemory() {
  if (memory.length > 6) {
    memory.splice(1, memory.length - 6);
  }
}

function getLastSixMessages(memory) {
  const startIndex = Math.max(0, memory.length - 6);
  return memory.slice(startIndex);
}

function copyText() {
  const content = document.getElementById('content').innerText.trim();
  navigator.clipboard.writeText(content)
    .then(() => {
      alert('Plain text copied to clipboard!');
    })
    .catch(error => {
      console.error('An error occurred while copying:', error);
    });
}

function checkStorage() {
  const contentElement = document.getElementById('content');
  const savedInnerText = localStorage.getItem('savedInnerText');

  if (savedInnerText) {
    contentElement.innerText = savedInnerText;
  }
}
checkStorage();

function saveContent() {
  const contentElement = document.getElementById('content');
  const innerText = contentElement.innerText;
  localStorage.setItem('savedInnerText', innerText);
}

function saveLang(lang) {
  localStorage.setItem('LANG', lang);
}

function saveNextChapterLink(nextChapterLink) {
  localStorage.setItem('nextChapterLink', nextChapterLink);
}

function savePrevChapterLink(prevChapterLink) {
  localStorage.setItem('prevChapterLink', prevChapterLink);
}

function goToPrevChapterLink() {
  const prevChapterLink = localStorage.getItem('prevChapterLink');
  document.getElementById('urlInput').value = prevChapterLink;
  scrapeContent();
  scrollToTop();
}

function goToNextChapterLink() {
  const nextChapterLink = localStorage.getItem('nextChapterLink');
  document.getElementById('urlInput').value = nextChapterLink;
  scrapeContent();
  scrollToTop();
}

function checkLang() {
  const language = localStorage.getItem('LANG');
  const btn = document.getElementById('translateButton');

  if (language === 'EN') {
    btn.disabled = true;
    return true;
  }

  btn.disabled = false;
  return false;
}
checkLang();

window.onscroll = function() {
  showBackToTopButton();
};

function showBackToTopButton() {
  const button = document.querySelector('.backToTop');
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    button.classList.add('show');
  } else {
    button.classList.remove('show');
  }
}

function scrollToTop() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const pasteButton = document.getElementById('pasteButton');

if (isMobile) {
  pasteButton.addEventListener('click', function() {
    const inputElement = document.getElementById('urlInput');
    inputElement.focus();
    inputElement.select();
    inputElement.setSelectionRange(0, 99999);
    document.execCommand('paste');
  });
} else {
  pasteButton.addEventListener('click', function() {
    navigator.clipboard.readText().then(function(clipboardText) {
      document.getElementById('urlInput').value = clipboardText;
    });
  });
}




async function translateContent2() {
  if (checkLang()) {
    return;
  }

  const btn = document.getElementById('translateButton');
  btn.innerText = 'Wait';
  btn.disabled = true;

  const message = document.getElementById('content').innerText;
  //const prompt = 'You are a professional translator and proofreader, your task is to accurately translate and proofread. Your goal is to capture the full essence and literary style of the original text, ensuring that the translated version maintains the same impact and artistic quality. Pay attention to the cultural context of the original text, especially Chinese cultural references, and find appropriate equivalents or explanations in the translated version. Maintain the flow and coherence of the text, ensuring that the translated version reads naturally and fluently while preserving the original author style and voice.';
  //const prompt = 'I want you to act as an English translator, spelling corrector and improver. I will speak to you in any language and you will detect the language, translate it and answer in the corrected and improved version of my text, in English. I want you to replace my simplified A0-level words and sentences with more beautiful and elegant, upper level English words and sentences. Keep the meaning same, but make them more literary. I want you to only reply the correction, the improvements and nothing else, do not write explanations.';
  const prompt = 'I want you to act as an English translator, spelling corrector and improver. I will speak to you in any language and you will detect the language, translate it and answer in the corrected and improved version of my text, in English. Keep the meaning same, but make them more literary. I want you to only reply the correction, the improvements and nothing else, do not write explanations.';

  try {
    const paragraphs = message.split('\n\n');
    const paragraphGroups = [];
    for (let i = 0; i < paragraphs.length; i += 10) {
      paragraphGroups.push(paragraphs.slice(i, i + 10));
    }

    let aiResponse = '';

    //let count = 0;
    for (const group of paragraphGroups) {
      const messages = [
        { role: 'system', content: prompt }, // Contextual prompt
        ...getLastSixMessages(memory).slice(1), // Exclude the first message from memory
        { role: 'user', content: group.join('\n\n') }
      ];

      const response = await fetch(
        //https://github.com/LiLittleCat/awesome-free-chatgpt
        //'https://cf1.easychat.work/api/openai/v1/chat/completions',  //16k ERROR
        'https://chat.acytoo.com/api/completions',
        //'https://chat8.fastgpt.me/api/openai/v1/chat/completions', // same as above
        //'https://beta.easychat.work/api/openai/v1/chat/completions', // same as above
        //'https://yb6lsn0s.freet.top/api/openai/v1/chat/completions', // Sites work but error?
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages,
            stream: false, // Disable streaming
            model: 'gpt-3.5-turbo-16k-0613', //
            temperature: 0.5,
            presence_penalty: 0,
            frequency_penalty: 0,
            top_p: 1,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log(data);
        if (data.choices && data.choices.length > 0) {
          const aiResponseChunk = data.choices[data.choices.length - 1].message.content;
          aiResponse += aiResponseChunk + '\n\n';
          document.getElementById('content').innerText = aiResponse;
          

          //memory.push({ role: 'user', content: message });
          //memory.push({ role: 'assistant', content: aiResponse });

          /*
          count++;
          if (count === 6) {
            trimMemory();
          }
          */
        } else {
          document.getElementById('content').innerText = 'Failed to receive a response from the API.';
          return;
        }
      } else {
        document.getElementById('content').innerText = 'Failed to receive a response from the API. 2';
        return;
      }
    }
    saveContent();
    saveLang('EN');
    trimMemory();
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('content').innerText = error;
  } finally {
    btn.disabled = true;
    btn.innerText = 'Translate';
  }
}

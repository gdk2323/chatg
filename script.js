// Get references to the HTML elements
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Memory array to store previous messages
const memory = [];

// Event listener for the send button
sendButton.addEventListener('click', sendMessage);

// Event listener for the Enter key
userInput.addEventListener('keydown', function (event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
});

// Function to send user message and receive response
// Function to send user message and receive response
async function sendMessage() {
  const message = userInput.value;

  // Display user message in the chat container
  displayMessage('user', message);

  try {
    const paragraphs = message.split('\n\n'); // Split the message into paragraphs

    for (let i = 0; i < paragraphs.length; i += 4) {
      const currentParagraphs = paragraphs.slice(i, i + 4); // Get the next four paragraphs

      const messages = [
        { role: 'system', content: 'I want you to act as a professional translator and proofreader, capture the full essence and literary style of the original text.' }, // Contextual prompt
        ...getLastSixMessages(memory).slice(1), // Exclude the first message from memory
        { role: 'user', content: currentParagraphs.join('\n\n') } // Join the paragraphs into a single message
      ];

      // Send messages and memory to the OpenAI API
      const response = await fetch(
        //'https://free.easychat.work/api/openai/v1/chat/completions',
        'https://gpt4.xunika.uk/api/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages,
            stream: false,
            model: 'gpt-3.5-turbo-16k-0613',
            temperature: 0.5,
            presence_penalty: 0,
            frequency_penalty: 0,
            top_p: 1,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
          const aiResponse = data.choices[data.choices.length - 1].message.content;

          // Display AI response in the chat container
          displayMessage('assistant', aiResponse);

          // Store the user message and AI response in memory
          memory.push({ role: 'user', content: currentParagraphs.join('\n\n') });
          memory.push({ role: 'assistant', content: aiResponse });

          // Trim the memory to keep only the last 6 messages
          trimMemory();
        } else {
          throw new Error('Invalid response from the API.');
        }
      } else {
        throw new Error('Failed to receive a response from the API.');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }

  // Clear the user input field
  userInput.value = '';
}


// Function to display a message in the chat container
function displayMessage(role, content) {
  const messageElement = document.createElement('div');
  messageElement.classList.add(role);
  messageElement.textContent = content;
  chatContainer.appendChild(messageElement);
}

// Function to get the last six messages from the memory
function getLastSixMessages(memory) {
  const startIndex = Math.max(0, memory.length - 6);
  return memory.slice(startIndex);
}

// Function to trim the memory and keep only the last six messages
function trimMemory() {
  if (memory.length > 6) {
    const startIndex = memory.length - 6;
    memory.splice(1, startIndex - 1); // Remove the first message from memory
  }
}
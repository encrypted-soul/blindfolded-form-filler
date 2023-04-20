chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startFilling") {
    startFormFilling();
  }
});

let currentInputIndex = 0;
let currentInputType = "";

function startFormFilling() {
  // Speech recognition and synthesis objects
  const recognition = new webkitSpeechRecognition();
  const synth = window.speechSynthesis;

  // Initialize speech recognition settings
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  // Start speech recognition
  recognition.start();

  // Start form interaction
  findNextInput();
}

recognition.addEventListener("result", (event) => {
  const lastIndex = event.results.length - 1;
  const transcript = event.results[lastIndex][0].transcript.trim();

  // Handle speech input and form interaction based on the transcript
  switch (currentInputType) {
    case "textbox":
      handleTextInput(transcript);
      break;
    case "checkbox":
      handleCheckbox(transcript);
      break;
    case "radio":
      handleRadioButton(transcript);
      break;
    case "dropdown":
      handleDropdown(transcript);
      break;
    default:
      break;
  }
});

function speak(text, callback) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.onend = () => {
    if (callback) {
      callback();
    }
  };
  synth.speak(utterance);
}

function findNextInput() {
  const inputElements = document.querySelectorAll(
    'input[type="text"], input[type="checkbox"], input[type="radio"], select'
  );

  if (currentInputIndex < inputElements.length) {
    const inputElement = inputElements[currentInputIndex];
    const inputTagName = inputElement.tagName.toLowerCase();
    const inputType = inputElement.type;

    if (inputTagName === "input") {
      currentInputType =
        inputType === "checkbox" || inputType === "radio"
          ? inputType
          : "textbox";
    } else if (inputTagName === "select") {
      currentInputType = "dropdown";
    }

    // Read out the current question or label associated with the input
    const label = document.querySelector(`label[for="${inputElement.id}"]`);
    if (label) {
      speak(label.textContent, () => {
        // Start listening for user input after reading out the question
        recognition.start();
      });
    }

    // Increment the current input index
    currentInputIndex++;
  } else {
    // End of form reached
    speak("End of form. Say the word SUBMIT to submit.", () => {
      // Listen for the "SUBMIT" command to submit the form
      recognition.addEventListener("result", (event) => {
        const lastIndex = event.results.length - 1;
        const transcript = event.results[lastIndex][0].transcript.trim();

        if (transcript.toUpperCase() === "SUBMIT") {
          recognition.stop();
          // Find the first form element and submit the form
          const formElement = document.querySelector("form");
          if (formElement) {
            formElement.submit();
          } else {
            speak("Form submission failed. No form element found.");
          }
        }
      });
    });
  }
}

function handleTextInput(transcript) {
  if (transcript.startsWith("enter")) {
    const inputElement = document.querySelector(
      'input[type="text"]:nth-of-type(' + currentInputIndex + ")"
    );
    const inputValue = transcript.substring(5).trim();
    inputElement.value = inputValue;

    // Move to the next input element
    findNextInput();
  }
}

function handleCheckbox(transcript) {
  if (transcript.startsWith("select")) {
    const inputElement = document.querySelector(
      'input[type="checkbox"]:nth-of-type(' + currentInputIndex + ")"
    );
    const optionNumber = parseInt(transcript.substring(6).trim());

    if (!isNaN(optionNumber) && optionNumber > 0) {
      inputElement.checked = !inputElement.checked;
    }

    // Move to the next input element
    findNextInput();
  }
}

function handleRadioButton(transcript) {
  if (transcript.startsWith("select")) {
    const optionNumber = parseInt(transcript.substring(6).trim());
    const inputElements = document.querySelectorAll(
      'input[type="radio"]:nth-of-type(' + currentInputIndex + ")"
    );

    if (
      !isNaN(optionNumber) &&
      optionNumber > 0 &&
      optionNumber <= inputElements.length
    ) {
      inputElements[optionNumber - 1].checked = true;
    }

    // Move to the next input element
    findNextInput();
  }
}

function handleDropdown(transcript) {
  if (transcript.startsWith("select")) {
    const selectElement = document.querySelector(
      "select:nth-of-type(" + currentInputIndex + ")"
    );
    const optionNumber = parseInt(transcript.substring(6).trim());

    if (
      !isNaN(optionNumber) &&
      optionNumber > 0 &&
      optionNumber <= selectElement.options.length
    ) {
      selectElement.selectedIndex = optionNumber - 1;
    }

    // Move to the next input element
    findNextInput();
  }
}

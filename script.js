document.addEventListener("DOMContentLoaded", function () {
  let tabsContainer = document.getElementById("tabs");
  let editorContainer = document.getElementById("editorContainer");
  let addTabBtn = document.getElementById("addTabBtn");
  let clearBtn = document.getElementById("clearBtn");
  let saveBtn = document.getElementById("saveBtn");
  let importBtn = document.getElementById("importBtn");
  let savePdfBtn = document.getElementById("savePdfBtn");

  let activeTab = null;

  // Load tabs from localStorage
  function loadTabs() {
    let savedTabs = JSON.parse(localStorage.getItem("tabs")) || [];
    if (savedTabs.length === 0) {
      addNewTab();
    } else {
      savedTabs.forEach((tabId) => addNewTab(tabId, false));
      setActiveTab(savedTabs[0]);
    }
    updateTabNumbers(); // Update tab numbers on load
  }

  function saveTabs() {
    let tabIds = Array.from(document.querySelectorAll(".tab")).map(
      (tab) => tab.dataset.tab
    );
    localStorage.setItem("tabs", JSON.stringify(tabIds));
  }

  // Function to update tab numbers to maintain sequence
  function updateTabNumbers() {
    let tabs = document.querySelectorAll(".tab");
    tabs.forEach((tab, index) => {
      // Find the text node to update (before the close button)
      let tabTextContent = tab.childNodes[0];
      // Update only the tab number text
      if (tabTextContent && tabTextContent.nodeType === Node.TEXT_NODE) {
        tabTextContent.textContent = `Tab ${index + 1} `;
      } else {
        // If structure is different, just set the whole content
        tab.innerHTML = `Tab ${index + 1} <button class="close-tab"><span class="material-icons">close</span></button>`;
        // Re-add the close event listener
        tab.querySelector(".close-tab").addEventListener("click", function (e) {
          e.stopPropagation();
          if (confirmTabClose()) {
            closeTab(tab.dataset.tab);
          }
        });
      }
    });
  }

  function addNewTab(tabId = null, focusNew = true) {
    if (!tabId) {
      tabId = `tab${Date.now()}`;
    }

    // Create new tab
    let tab = document.createElement("div");
    tab.className = "tab";
    tab.dataset.tab = tabId;
    tab.innerHTML = `Tab ${tabsContainer.children.length + 1} 
    <button class="close-tab"><span class="material-icons">close</span></button>`;

    // Create new editor
    let editor = document.createElement("div");
    editor.className = "editor";
    editor.contentEditable = true;
    editor.dataset.tab = tabId;
    // document.getElementById("editorContainer").appendChild(editor);
    

    // Restore saved content
    let savedContent = localStorage.getItem(tabId);
    if (savedContent) {
      editor.innerHTML = savedContent;
    }

    // Setup paste event to handle clean paste
    editor.addEventListener("paste", handlePaste);

    // Save content to localStorage on input
    editor.addEventListener("input", function () {
      localStorage.setItem(tabId, editor.innerHTML);
    });

    tabsContainer.appendChild(tab);
    editorContainer.appendChild(editor);

    saveTabs();

    // Set active tab
    if (focusNew) setActiveTab(tabId);

    // Close tab event
    tab.querySelector(".close-tab").addEventListener("click", function (e) {
      e.stopPropagation();
      if (confirmTabClose()) {
        closeTab(tabId);
      }
    });

    tab.addEventListener("click", function () {
      setActiveTab(tabId);
    });
  }

  // Confirm before closing a tab
  function confirmTabClose() {
    return confirm("Are you sure you want to close this tab?");
  }

  // Handle paste to strip formatting
  function handlePaste(e) {
    e.preventDefault();
    
    // Get plain text from clipboard
    const text = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
    
    // Insert text at cursor position
    document.execCommand('insertText', false, text);
  }

  function setActiveTab(tabId) {
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".editor")
      .forEach((e) => (e.style.display = "none"));

    let activeTabElement = document.querySelector(`.tab[data-tab="${tabId}"]`);
    let activeEditor = document.querySelector(`.editor[data-tab="${tabId}"]`);

    if (activeTabElement && activeEditor) {
      activeTabElement.classList.add("active");
      activeEditor.style.display = "block";
      activeTab = tabId;
      localStorage.setItem("activeTab", tabId);
      
      // Scroll to active tab
      activeTabElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  function closeTab(tabId) {
    const tabToClose = document.querySelector(`.tab[data-tab="${tabId}"]`);
    const tabsList = Array.from(document.querySelectorAll(".tab"));
    const currentIndex = tabsList.indexOf(tabToClose);
    
    // Determine which tab to activate next
    let nextTabIndex;
    if (tabToClose.classList.contains("active")) {
      // If closing the active tab, move to previous tab if available
      if (currentIndex > 0) {
        // Move to previous tab
        nextTabIndex = currentIndex - 1;
      } else if (tabsList.length > 1) {
        // If it's the first tab, move to the second one
        nextTabIndex = 0;
      }
    }
    
    // Remove the tab and editor
    tabToClose.remove();
    document.querySelector(`.editor[data-tab="${tabId}"]`).remove();
    localStorage.removeItem(tabId);
    
    // Update tab numbers to maintain sequence
    updateTabNumbers();
    
    // Set active tab
    let remainingTabs = document.querySelectorAll(".tab");
    if (remainingTabs.length > 0) {
      if (nextTabIndex !== undefined && remainingTabs[nextTabIndex]) {
        setActiveTab(remainingTabs[nextTabIndex].dataset.tab);
      } else {
        setActiveTab(remainingTabs[0].dataset.tab);
      }
    } else {
      addNewTab();
    }
    
    saveTabs();
  }

  addTabBtn.addEventListener("click", function () {
    addNewTab();
  });

  clearBtn.addEventListener("click", function () {
    if (activeTab) {
      let activeEditor = document.querySelector(
        `.editor[data-tab="${activeTab}"]`
      );
      if (activeEditor) {
        if (confirm("Are you sure you want to clear this document?")) {
          activeEditor.innerHTML = "";
          localStorage.removeItem(activeTab);
        }
      }
    }
  });

  // Load tabs on page load
  loadTabs();

  // Restore active tab
  let lastActiveTab = localStorage.getItem("activeTab");
  if (lastActiveTab) {
    setActiveTab(lastActiveTab);
  }

  // Text formatting functions
  function applyCommand(command) {
    document.execCommand(command, false, null);
  }

  function increaseFontSize() {
    let activeEditor = document.querySelector(
      '.editor[style*="display: block"]'
    );
    if (activeEditor) {
      let currentSize = window.getComputedStyle(activeEditor).fontSize;
      activeEditor.style.fontSize = parseInt(currentSize) + 2 + "px";
    }
  }

  function decreaseFontSize() {
    let activeEditor = document.querySelector(
      '.editor[style*="display: block"]'
    );
    if (activeEditor) {
      let currentSize = window.getComputedStyle(activeEditor).fontSize;
      activeEditor.style.fontSize = parseInt(currentSize) - 2 + "px";
    }
  }

  // Save content as .txt file
  saveBtn.addEventListener("click", function () {
    let activeEditor = document.querySelector(
      '.editor[style*="display: block"]'
    );
    if (activeEditor) {
      const textContent = activeEditor.innerText;
      const fileName = `Wordpad_${new Date().toISOString().slice(0, 10)}.txt`;

      const blob = new Blob([textContent], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    }
  });

  // Import .txt file
  importBtn.addEventListener("click", function () {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt";
    input.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          let activeEditor = document.querySelector(
            '.editor[style*="display: block"]'
          );
          if (activeEditor) {
            activeEditor.innerText = e.target.result;
            localStorage.setItem(
              activeEditor.dataset.tab,
              activeEditor.innerHTML
            );
          }
        };
        reader.readAsText(file);
      }
    });
    input.click();
  });

  // Save content as PDF
  savePdfBtn.addEventListener("click", function () {
    const { jsPDF } = window.jspdf;
    let doc = new jsPDF();
    let activeEditor = document.querySelector(
      '.editor[style*="display: block"]'
    );

    if (activeEditor) {
      doc.setFont("helvetica");
      doc.setFontSize(12);
      const content = activeEditor.innerText;
      const fileName = `PDF_Pad_${new Date().toISOString().slice(0, 10)}.pdf`;

      let marginLeft = 10,
        marginTop = 20,
        maxWidth = 180,
        lineHeight = 6,
        pageHeight = doc.internal.pageSize.height - 20;
      let splitText = doc.splitTextToSize(content, maxWidth);
      let cursorY = marginTop;

      splitText.forEach((line) => {
        if (cursorY + lineHeight > pageHeight) {
          doc.addPage();
          cursorY = marginTop;
        }
        doc.text(line, marginLeft, cursorY);
        cursorY += lineHeight;
      });

      doc.save(fileName);
    }
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", function(e) {
    // Alt+T: Add new tab
    if (e.altKey && e.key === "t") {
      e.preventDefault();
      addNewTab();
    }
    // Alt+W: Close current tab
    if (e.altKey && e.key === "w") {
      e.preventDefault();
      if (activeTab) {
        if (confirmTabClose()) {
          closeTab(activeTab);
        }
      }
    }
  });

  // Expose functions globally for button clicks
  window.boldText = () => applyCommand("bold");
  window.italicText = () => applyCommand("italic");
  window.underlineText = () => applyCommand("underline");
  window.increaseFontSize = increaseFontSize;
  window.decreaseFontSize = decreaseFontSize;
  
  // Add confirmation when closing browser tab/window
  window.addEventListener('beforeunload', function (e) {
    // Standard way to show a confirmation dialog when closing the page
    const confirmationMessage = 'Are you sure you want to leave? Your changes may not be saved.';
    
    // Different browsers handle this differently
    e.returnValue = confirmationMessage; // Standard for most browsers
    return confirmationMessage; // For older browsers
  });
});

function strikethroughText() {
    document.execCommand('strikethrough');
}

// Add this to your JavaScript file or in a script tag
document.addEventListener('DOMContentLoaded', function() {
  const tabsContainer = document.querySelector('.tabs');
  
  // Enable horizontal scrolling with mouse wheel
  tabsContainer.addEventListener('wheel', function(event) {
      event.preventDefault();
      
      // Scroll horizontally instead of vertically
      // Multiply by 3 for faster scrolling speed (adjust as needed)
      tabsContainer.scrollLeft += (event.deltaY * 3);
  });
});
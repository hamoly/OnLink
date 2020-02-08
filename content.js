// gets the active tab's link and assiging it to the link input value of adding new link panel
chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
  document.getElementById('link').value = tabs[0].url;
});

// retrieving and storing new link panel values to variables
document.getElementById('addLink').addEventListener('click', function getNewLinkAttr() {
  var projectName = document.getElementById('project').value;
  var originalLink = document.getElementById('link').value;
  var createdAt = Math.round(new Date().getTime()/1000);
  sendMessage(projectName, originalLink, createdAt);
});

// Defining a port to exchange messages between popup and background scripts
const port = chrome.runtime.connect({name: "newLink"});

// sending new link values as an object to background script "contoller.js"
function sendMessage(projectName, originalLink, createdAt){
    port.postMessage({projectName: projectName, originalLink: originalLink, createdAt: createdAt});
}


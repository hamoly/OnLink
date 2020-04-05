let state, originalLink, projectName;

// Defining a port to exchange messages between content "content.js" and background script "background.js"
const port = chrome.runtime.connect({name: 'newLink'});

// check if project name already exists in database
document.getElementById('project').addEventListener('input', function projectNameVerifyInit() {
  projectName = document.getElementById('project').value;
  if (projectName !== '') {
  let type = 'verify';
  sendMessage(projectName, originalLink, type);
}
});

// retrieving and storing new link panel values to variables
document.getElementById('addLink').addEventListener('click', function getNewLinkAttrInit() {
  let type = 'add';
  sendMessage(projectName, originalLink, type);
});

// sends new link values as an object to background script "background.js"
const sendMessage = (projectName, originalLink, type) =>
  port.postMessage({projectName: projectName, originalLink: originalLink, type: type});


// Disable add new link button at the popup page "popup.html"
const disableAddButton = () => document.getElementById('addLink').disabled = true;

// Enable add new link button at the popup page "popup.html"
const enableAddButton = () => document.getElementById('addLink').disabled = false;

// Recieve messages from the background script "background.js"
port.onMessage.addListener(m => {

  // active tab url
  originalLink = m.taburl

  // project name verification response
  state = m.state;

  // gets the active tab url and assiging it to the link input value of adding new link panel
  document.getElementById('link').value = originalLink;
  
  switch(state) {  
    case 'projectNameExist':
      document.getElementById('projectNameExists').classList.remove('display');
      disableAddButton();
    break;
    case 'projectNameDoesnotExist':
      document.getElementById('projectNameExists').classList.add('display');
      enableAddButton();
    break;
    case 'dbError':
      document.getElementById('dbError').classList.remove('display');
      disableAddButton();
    break;
    case 'linkAddedSuccessfully':
      document.getElementById('succsed').classList.remove('display');
      document.getElementById('succsed').insertAdjacentHTML('afterend', `<a href='#' class='success'>http://o/${projectName}</a>`);
      document.getElementById('project').value = '';
    break;
    default:
      disableAddButton();
  }
})

var form = document.getElementById("newLinkForm");
function handleForm(event) { event.preventDefault(); } 
form.addEventListener('submit', handleForm);
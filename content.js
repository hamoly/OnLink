if (document.title === "OnLink") {
  let state, originalLink, projectName;



  // Defining a port to exchange messages between content "content.js" and background script "background.js"

  const port = chrome.runtime.connect({ name: 'newLink' });

  // check if project name already exists in database
  /**
   * @constructor kerker
   * @description gets project input value at input
   */
  document.getElementById('project').addEventListener('input', function projectNameVerifyInit() {
    projectName = document.getElementById('project').value;
    if (projectName !== '') {
      let type = 'verify';
      sendMessage(projectName, originalLink, type);
    }
  });

  // retrieving and storing new link panel values to variables
  /**
   * @constructor mermer
   * @description listens to submit button and send message to the background
   */
  document.getElementById('addLink').addEventListener('click', function getNewLinkAttrInit() {
    let type = 'add';
    sendMessage(projectName, originalLink, type);
  });

  // sends new link values as an object to background script "background.js"
  /**
   * @description sends new link values as an object to background script "background.js"
   * @param {string} projectName - project name
   * @param {string} originalLink - the link will be shorten
   * @param {string} type - type of message Add/verify
   */
  const sendMessage = (projectName, originalLink, type) =>
    port.postMessage({ projectName: projectName, originalLink: originalLink, type: type });


  /**
   * @description Disables submit button at the popup page "popup.html"
   */
  const disableAddButton = () => document.getElementById('addLink').disabled = true;

  /**
   * @description Enables submit button at the popup page "popup.html"
   */
  const enableAddButton = () => document.getElementById('addLink').disabled = false;

  /**
   * @constructor onMessage
   * @description Recieves messages from the background script "background.js"
   */
  port.onMessage.addListener(m => {

    // active tab url
    originalLink = m.taburl

    // project name verification response
    state = m.state;

    // gets the active tab url and assiging it to the link input value of adding new link panel
    document.getElementById('link').value = originalLink;

    switch (state) {
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
        document.getElementById('succsed').insertAdjacentHTML('afterend', `<a href='http://on/${ projectName }' target="_blank" class='success'>${ projectName }</a>`);
        document.getElementById('project').value = '';
        break;
      default:
        disableAddButton();
    }
  })

  var form = document.getElementById("newLinkForm");
  function handleForm(event) { event.preventDefault(); }
  form.addEventListener('submit', handleForm);
}
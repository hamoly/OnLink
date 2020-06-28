var db, tabid, msgPort;
////////
// INDEXEDDB
// Create indexedDB Request if not found
let dbOpenRequest = indexedDB.open('onlinks', 2);
// Create objectstore if not found
dbOpenRequest.onupgradeneeded = e => {
  // saving opened DB to "db" variable
  db = e.target.result;
  // Creating objectStore on this database
  db.createObjectStore('shortenlink', { keyPath: 'key' });
};
// Indexeddb Created Successfully
// saving created DB to "db" variable
dbOpenRequest.onsuccess = e => db = e.target.result;
// Indexeddb creating request error
dbOpenRequest.onerror = e => console.log(e.target.error);

////////
// NEW LINK
// Lestining to messages from popup script
chrome.runtime.onConnect.addListener(port => {
  // saving port result to use it later
  msgPort = port;
  // getting current tab URL
  chrome.tabs.query({ 'active': true, 'lastFocusedWindow': true }, function (tabs) {
    activeTabURL = tabs[0].url
    msgPort.postMessage({ taburl: activeTabURL });
  });

  // Recieving message from popup if port name is the same
  port.onMessage.addListener(msg => {
    // Checking the recived message port if the same as assigned at popup
    if (port.name == 'newLink' && msg.type == 'add') {
      // Firing addNewLinkObj function with the recieved message to add the link to indexeddb
      addNewLinkObj(msg);
    }
    if (port.name == 'newLink' && msg.type == 'verify') {
      // Firing addNewLinkObj function with the recieved message to add the link to indexeddb
      projectNameVerify(msg)
    }
  })
});

// Add new link object
const addNewLinkObj = msg => {
  // Forming new link object and saving it to "newLink" variable
  let newLink = ({ key: `${ msg.projectName }`, link: msg.originalLink });
  // Openning a read/write db transaction, ready for adding the data
  let transactionRW = db.transaction(['shortenlink'], 'readwrite').objectStore('shortenlink');
  // Make a request to add new link object to the object store
  let addNewLinkReq = transactionRW.add(newLink);
  // Link Added Successfully
  addNewLinkReq.onsuccess = () => msgPort.postMessage({ taburl: activeTabURL, state: 'linkAddedSuccessfully' });
  // Error adding link
  addNewLinkReq.onerror = () => msgPort.postMessage({ taburl: activeTabURL, state: 'dbError' });
}

// check if entered project name already exists in DB
const projectNameVerify = msg => {
  let projectName = (`${ msg.projectName }`);
  console.log(projectName);
  // Openning a read only db transaction, ready for fetching data
  let transactionRO = db.transaction(['shortenlink'], 'readonly').objectStore('shortenlink');
  // Fetching original link request
  let linkValueRequest = transactionRO.get(projectName);
  // Fetching original request link successed
  linkValueRequest.onsuccess = () => {
    if (linkValueRequest.result && linkValueRequest.result.link) {
      msgPort.postMessage({ taburl: activeTabURL, state: 'projectNameExist' });
    } else {
      msgPort.postMessage({ taburl: activeTabURL, state: 'projectNameDoesnotExist' });
    }
  }
  linkValueRequest.onerror = () => msgPort.postMessage({ taburl: activeTabURL, state: 'dbError' });
};
////////
// REDIRECTING REQUESTED LINK
// Fetching tab url and id before navigation and fire getLinkfromDB if it contains onlink/*
chrome.webNavigation.onBeforeNavigate.addListener(tab => {
  // saving tab.id
  tabid = tab.id
  // saving tab.url
  tolink = tab.url
  // fire getLinkfromDB if tab url contains onlink/*
  if (/o\/(.)/gi.test(tolink)) {
    getLinkfromDB(tolink);
  } else {
    console.log('nay');
  }
});
// fetching link and redirect if found
const getLinkfromDB = bekh => {
  let tolink = bekh.replace(/([^\s]+):\/+o\//ig, "");
  console.log(bekh)
  console.log(tolink)
  // Openning a read only db transaction, ready for fetching data
  let transactionRO = db.transaction(['shortenlink'], 'readonly').objectStore('shortenlink');
  // Fetching original link request
  let linkValueRequest = transactionRO.get(`${ tolink }`);
  // Fetching original request link successed
  linkValueRequest.onsuccess = () => {
    // saving the link value from the result of transaction
    if (linkValueRequest.result) {
      let linkValue = linkValueRequest.result.link
      // updating tab url by the link value fo DB
      chrome.tabs.update(tabid, { url: linkValue });
      console.log(linkValueRequest.result.link)
    } else {
      chrome.tabs.update(tabid, { url: '404.html' });
    }
  };
  linkValueRequest.onerror = err => console.log(err);
};

function bekh(requestURL) {
  getLinkfromDB(`${ requestURL }`)
}
chrome.omnibox.onInputEntered.addListener(requestURL => bekh(requestURL));

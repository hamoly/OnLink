/**
 * Global variables encapsulated in background
 * @param {string} db - for database
 * @param {number} tabid - the current tab id
 * @param {number} msgPort - the message port between content and background
 */
let db, tabid, msgPort;
/**
 * Creating indexeddb database
 * @param {string} onlinks - the name of the database
 * @param {number} 2 - version of the database.
 */
let dbOpenRequest = indexedDB.open('onlinks', 2);

/**
 * Creating object store on the database
 * @param {string} e - the event of creating the database
 */
dbOpenRequest.onupgradeneeded = e => {
  // saving opened DB to "db" variable
  db = e.target.result;
  // Creating objectStore on this database
  db.createObjectStore('shortenlink', { keyPath: 'key' });
};

/**
 * saving indexeddb database result
 * @param {string} e - the event of creating database
 */
dbOpenRequest.onsuccess = e => db = e.target.result;
/**
 * catshing errors from creating indexeddb Database
 * @param {string} e - the event of creating database
 */
dbOpenRequest.onerror = e => console.log(e.target.error);

/**
 * init message passing
 * @constructor onConnect
 * @param {number} port - port number for message passing
 */
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

/**
 * Adds link object to the database
 * @param msg - an object contains projectName and originalLink
 */
const addNewLinkObj = msg => {
  /**
   * new link object
   * @type {{key: string, link: string}}
   */
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

/**
 * checks if entered project name already exists in DB
 * @param {string} msg - contains project name
 */
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

/**
 * @constructor onBeforeNavigate
 * @description Fetching tab url and id before navigation and fire getLinkfromDB if it contains onlink
 * @param {string} tab -Tab information
 */
chrome.webNavigation.onBeforeNavigate.addListener(tab => {
  // saving tab.id
  tabid = tab.id
  // saving tab.url
  tolink = tab.url
  // fire getLinkfromDB if tab url contains onlink/*
  if (/on\/(.)/gi.test(tolink)) {
    getLinkfromDB(tolink);
  } else {
    console.log('nay');
  }
});

/**
 * Fetch Link from DB
 * @param {string} bekh - url
 */
const getLinkfromDB = bekh => {
  let tolink = bekh.replace(/([^\s]+):\/+on\//ig, "");
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
/**
 * @description trigers getLinkfromDB with the requestURL
 * @param {string} requestURL - url
 */
function bekh(requestURL) {
  getLinkfromDB(`${ requestURL }`)
}
/**
 * @constructor onInputEntered
 * @description Listens to the omni box input
 * @param {string} requestURL - url
 */
chrome.omnibox.onInputEntered.addListener(requestURL => bekh(requestURL));

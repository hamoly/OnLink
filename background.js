var db, tabid, tolink;
////////
// INDEXEDDB
// Create indexedDB Request if not found
let dbOpenRequest = indexedDB.open("onlinks", 2);
// Create objectstore if not found
dbOpenRequest.onupgradeneeded = e => { 
  // saving opened DB to "db" variable
  let db = event.target.result;
  // Creating objectStore on this database
  let objectStore = db.createObjectStore("shortenlink", { keyPath: 'key' });
};
// Indexeddb Created Successfully
// saving created DB to "db" variable
dbOpenRequest.onsuccess = e => db = dbOpenRequest.result;
// Indexeddb creating request error
dbOpenRequest.onerror = e => console.log(e.target.error);

////////
// NEW LINK
// Lestining to messages from popup script
chrome.runtime.onConnect.addListener(port => {
  // Checking the recived message port if the same as assigned at popup
  if(port.name == "newLink") {
    // Recieving message from popup if port name is the same
    port.onMessage.addListener(msg =>       
      // Firing addNewLinkObj function with the recieved message to add the link to indexeddb
      addNewLinkObj(msg));
    }
  });

// Adding new link object
const addNewLinkObj = msg => {
  // Forming new link object and saving it to " newLink " variable 
  let newLink = ({ key: `http://onlink/${msg.projectName}/${msg.createdAt}`, link: msg.originalLink});
  // Openning a read/write db transaction, ready for adding the data
  let transactionRW = db.transaction(["shortenlink"], "readwrite").objectStore("shortenlink");
  // Make a request to add new link object to the object store
  let addNewLinkReq = transactionRW.add(newLink);
  // Link Added Successfully
  addNewLinkReq.onsuccess = function(e) {console.log(e.target.result)};
  // Error adding link
  addNewLinkReq.onerror = function(error) {console.log(error)};
}

////////
// REDIRECTING REQUESTED LINK
// Fetching tab url and id before navigation and fire getLinkfromDB if it contains onlink/*
chrome.webNavigation.onBeforeNavigate.addListener(tab => {
  // saving tab.id
  tabid = tab.id
  // saving tab.url
  tolink = tab.url
  // fire getLinkfromDB if tab url contains onlink/*
  if(/onlink\/(.)/gi.test(tolink)) {
    getLinkfromDB(tolink);
  } else {
      console.log("nay");
    }
});
// fetching link and redirect if found
const getLinkfromDB = tolink => {
  // Openning a read only db transaction, ready for fetching data
  let transactionRO = db.transaction(['shortenlink'], 'readonly').objectStore('shortenlink');
  // Fetching original link request
  let linkValueRequest = transactionRO.get(tolink);
  // Fetching original request link successed
  linkValueRequest.onsuccess = () => {
    // saving the link value from the result of transaction
    let linkValue = linkValueRequest.result.link
    // updating tab url by the link value fo DB
    chrome.tabs.update(tabid, {url: linkValue});
  };
  linkValueRequest.onerror = err => console.log(err);
}
/* global OPTION_ACTIVE_LINK */
/* global OPTION_CUSTOM_TAGS */

function saveOptions (e) {

  e.preventDefault();
  browser.storage.sync.set({
    ipActiveLink: document.querySelector("#location-as-link").checked,
    ipCustomTags: document.querySelector("#custom-tags").value
  });

}

function loadOptions () {

  function setOptions(result) {
    document.querySelector("#location-as-link").checked = result.ipActiveLink || false;
    document.querySelector("#custom-tags").value = result.ipCustomTags || '';
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  var load = browser.storage.sync.get([OPTION_ACTIVE_LINK, OPTION_CUSTOM_TAGS]);
  load.then(setOptions, onError);

}

document.addEventListener("DOMContentLoaded", loadOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
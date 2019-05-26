const CONTEXT_MENU_ID = 'ip-img-properties';

browser.menus.create({
  id: CONTEXT_MENU_ID,
  title: browser.i18n.getMessage('ContextMenuItem'),
  contexts: ['image']
});

function OpenImagePropertiesWindow () {

  function loadEXIFData (data) {

    let exifData = JSON.parse(data['ipImageExif']);
    let isEXIFAvailable;
    isEXIFAvailable = (Object.entries(exifData).length === 0 && exifData.constructor === Object) ? false : true;

    let windowHeight = (isEXIFAvailable) ? 620 : 284;

    browser.windows.create({
      url: ['ui/classic.html'],
      height: windowHeight,
      width: 540,
      type: 'popup'
    });

  }

  let exifDataLoad = browser.storage.local.get('ipImageExif');
  exifDataLoad.then(loadEXIFData, onError);

}

browser.menus.onClicked.addListener(contextMenuClick);
browser.menus.onHidden.addListener(contextMenuHide);
browser.runtime.onMessage.addListener(notify);

function contextMenuClick(info, tab) {
  if (info.menuItemId === CONTEXT_MENU_ID) {
    if (info.mediaType !== 'image')
      return;
    try {
      messageContentScript(info, tab);
    }
    catch (error) {
      onError(error);
    }
  }
}

function contextMenuHide() {
  browser.tabs.query({active: true})
  .then (
    function(tabs) {
      browser.tabs.sendMessage(tabs[0].id, 'MenuHidden');
    }
  );
}

function notify(message) {
  if (message == 'ImgDataFinished') {
    OpenImagePropertiesWindow();
  }
}

function messageContentScript(info, tab) {
  browser.tabs.sendMessage(tab.id, 'ImgPropertiesClicked').catch(onError);
}

function onError(error) {
  console.error('ImageProperties Background Error: ' + error.message);
}
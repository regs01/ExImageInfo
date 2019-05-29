/* global ImgData */
/* global EXIF */

var elementGlobal;

document.addEventListener('contextmenu', contextMenuOpened, true);
browser.runtime.onMessage.addListener(notify);

function contextMenuOpened(event) {
  elementGlobal = event.target;
}

function notify(request) {
  if (request === 'ImgPropertiesClicked')
    retrieveImageData();
  if (request === 'MenuHidden')
    clean();
}

function retrieveImageData() {

  let element = elementGlobal;

  if (element === undefined)
    return false;

  try {

    let scaleRatio = window.devicePixelRatio;
    let imgData = new ImgData(element, scaleRatio);
    imgData.retrieveData()
    .then ((properties) => {
      EXIF.getData(element, function() {
        let exifTags = EXIF.getAllTags(this);
        let iptcTags = EXIF.getAllIptcTags(this);
        browser.storage.local.set({
          'ipImageProperties': properties,
          'ipImageEXIF': JSON.stringify(exifTags),
          'ipImageIPTC': JSON.stringify(iptcTags)
        })
        .then(() => {
          browser.runtime.sendMessage('ImgDataFinished');
        });
      })
    })

  }
  catch (error) {
    console.error('ImageProperties Error: ' + error.message);
  }

}

function clean() {
  elementGlobal = undefined;
}
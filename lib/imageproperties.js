/* global isValidNumber */
/* exported ImgData */
class ImgData {

  constructor(imgElement, scaleRatio) {

    if (!(imgElement instanceof HTMLImageElement))
      throw Error('Not an Image element.');
    if (!imgElement.complete)
      throw Error('Image not loaded.');

    this.img = imgElement;
    this.scale = (isValidNumber(scaleRatio)) ? scaleRatio : 1;
    this.scale = (this.scale === 0) ? 1 : this.scale;

    this.properties = {
      'linkName': '',
      'fileSizeTransfer': -1,
      'fileSizeDecoded': -1,
      'fileType': '',
      'fileName': '',
      'resolutionNative': {
        'height': -1,
        'width': -1
      },
      'resolutionScaled': {
        'height': -1,
        'width': -1
      },
      'isScaled': false,
      'aspectRatio': ''
    };

  }

  getLinkName() {
    return this.img.src;
  }

  getNativeResolution() {
    return {
      height: this.img.naturalHeight,
      width: this.img.naturalWidth
    };
  }

  getScaledResolution() {
    return {
      height: Math.ceil(this.img.height * this.scale),
      width: Math.ceil(this.img.width * this.scale)
    };
  }

  isScaled() {
    if ((this.getNativeResolution().height === this.getScaledResolution().height) &&
      (this.getNativeResolution().width === this.getScaledResolution().width))
      return false;
    else
      return true;
  }

  getAspectRatio() {
    let maxSide = Math.max(this.getNativeResolution().width, this.getNativeResolution().height);
    let minSide = Math.min(this.getNativeResolution().width, this.getNativeResolution().height);
    switch (maxSide / minSide) {
      case 1 / 1: return '1/1';
      case 2 / 1: return '2/1';
      case 3 / 2: return '3/2';
      case 4 / 3: return '4/3';
      case 5 / 4: return '5/4';
      case 16 / 9: return '16/9';
      case 16 / 10: return '16/10';
      case 18 / 9: return '18/9';
      case 21 / 9: return '21/9';
      default: return '';
    }
  }

  getCachedFileSizeInt() {
    let fileData = performance.getEntriesByName(this.img.src)[0];
    if (fileData !== undefined)
      return fileData.decodedBodySize;
    else
      return -1;
  }

  async retrieveData() {
    this.properties.linkName = this.getLinkName();
    this.properties.resolutionNative = this.getNativeResolution();
    this.properties.resolutionScaled = this.getScaledResolution();
    this.properties.isScaled = this.isScaled();
    this.properties.aspectRatio = this.getAspectRatio();
    this.properties.fileSizeDecoded = this.getCachedFileSizeInt();
    await this.retrieveHeaders();
    return this.properties;
  }

  async retrieveHeaders() {

    function getFileName(headerString) {

      let fileName = '';

      function getFileNameValue () {

        let fileNameValue = '';

        let reFileName = /filename[\s\n]*=((['"]).*?\2|[^;\n]*)/;
        let reMatch = reFileName.exec(headerString);

        if (reMatch != null && reMatch[1])
          fileNameValue = reMatch[1].replace(/['"]/g, '');

        return fileNameValue;

      }

      function getFileNameValueEx () {

        let fileNameValue = '';

        let reFileNameEx = /filename\*[\s\n]*=((['"]).*?\2|[^;\n]*)/;
        let reMatchEx = reFileNameEx.exec(headerString);

        if (reMatchEx != null && reMatchEx[1]) {

          let rsFileNameEx = reMatchEx[1];

          if (typeof rsFileNameEx === 'string') {

            let rsFileNameParts = rsFileNameEx.split("'");

            if (Array.isArray(rsFileNameParts) && rsFileNameParts.length === 3) {
              let encoding = rsFileNameParts[0].trim();
              let fileNameEncoded = rsFileNameParts[2].trim();
              if (encoding === 'UTF-8')
                fileNameValue = decodeURIComponent(fileNameEncoded);
            }

          }

        }

        return fileNameValue;

      }

      fileName = getFileNameValueEx();

      if ( fileName === '')
        fileName = getFileNameValue();

      return fileName;

    }

    function checkStatus(response) {
      if (!response.ok)
        throw Error(response.status + ': ' + response.statusText);
      return response;
    }
    function getHeaderData(response) {
      (response.headers.has('content-length')) && (this.properties.fileSizeTransfer = response.headers.get('content-length'));
      (response.headers.has('content-type')) && (this.properties.fileType = response.headers.get('content-type'));
      (response.headers.has('content-disposition')) && (this.properties.fileName = getFileName(response.headers.get('content-disposition')));
    }
    function logError(error) {
      console.error('ImageProperties Error:' + error.message);
    }

    return await fetch(this.img.src, { method: 'HEAD' })
      .then(checkStatus)
      .then(getHeaderData.bind(this))
      .catch(logError);

  }

}
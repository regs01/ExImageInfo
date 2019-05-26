/* global Localize */
/* global ExifFunctions */
/* global isValidNumber */
/* global CONTENT_SPACE */
/* global STORAGE_NAME_IMGDATA */
/* global STORAGE_NAME_EXIFDATA */

const _Msg = browser.i18n.getMessage;

const CellContentType = {
  TEXT: 1,
  OBJECT: 2,
  LINE_BREAK: 3
}

window.onload = onLoad;

function onLoad() {

  window.addEventListener('click', onClick);

  let imgDataLoad = browser.storage.local.get(STORAGE_NAME_IMGDATA);
  imgDataLoad.then(onGetImageProperties, (error) => {onStorageError(error, STORAGE_NAME_IMGDATA)});
  let exifDataLoad = browser.storage.local.get(STORAGE_NAME_EXIFDATA);
  exifDataLoad.then(onGetImageExif, (error) => {onStorageError(error, STORAGE_NAME_EXIFDATA)});

}

function onClick (event) {

  if (event.target.href !== undefined) {

    switch (event.target.id) {
      case 'link-map': {
        event.preventDefault();
        browser.tabs.create( { active: true, url: event.target.href });
        break;
      }
      case 'link-expand': {
        event.preventDefault();
        let div = document.getElementById('exifsource').closest('div.collapsible');
        div.classList.toggle('collapsed');
        break;
      }
    }

  }

}

function onStorageError(error, storageName) {
  console.error(error);
  browser.storage.local.remove(storageName);
}

function onGetImageProperties(data) {

  const imgTag = 'imagedata';
  let cell;

  try {

    let imageData = data[STORAGE_NAME_IMGDATA];

    //
    // Link name
    if (imageData.linkName !== '')
      tableAddRow(imgTag, {desc: _Msg('LocationLabel'), value: imageData.linkName, title: imageData.linkName, classes: ['nowrap']});

    //
    // File name
    if (imageData.fileName !== '')
      tableAddRow(imgTag, {desc: _Msg('FileNameLabel'), value: imageData.fileName});

    //
    // File type
    if (imageData.fileType !== '')
      tableAddRow(imgTag, {desc: _Msg('FileTypeLabel'), value: imageData.fileType});

    //
    // Resolution
    let resWidth = imageData.resolutionNative.width;
    let resHeight = imageData.resolutionNative.height;
    let resSum = resWidth * resHeight;

    let pixelPluralSum = Localize.getRangeForPluralForm('pixelType', resWidth, resHeight, resSum);
    let pixelsMsg = Localize.getPluralForm('Resolution_pixels', pixelPluralSum);
    let resolutionMsg = _Msg('ResolutionNatural', [resWidth, resHeight, pixelsMsg]);

    cell = tableAddRow(imgTag, {desc: _Msg('ResolutionLabel'), value: resolutionMsg});

    let ratio = imageData.aspectRatio;

    let isSIPixelVisible, isAspectRatioVisible;
    isSIPixelVisible = isAspectRatioVisible = false;
    let resSIString, imgDimensionMsg;

    if (resSum > 512*512) {
      isSIPixelVisible = true;
      resSIString = Localize.getPixelsSIForm(resSum);
    }

    if (ratio !== '')
      isAspectRatioVisible = true;

    if (isSIPixelVisible && isAspectRatioVisible)
      imgDimensionMsg = _Msg('SIPixelsAndRatio', [resSIString, ratio]);
    if (isSIPixelVisible && !isAspectRatioVisible)
      imgDimensionMsg = _Msg('SIPixelsOnly', [resSIString]);
    if (!isSIPixelVisible && isAspectRatioVisible)
      imgDimensionMsg = _Msg('AspectRatioOnly', [ratio]);

    if (isSIPixelVisible || isAspectRatioVisible) {
      tableEditCell(cell, {value: `${CONTENT_SPACE}${imgDimensionMsg}`});
    }

    if (imageData.isScaled === true) {

      resWidth = imageData.resolutionScaled.width;
      resHeight = imageData.resolutionScaled.height;
      resSum = resWidth * resHeight;

      pixelPluralSum = Localize.getRangeForPluralForm('pixelType', resWidth, resHeight, resSum);
      pixelsMsg = Localize.getPluralForm('Resolution_pixels', pixelPluralSum);
      resolutionMsg = _Msg('ResolutionScaled', [resWidth, resHeight, pixelsMsg]);

      tableEditCell(cell, {contentType: CellContentType.LINE_BREAK});
      tableEditCell(cell, {value: resolutionMsg});

    }

    //
    // File size
    let isFileSize = false;

    if (imageData.fileSizeDecoded > -1)
      isFileSize = true;

    let fileSize;
    if (isFileSize === true)
      fileSize = imageData.fileSizeDecoded
    else
      fileSize = imageData.fileSizeTransfer;

    let fileSizeMsg = Localize.getTypicalPluralString(fileSize, 'FileSize_bytes', 'FileSize', true);
    cell = tableAddRow(imgTag, {desc: _Msg('FileSizeLabel'), value: fileSizeMsg});

    if (fileSize > 750) {
      let fsSIString = Localize.getBytesSIForm(fileSize);
      tableEditCell(cell, {value: `${CONTENT_SPACE}${fsSIString}`});
    }

    if (isFileSize === false) {
      let fileSizeNA = '<p class="information">' + _Msg('FileSizeContentCaution') + '</p>';
      tableEditCell(cell, {contentType: CellContentType.LINE_BREAK});
      tableEditCell(cell, {value: fileSizeNA});
    }

  }
  catch (error) {
    let errorMsg;
    errorMsg = _Msg('ErrorImgData', [error.message]);
    tableAddRow(imgTag, {value: errorMsg, singleRow: true});
  }
  finally {
    browser.storage.local.remove(STORAGE_NAME_IMGDATA);
  }

}

function onGetImageExif(data) {

  let exifTag = 'exifdata';
  let cell;

  try {

    let exifData = JSON.parse(data[STORAGE_NAME_EXIFDATA]);
    if (Object.entries(exifData).length === 0 && exifData.constructor === Object)
      throw Error('NoEXIF');


    //
    // Manufacturer, Model and Lens
    ('Make' in exifData) && tableAddRow(exifTag, {desc: _Msg('MakeLabel'), value: exifData.Make});
    ('Model' in exifData) && tableAddRow(exifTag, {desc: _Msg('ModelLabel'), value: exifData.Model});
    ('LensModel' in exifData) && tableAddRow(exifTag, {desc: _Msg('LensLabel'), value: exifData.LensModel});


    //
    // Aperture
    let aperture;
    if ( ('FNumber' in exifData) && isValidNumber(exifData.FNumber) )
      aperture = exifData.FNumber
    else if ( ('ApertureValue' in exifData) && isValidNumber(exifData.ApertureValue) )
      aperture = Math.pow(2, exifData.ApertureValue/2).toFixed(1)
    else
      aperture = undefined;

    if (aperture !== undefined) {
      let apertureMsg = _Msg('Aperture', [aperture]);
      tableAddRow(exifTag, {desc: _Msg('ApertureLabel'), value: apertureMsg});
    }


    //
    // Exposure Time
    let expTime;
    if ( ('ExposureTime' in exifData) && isValidNumber(exifData.ExposureTime) )
      expTime = exifData.ExposureTime
    else if ( ('ShutterSpeedValue' in exifData) && isValidNumber(exifData.ShutterSpeedValue) )
      expTime = Math.pow(2, -exifData.ShutterSpeedValue)
    else
      expTime = undefined;

    if (expTime !== undefined) {

      let expTimeOrder = -Math.round(Math.log10(expTime));
      expTimeOrder = Math.min (10, Math.max( expTimeOrder, 6));
      expTimeOrder = expTime < 1 ? Math.max(5, expTimeOrder) : 2;
      let expTimeRounded = expTime.toFixed(expTimeOrder);

      let expTimeMsg = Localize.getTypicalPluralString(expTimeRounded, 'ExposureTime_seconds', 'ExposureTime',
                          true, {'minimumFractionDigits': 0, 'maximumFractionDigits': expTimeOrder});
      let expTimeAltMsg = Localize.getTypicalPluralString(expTime, 'ExposureTime_seconds', 'ExposureTime',
                            true, {'minimumFractionDigits': 0, 'maximumFractionDigits': 20});

      cell = tableAddRow(exifTag, {desc: _Msg('ExposureTimeLabel'), value: expTimeMsg, title: expTimeAltMsg});

      if (expTime <= 0.5 && expTime > 0) {
        let expTimeFractional = Math.round(1/expTime).toFixed(0);
        let expTimeFracMsg = _Msg('ExposureTimeFraction', [expTimeFractional]);
        tableEditCell(cell, {value: `${CONTENT_SPACE}${expTimeFracMsg}`});
      }

    }


    //
    // ISO
    if ('ISOSpeedRatings' in exifData)
      tableAddRow(exifTag, {desc: _Msg('ISOLabel'), value: exifData.ISOSpeedRatings});


    //
    // Focal length
    let isFocalLength35 = false;
    let focalLength;
    cell = undefined;
    if ( ('FocalLength' in exifData) && isValidNumber(exifData.FocalLength) )
      focalLength = exifData.FocalLength
    else if ( ('FocalLengthIn35mmFilm' in exifData) && isValidNumber(exifData.FocalLengthIn35mmFilm) ) {
      focalLength = exifData.FocalLengthIn35mmFilm;
      isFocalLength35 = true;
    }
    else
      focalLength = undefined;

    if (focalLength !== undefined) {
      let focalLengthMsg = Localize.getTypicalPluralString(focalLength, 'FocalLength_millimeters', 'FocalLength', true);
      cell = tableAddRow(exifTag, {desc: _Msg('FocalLengthLabel'), value: focalLengthMsg});

      if (!isFocalLength35 && ( ('FocalLengthIn35mmFilm' in exifData) && isValidNumber(exifData.FocalLengthIn35mmFilm)  )) {
        focalLength = exifData.FocalLengthIn35mmFilm;
        if (focalLength !== 0) {
          let focalLengthMsg = Localize.getTypicalPluralString(focalLength, 'FocalLength_millimeters', 'FocalLength35mmEq', true);
          tableEditCell(cell, {value: `${CONTENT_SPACE}${focalLengthMsg}`});
        }
      }
    }


    //
    // White balance
    if ('WhiteBalance' in exifData)
      tableAddRow(exifTag, {desc: _Msg('WhiteBalanceLabel'), value: ExifFunctions.getLocalizedExifString(exifData.WhiteBalance)});


    //
    // Exposure program
    if ('ExposureProgram' in exifData)
      tableAddRow(exifTag, {desc: _Msg('ExposureProgramLabel'), value: ExifFunctions.getLocalizedExifString(exifData.ExposureProgram)});


    //
    // Metering mode
    if ('MeteringMode' in exifData)
      tableAddRow(exifTag, {desc: _Msg('MeteringModeLabel'), value: ExifFunctions.getLocalizedExifString(exifData.MeteringMode)});


    //
    // Flash
    if ('Flash' in exifData)
      tableAddRow(exifTag, {desc: _Msg('FlashLabel'), value: ExifFunctions.getLocalizedExifString(exifData.Flash)});


    //
    // ExposureBias
    if ( ('ExposureBias' in exifData) && isValidNumber(exifData.ExposureBias) ) {
      let expBiasMsg = ExifFunctions.getEVFraction(exifData.ExposureBias);
      tableAddRow(exifTag, {desc: _Msg('ExposureCompensationLabel'), value: expBiasMsg});
    }


    //
    // Subject distance
    if ('SubjectDistance' in exifData && isValidNumber(exifData.SubjectDistance)) {
      let subjectDistance = exifData.SubjectDistance;
      let subjectDistanceMsg = Localize.getTypicalPluralString(subjectDistance, 'SubjectDistance_meters', 'SubjectDistance', true);
      tableAddRow(exifTag, {desc: _Msg('SubjectDistanceLabel'), value: subjectDistanceMsg});
    }


    //
    // Date
    if ('DateTimeOriginal' in exifData) {
      tableAddRow(exifTag, {desc: _Msg('DateLabel'), value: ExifFunctions.formatExifDate(exifData.DateTimeOriginal)});
    }


    //
    // GPS
    if ('GPSLatitudeRef', 'GPSLongitudeRef', 'GPSLatitude', 'GPSLongitude' in exifData) {

      let lat = exifData.GPSLatitude;
      let latRef = exifData.GPSLatitudeRef;
      let lon = exifData.GPSLongitude;
      let lonRef = exifData.GPSLongitudeRef;
      let coordinates = {lat, latRef, lon, lonRef};

      let location = ExifFunctions.getMapServiceParamString('', coordinates);
      if (location !== undefined) {
        cell = tableAddRow(exifTag, {desc: _Msg('GPSLabel'), value: location});
        tableEditCell(cell, {contentType: CellContentType.LINE_BREAK});

        let mapURL;
        mapURL = ExifFunctions.getMapServiceURLEx('GoogleMaps', coordinates);
        tableEditCell(cell, {value: mapURL, contentType: CellContentType.OBJECT});
        mapURL = ExifFunctions.getMapServiceURLEx('YandexMaps', coordinates);
        tableEditCell(cell, {value: mapURL, contentType: CellContentType.OBJECT});
        mapURL = ExifFunctions.getMapServiceURLEx('OSM', coordinates, {encodeURI: false});
        tableEditCell(cell, {value: mapURL, contentType: CellContentType.OBJECT});
        mapURL = ExifFunctions.getMapServiceURLEx('GeoHack', coordinates);
        tableEditCell(cell, {value: mapURL, contentType: CellContentType.OBJECT});
      }

    }


    //
    // Decode User Comment
    if ('UserComment' in exifData) {
      exifData.UserComment = ExifFunctions.decodeExifUserComment(exifData.UserComment);
    }

    makeExpandExifLink(exifTag);

    exifTag = 'exifsource';
    for (let item in exifData) {
      if (exifData.hasOwnProperty(item)) {
        // if (typeof exifData[item] !== 'object')
          tableAddRow(exifTag, {desc: item, value: exifData[item]});
      }
    }

  }
  catch (error) {
    let errorMsg = (error.message === 'NoEXIF') ? 'NoEXIF' : 'ErrorEXIFData';
    (errorMsg === 'ErrorEXIFData') && (console.error(error));
    errorMsg = _Msg(errorMsg, [error.message]);
    tableAddRow(exifTag, {value: errorMsg, singleRow: true});
  }
  finally {
    browser.storage.local.remove(STORAGE_NAME_EXIFDATA);
  }

}

function makeExpandExifLink (placeTag) {

  let linkExifElement;
  linkExifElement = document.createElement('a');
  linkExifElement.id = 'link-expand';
  linkExifElement.href = '#';
  linkExifElement.textContent = _Msg('EXIFSourceLabel')

  tableAddRow(placeTag, {value: linkExifElement, section: 'tfoot', singleRow: true, contentType: CellContentType.OBJECT});

}

function tableAddRow (tableId,
  {desc = '', value = '', title = '', section = 'tbody', singleRow = false,
  contentType = CellContentType.TEXT, classes = []} = {})
{

  let table = document.getElementById(tableId).getElementsByTagName(section)[0];
  if (table === undefined)
    return false;

  let row = table.insertRow(-1);
  let cell;

  if (!singleRow) {
    cell = row.insertCell(0);
    tableEditCell (cell, {value: desc});
  }

  cell = row.insertCell(-1);

  if (singleRow)
    cell.colSpan = 2;

  cell.classList.add(...classes);
  (title !== '') && (cell.title = title);
  tableEditCell(cell, {value: value, contentType: contentType});

  return cell;

}

function tableEditCell (cellId,
  {value = '', contentType = CellContentType.TEXT, replace = false} = {}) {

  if (replace === true)
    cellId.innerHTML = '';

  switch (contentType) {
    case CellContentType.TEXT: {
      let element = document.createElement('p');
      element.textContent = value;
      value = element;
      break;
    }
    case CellContentType.LINE_BREAK:
      value = document.createElement('br');
      break;
  }

  if (value instanceof HTMLElement)
    cellId.appendChild(value)
  else
    cellId.textContent += value;

}
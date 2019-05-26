/* global Localize */
/* global isValidNumber */
/* global compareArray */
/* global CONTENT_SPACE */

const LOCATION_TYPE_DEGREE = 0x60;
const LOCATION_TYPE_DECIMAL_MINUTES = 0x61;
const LOCATION_TYPE_DECIMAL = 0x62;

/* exported ExifFunctions */
class ExifFunctions {

  static getLocalizedExifString(string) {
    let substitute;
    substitute = ( (string === 'undefined') || (string === '') ) ? Localize.Msg('unknown') : string;
    return Localize.Msg(string, substitute);
  }

  static getEVFraction(num) {

    let positive = (num > 0) ? '+' : '-';
    positive = `${positive}${CONTENT_SPACE}`;
    (num === 0) && (positive = '');
    num = Math.abs(num);
    let int = Math.trunc(num);
    let dec = num - int;
    function _f(frac) { return frac.toFixed(2); }
    function _fi(frac) {
      frac = Localize.Msg(`EV_${frac}`);
      (int !== 0) && (frac = `${int}${CONTENT_SPACE}${frac}`);
      return Localize.getTypicalPluralString(frac, 'EV', 'ExposureBias', false);
    }
    function _di() {
      return Localize.getTypicalPluralString(num, 'EV', 'ExposureBias', true);
    }
    let frac;
    switch(_f(dec)) {
      case _f(1/2): frac = _fi('1/2'); break;
      case _f(1/3): frac = _fi('1/3'); break;
      case _f(2/3): frac = _fi('2/3'); break;
      case _f(1/4): frac = _fi('1/4'); break;
      case _f(3/4): frac = _fi('3/4'); break;
      case _f(1/5): frac = _fi('1/5'); break;
      case _f(2/5): frac = _fi('2/5'); break;
      case _f(3/5): frac = _fi('3/5'); break;
      case _f(4/5): frac = _fi('4/5'); break;
      default:      frac = _di();
    }
    return `${positive}${frac}`;

  }

  static formatExifDate (date) {

    function replacer(match) {
      return match.replace(/:/g, '-');
    }
    let re = /\d{4}:\d{2}:\d{2}/;
    let dateFormated = date.replace(re, replacer).replace(' ', 'T');

    if ( !isNaN(Date.parse(dateFormated)) )
      return new Date(dateFormated).toLocaleString(Localize.locale)
    else
      return date;

  }

  static checkExifGPSData (deg) {

    if (!Array.isArray(deg))
      return false;

    if (deg.length !== 3)
      return false;

    for (let item of deg) {
      if (!isValidNumber(item))
        return false;
      if (item < 0)
        return false;
    }

    return true;

  }

  static getDecimalNumber (deg) {

    if (!this.checkExifGPSData(deg))
      return NaN;

    return deg[0] + deg[1]/60 + deg[2]/3600;

  }

  static convertExifDMStoDecimal (coordinates) {

    let latDec = this.getDecimalNumber(coordinates.latitude);
    let lonDec = this.getDecimalNumber(coordinates.longitude);

    if (isNaN(latDec))
      return undefined;
    if (isNaN(lonDec))
      return undefined;

    let latRef = coordinates.latitudeRef;
    let lonRef = coordinates.longitudeRef;

    if (latRef === 'S')
      latDec = -latDec;
    if (lonRef === 'W')
      lonDec = -lonDec;

    return {'lat': latDec, 'lon': lonDec};

  }

  static getLocationType (location) {

    if (location[1] === location[2] === 0)
      return LOCATION_TYPE_DECIMAL
    else if (location[1] !== location[2] && location[2] === 0)
      return LOCATION_TYPE_DECIMAL_MINUTES
    else
      return LOCATION_TYPE_DEGREE;

  }

  static getLocationLocalizedString (coordinates, localize = false) {

    function getLocationMsg (type, location) {
      switch (type) {
        case LOCATION_TYPE_DECIMAL:
          return Localize.Msg('LocationStringDecimal', [location[0]]);
        case LOCATION_TYPE_DECIMAL_MINUTES:
          return Localize.Msg('LocationStringDecimalMinutes', [location[0], location[1]]);
        case LOCATION_TYPE_DEGREE:
        default:
          return Localize.Msg('LocationStringDegrees', [location[0], location[1], location[2]]);
      }
    }

    let latType = this.getLocationType (coordinates.latitude);
    let lonType = this.getLocationType (coordinates.longitude);
    let latString = getLocationMsg (latType, coordinates.latitude);
    let lonString = getLocationMsg (lonType, coordinates.longitude);

    let latRef = coordinates.latitudeRef;
    let lonRef = coordinates.longitudeRef;

    let location;

    if (localize) {
      latRef = Localize.Msg(`LocationRef${latRef}`, [latRef]);
      lonRef = Localize.Msg(`LocationRef${lonRef}`, [lonRef]);
      location = Localize.Msg('LocationStringLocalized', [latString, latRef, lonString, lonRef])
    }
    else {
      location = `${latString} ${latRef}, ${lonString} ${lonRef}`;
    }

    return location;

  }

  static getMapServiceParamString (mapService, {lat, latRef, lon, lonRef}) {

    if ( !this.checkExifGPSData(lat) || !this.checkExifGPSData(lon) )
      return undefined;

    let coordinates = {
      "latitude": lat,
      "longitude": lon,
      "latitudeRef": latRef,
      "longitudeRef":lonRef,
      "latitudeDecimal": -1,
      "longitudeDecimal": -1
    }

    let locationDecimal = this.convertExifDMStoDecimal(coordinates);
    if (locationDecimal === undefined)
      return undefined;
    coordinates.latitudeDecimal = locationDecimal.lat;
    coordinates.longitudeDecimal = locationDecimal.lon;

    switch (mapService) {
      case 'OSM':
        return `mlat=${locationDecimal.lat}&mlon=${locationDecimal.lon}`
      case "GeoHack":
        return `${lat[0]}_${lat[1]}_${lat[2]}_${latRef}_${lon[0]}_${lon[1]}_${lon[2]}_${lonRef}`;
      case 'YandexMaps':
      case 'GoogleMaps':
        return this.getLocationLocalizedString (coordinates);
      default:
        return this.getLocationLocalizedString (coordinates, true);
    }

  }

  static getMapServiceURL (service, coordinates, {encodeURI = true} = {}) {

    let mapURL = this.getMapServiceParamString(service, coordinates);
    if (mapURL === undefined)
      return undefined;

    if (encodeURI)
      mapURL = encodeURIComponent(mapURL);

    return Localize.Msg(`${service}URL`, mapURL);

  }

  static getMapServiceURLEx (service, coordinates, {encodeURI = true} = {}) {

    let mapURL, mapServiceName;

    mapURL = this.getMapServiceParamString(service, coordinates);
    if (mapURL === undefined)
      return undefined;

    if (encodeURI)
      mapURL = encodeURIComponent(mapURL);

    mapURL = Localize.Msg(`${service}URL`, mapURL);
    mapServiceName = Localize.Msg(`${service}Name`);

    let mapLinkElement = document.createElement('a');
    mapLinkElement.id = 'link-map';
    mapLinkElement.href = mapURL;
    mapLinkElement.classList.add('mapurl');
    mapLinkElement.classList.add(service.toLowerCase());
    mapLinkElement.textContent = mapServiceName;

    return mapLinkElement;

  }

  static decodeExifUserComment (charArray) {

    if (!Array.isArray(charArray))
      return charArray;

    const ASCII_HEADER = [0x41, 0x53, 0x43, 0x49, 0x49, 0x00, 0x00, 0x00];
    const JIS_HEADER = [0x4A, 0x49, 0x53, 0x00, 0x00, 0x00, 0x00, 0x00];
    const UNICODE_HEADER = [0x55, 0x4E, 0x49, 0x43, 0x4F, 0x44, 0x45, 0x00];

    let encoding = 'us-ascii';
    let isWithHeader = true;

    if (charArray.length > 8) {
      let arrayHeader = charArray.slice(0, 8);
      if ( compareArray (arrayHeader, ASCII_HEADER) )
        encoding = 'us-ascii'
      else if ( compareArray (arrayHeader, JIS_HEADER) )
        encoding = 'EUC-JP'
      else if ( compareArray (arrayHeader, UNICODE_HEADER) )
        encoding = 'utf-8'
      else
        isWithHeader = false;
    }
    else
      isWithHeader = false;

    let n = (isWithHeader) ? 8 : 0;
    let arrayBody = new Uint8Array(charArray.slice(n, charArray.length));
    let decoder = new TextDecoder(encoding);
    let string = decoder.decode(arrayBody);

    return string;

  }

}
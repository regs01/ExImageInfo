/* exported Localize */
class Localize {

  static Msg(message, substitutions = []) {
    return browser.i18n.getMessage(message, substitutions);
  }

  static get locale () {
    // Reading locale from locale itself, as i18n does not support ability to retrieve currently active locale
    return this.Msg('locale');
  }

  static getRangeForPluralForm(message, first, second, total) {

    let rangeMsg = this.Msg(message);
    switch (rangeMsg) {
      case 'sum':
      case 'total':
        return total;
      case 'width':
      case 'first':
      case 'horizontal':
        return first;
      case 'height':
      case 'vertical':
      case 'second':
      case '':
      default:
        return second;
    }

  }

  static getPluralForm(prefix, number) {
    let pluralRule = new Intl.PluralRules(this.locale).select(number);
    let pluralizedString = this.Msg(`${prefix}_${pluralRule}`);
    return pluralizedString;
  }

  static getTypicalPluralString(num, unitName, fullStringName, localize = false, localizationOptions = {}) {
    let unitNameMsg = this.getPluralForm(unitName, num);
    if (localize) { num = Number(num).toLocaleString(this.locale, localizationOptions) }
    return this.Msg(fullStringName, [num, unitNameMsg]);
  }

  static getBytesSIForm(bytes) {

    let  B = this.Msg('B');
    let kB = this.Msg('kB');
    let MB = this.Msg('MB');
    let GB = this.Msg('GB');
    let TB = this.Msg('TB');
    let PB = this.Msg('PB');
    let bytesSIUnits = [B, kB, MB, GB, TB, PB];

    // Limiting to 15(/3=5) orders, i.e. petabytes
    let order = Math.trunc ( Math.min ((Math.log2(bytes)/10).toFixed(2), 5) );
    let bytesSIUnit = bytesSIUnits[order];
    bytes = (bytes / Math.pow(1024, order))
      .toLocaleString(this.locale, { maximumFractionDigits: 2 });

    return this.Msg('SIBytes', [bytes, bytesSIUnit]);

  }

  static getPixelsSIForm(pixelSum) {

    let  p = this.Msg('px');
    let kp = this.Msg('kp');
    let Mp = this.Msg('Mp');
    let Gp = this.Msg('Gp');
    let Tp = this.Msg('Tp');
    let pixelSIUnits = [p, kp, Mp, Gp, Tp];

    // Limiting to 12 orders, i.e. terapixels
    let order = Math.trunc ( Math.min(Math.log10(pixelSum).toFixed(2), 12) / 3 );
    let pixelSIUnit = pixelSIUnits[order];
    pixelSum = (pixelSum / Math.pow(10, order * 3))
      .toLocaleString(this.locale, { maximumFractionDigits: 2 });

    return this.Msg('SIPixels', [pixelSum, pixelSIUnit]);

  }

}
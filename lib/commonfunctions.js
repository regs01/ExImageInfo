/* exported CONTENT_SPACE */
/* exported STORAGE_NAME_IMGDATA */
/* exported STORAGE_NAME_EXIFDATA */
/* exported STORAGE_NAME_IPTCDATA */
/* exported OPTION_ACTIVE_LINK */
/* exported OPTION_CUSTOM_TAGS */
const CONTENT_SPACE = '\xA0';
const STORAGE_NAME_IMGDATA = 'ipImageProperties';
const STORAGE_NAME_EXIFDATA = 'ipImageEXIF';
const STORAGE_NAME_IPTCDATA = 'ipImageIPTC';
const OPTION_ACTIVE_LINK = 'ipActiveLink';
const OPTION_CUSTOM_TAGS = 'ipCustomTags';

/* exported isValidNumber */
function isValidNumber(num) {
  const validation = !isNaN(num) && isFinite(num) && Number(num) == num;
  return validation ? true : false;
}

/* exported compareArray */
function compareArray(array1, array2){

  if (!Array.isArray(array1))
    return false;
  if (!Array.isArray(array2))
    return false;

  if (array1.length !== array2.length)
    return false;

  for (let i = 0; i < array1.length; i++) {
    if (Array.isArray(array1[i]))
      return false;
    if (Array.isArray(array2[i]))
      return false;

    if (array1[i] !== array2[i])
      return false;
  }

  return true;

}
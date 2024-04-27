function flattenKeys(obj: any) {
  let keys: string[][] = [];

  function flatten(obj: any, parentKey: string = '') {
    for (const key in obj) {
      const currentKey = parentKey ? `${parentKey}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        flatten(obj[key], currentKey);
      } else {
        keys.push(currentKey.split('.'));
      }
    }
  }

  flatten(obj);
  return keys;
}

export default flattenKeys;

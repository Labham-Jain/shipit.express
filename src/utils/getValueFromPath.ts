function getValueFromPath(obj: any, path: any) {
  let value = obj;
  for (const key of path) {
    value = value[key];
    if (!value) return undefined; // If any key doesn't exist, return undefined
    if(value.command) {
      return value
    }
  }
  return value;
}

export default getValueFromPath
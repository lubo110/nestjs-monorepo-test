const toString = Object.prototype.toString
/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 */
export function isObject(obj: any) {
  return Object.is(toString.call(obj), '[object Object]')
}

export function isErrorObj(obj: any) {
  return Object.is(toString.call(obj), '[object Error]')
}

export function isArray(arr: any) {
  return Object.is(toString.call(arr), '[object Array]')
}

export function isRegExp(v: any) {
  return Object.is(toString.call(v), '[object RegExp]')
}

/**
 * Check if value is a valid array index.
 */
export function isValidArrayIndex(val: number) {
  const n = Number.parseFloat(String(val))
  return n >= 0 && Math.floor(n) === n && Number.isFinite(val)
}

export function isString(str: any) {
  return Object.is(toString.call(str), '[object String]')
}

// Check if str is uuid string
export function isUUID(str: string) {
  // eslint-disable-next-line regexp/no-unused-capturing-group
  return /\w{8}(-\w{4}){3}-\w{12}/.test(str)
}

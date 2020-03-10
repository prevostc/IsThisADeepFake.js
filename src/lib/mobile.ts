import * as MobileDetectJs from "mobile-detect"

// some typescript shenanigans, please look away
const MobileDetect: any = MobileDetectJs

const md = new MobileDetect(window.navigator.userAgent)

export function isMobileDevice() {
  return md.mobile() !== null || md.tablet() !== null || md.phone() !== null
}

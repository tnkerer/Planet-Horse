class AnimateElement {
  showElement (
    currentScrollY: number,
    scrollTargetValue: number,
    screenWidthResolution: number
  ): boolean {
    return currentScrollY >= scrollTargetValue || screenWidthResolution <= 810
  }
}

export default AnimateElement

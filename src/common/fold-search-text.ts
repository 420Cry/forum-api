/** Lowercase ASCII fold for typeahead (strips combining marks). */
export function foldSearchText(value: string): string {
  return (
    value
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      // Vietnamese đ does not decompose under NFD.
      .replace(/đ/gi, 'd')
      .toLowerCase()
  )
}

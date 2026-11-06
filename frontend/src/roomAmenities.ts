/** Only equivalent amenity names share a key; never infer equipment from photos or prose. */
const amenityNames: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['air-conditioning', ['Điều hòa', 'Máy lạnh']],
  ['water-heater', ['Bình nóng lạnh', 'Nóng lạnh', 'Bình nước nóng', 'Máy nước nóng']],
  ['refrigerator', ['Tủ lạnh']],
  ['washing-machine', ['Máy giặt']],
  ['balcony', ['Ban công']],
  ['bed-mattress', ['Giường nệm', 'Giường đệm', 'Giường và nệm']],
  ['wardrobe', ['Tủ quần áo']],
  ['private-kitchen', ['Bếp riêng', 'Khu bếp riêng']],
  ['parking', ['Chỗ để xe', 'Chỗ đỗ xe', 'Chỗ gửi xe', 'Bãi để xe', 'Bãi giữ xe']],
]

function normalizedName(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/đ/g, 'd').replace(/\s+/g, ' ').trim()
}

const normalizedNames = amenityNames.map(([key, aliases]) => [key, aliases.map(normalizedName)] as const)

export function amenityKey(value: string): string {
  const name = normalizedName(value)
  for (const [key, aliases] of normalizedNames) {
    if (aliases.some((alias) => name === alias || name.startsWith(`${alias} `))) return key
  }
  return name
}

export function hasAllAmenities(available: readonly string[] | null | undefined, selected: readonly string[]): boolean {
  const keys = new Set((available ?? []).map(amenityKey))
  return selected.every((value) => keys.has(amenityKey(value)))
}

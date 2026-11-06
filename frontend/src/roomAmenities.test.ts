import { describe, expect, it } from 'vitest'
import { amenityKey, hasAllAmenities } from './roomAmenities'

describe('public room amenity matching', () => {
  it('matches both Vietnamese accent placements and decomposed Unicode', () => {
    expect(hasAllAmenities(['Điều hòa'], ['Điều hoà'])).toBe(true)
    expect(hasAllAmenities(['  ĐIỀU HÒA  '.normalize('NFD')], ['Điều hoà'])).toBe(true)
  })
  it('matches equivalent heater, air-conditioning and parking descriptions', () => {
    expect(hasAllAmenities(['nóng lạnh', 'Máy lạnh inverter', 'chỗ để xe'], ['Bình nóng lạnh', 'Điều hoà', 'Chỗ để xe'])).toBe(true)
    expect(amenityKey('Bình nóng lạnh 20 lít')).toBe(amenityKey('Nóng lạnh'))
  })
  it('requires every selected amenity without inventing equipment', () => {
    expect(hasAllAmenities(['Điều hòa', 'Tủ quần áo'], ['Điều hoà', 'Tủ quần áo'])).toBe(true)
    expect(hasAllAmenities(['Điều hòa', 'Tủ quần áo'], ['Điều hoà', 'Tủ lạnh'])).toBe(false)
    expect(hasAllAmenities(['Giường'], ['Giường nệm'])).toBe(false)
    expect(hasAllAmenities(['Bếp chung', 'Không có ban công'], ['Bếp riêng'])).toBe(false)
    expect(hasAllAmenities(['Không có ban công'], ['Ban công'])).toBe(false)
  })
  it('keeps wardrobe and balcony filtering and handles missing amenities', () => {
    expect(hasAllAmenities(['tủ quần áo', 'ban công'], ['Tủ quần áo', 'Ban công'])).toBe(true)
    expect(hasAllAmenities(null, ['Điều hoà'])).toBe(false)
    expect(hasAllAmenities(undefined, [])).toBe(true)
  })
})

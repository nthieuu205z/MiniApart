// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BuildingSection } from './BuildingSection'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

let container: HTMLDivElement
let root: Root

describe('BuildingSection', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  it('FR-BLD-03 keeps rooms in their own grid and stairs in the right-hand track when a floor overflows its columns', async () => {
    await act(async () => {
      root.render(
        <BuildingSection
          columns={3}
          floors={[{
            name: 'T3',
            rooms: [{ room: '301' }, { room: '302' }, { room: '303' }, { room: '304' }],
          }]}
        />,
      )
    })

    const floorSection = container.querySelector('[data-testid="room-floor-section"]') as HTMLElement
    const roomGrid = container.querySelector('[data-testid="room-floor-grid"]') as HTMLElement
    const stairs = floorSection.children[2] as HTMLElement

    expect(floorSection.style.gridTemplateColumns).toBe('34px repeat(3, minmax(0, 1fr)) 30px')
    expect(roomGrid.style.display).toBe('grid')
    expect(roomGrid.style.gridTemplateColumns).toBe('repeat(3, minmax(0, 1fr))')
    expect(roomGrid.style.gridColumn).toBe('2 / -2')
    expect(roomGrid.querySelectorAll('[data-testid="room-tile"]')).toHaveLength(4)
    expect(stairs.style.gridColumn).toBe('-2 / -1')
    expect(stairs).toBe(roomGrid.nextElementSibling)
  })
})

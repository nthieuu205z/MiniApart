export async function nenAnhCongTo(tep: File): Promise<File> {
  const bitmap = await createImageBitmap(tep)
  const canvas = document.createElement('canvas')
  const gioiHanCanh = 1600
  const tyLe = Math.min(1, gioiHanCanh / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * tyLe))
  const height = Math.max(1, Math.round(bitmap.height * tyLe))

  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Không thể nén ảnh công tơ.')
  }

  context.drawImage(bitmap, 0, 0, width, height)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result)
          return
        }
        reject(new Error('Không thể nén ảnh công tơ.'))
      },
      'image/jpeg',
      0.82,
    )
  })

  bitmap.close?.()

  return new File([blob], doiTenTep(tep.name), {
    type: 'image/jpeg',
    lastModified: tep.lastModified,
  })
}

function doiTenTep(tenGoc: string) {
  return tenGoc.replace(/\.[^.]+$/, '') + '.jpg'
}

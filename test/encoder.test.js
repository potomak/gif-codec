import Image from "../src/encoder/image"
import decoder from "../src/decoder"
import encoder from "../src/encoder"
import helpers from "./helpers"

describe("encode", () => {
  test("returns the input image encoded as a GIF (basic image)", () => {
    const image = new Image(3, 3, null, [
      { r: 0, g: 0, b: 0 },
      { r: 0, g: 0, b: 255 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 255, b: 255 },
      { r: 255, g: 0, b: 0 },
      { r: 255, g: 0, b: 255 },
      { r: 255, g: 255, b: 0 },
      { r: 255, g: 255, b: 255 },
      { r: 0, g: 0, b: 0 }
    ])

    const encodedImage = encoder.encode(image)
    const gifContent = decoder.decode(encodedImage)

    expect(gifContent.logicalScreen.logicalScreenDescriptor).toEqual({
      width: 3,
      height: 3,
      globalColorTableFlag: true,
      colorResolution: 8,
      sortFlag: false,
      globalColorTableSize: 8,
      backgroundColorIndex: 0,
      pixelAspectRatio: 0
    })

    expect(gifContent.logicalScreen.globalColorTable).toEqual([
      { r: 0, g: 0, b: 0 },
      { r: 0, g: 0, b: 255 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 255, b: 255 },
      { r: 255, g: 0, b: 0 },
      { r: 255, g: 0, b: 255 },
      { r: 255, g: 255, b: 0 },
      { r: 255, g: 255, b: 255 }
    ])

    expect(gifContent.data[0].type).toEqual("TABLE_BASED_IMAGE")
    expect(gifContent.data[0].data.imageDescriptor).toEqual({
      leftPosition: 0,
      topPosition: 0,
      width: 3,
      height: 3,
      localColorTableFlag: false,
      interlaceFlag: false,
      sortFlag: false,
      localColorTableSize: 2
    })
    expect(gifContent.data[0].data.imageData.data).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 0])
  })

  helpers.repeat(10, () => {
    const width = helpers.randomInt(300) + 1
    const height = helpers.randomInt(300) + 1

    test(`returns the input image encoded as a GIF (random image ${width} by ${height})`, () => {
      const colorTable = []
      for (let i = 0; i < helpers.randomInt(256) + 1; i++) {
        colorTable.push({
          r: helpers.randomInt(256),
          g: helpers.randomInt(256),
          b: helpers.randomInt(256)
        })
      }
      const bitmap = []
      for (let i = 0; i < width * height; i++) {
        bitmap.push(colorTable[helpers.randomInt(colorTable.length)])
      }
      const image = new Image(width, height, null, bitmap)

      const encodedImage = encoder.encode(image)
      const gifContent = decoder.decode(encodedImage)

      expect(gifContent.logicalScreen.logicalScreenDescriptor).toEqual({
        width,
        height,
        globalColorTableFlag: true,
        colorResolution: 8,
        sortFlag: false,
        globalColorTableSize: 1 << Math.max(Math.ceil(Math.log2(colorTable.length)), 1),
        backgroundColorIndex: 0,
        pixelAspectRatio: 0
      })

      colorTable.forEach(color => {
        expect(gifContent.logicalScreen.globalColorTable).toContainEqual(color)
      })

      expect(gifContent.data[0].type).toEqual("TABLE_BASED_IMAGE")
      expect(gifContent.data[0].data.imageDescriptor).toEqual({
        leftPosition: 0,
        topPosition: 0,
        width,
        height,
        localColorTableFlag: false,
        interlaceFlag: false,
        sortFlag: false,
        localColorTableSize: 2
      })
      expect(gifContent.data[0].data.imageData.data).toHaveLength(width * height)
    })
  })
})

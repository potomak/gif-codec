import decoder from "../src/decoder"
import fs from "fs"

describe("decode", () => {
  test("throws an exception if the buffer can't be decoded as a GIF", () => {
    const buffer = new ArrayBuffer()
    const bytes = new Uint8Array(buffer)
    expect(() => decoder.decode(bytes)).toThrow(/signatureNotSupportedError/)
  })

  test("monochromatic GIF", done => {
    fs.readFile("./test/fixtures/w3c_home_2.gif", function (err, buffer) {
      if (err) {
        done(err)
        return
      }

      const bytes = new Uint8Array(buffer)
      const gifContent = decoder.decode(bytes)

      expect(gifContent.header).toEqual({
        signature: "GIF",
        version: "89a"
      })

      expect(gifContent.logicalScreen.logicalScreenDescriptor).toEqual({
        width: 72,
        height: 48,
        globalColorTableFlag: true,
        colorResolution: 1,
        sortFlag: false,
        globalColorTableSize: 2,
        backgroundColorIndex: 0,
        pixelAspectRatio: 0
      })

      expect(gifContent.logicalScreen.globalColorTable).toEqual([
        { r: 0, g: 0, b: 0 },
        { r: 255, g: 255, b: 255 }
      ])

      expect(gifContent.data[0].type).toEqual("GRAPHIC_BLOCK")
      expect(gifContent.data[0].data).toEqual({
        disposalMethod: 0,
        userInputFlag: false,
        transparentColorFlag: false,
        delayTime: 0,
        transparentColorIndex: 0
      })

      expect(gifContent.data[1].type).toEqual("TABLE_BASED_IMAGE")
      expect(gifContent.data[1].data.imageDescriptor).toEqual({
        leftPosition: 0,
        topPosition: 0,
        width: 72,
        height: 48,
        localColorTableFlag: false,
        interlaceFlag: false,
        sortFlag: false,
        localColorTableSize: 2
      })
      expect(gifContent.data[1].data.imageData.data.length).toEqual(72 * 48)

      done()
    });
  })
})

import decoder from "../src/decoder"
import fs from "fs"

describe("decode", () => {
  test("throws an exception if the buffer is empty", () => {
    const buffer = new ArrayBuffer()
    expect(() => decoder.decode(buffer)).toThrow(/Out of bound/)
  })

  test("throws an exception if the buffer can't be decoded as a GIF (wrong signature)", () => {
    const buffer = Buffer.from("FIG", "ascii")
    expect(() => decoder.decode(buffer)).toThrow(/signatureNotSupportedError/)
  })

  test("throws an exception if the buffer can't be decoded as a GIF (wrong version)", () => {
    const buffer = Buffer.from("GIF89b", "ascii")
    expect(() => decoder.decode(buffer)).toThrow(/versionNotSupportedError/)
  })

  test("decodes an empty GIF", () => {
    const header = Buffer.from("GIF89a", "ascii")
    const logicalScreen = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00], "hex")
    const trailer = Buffer.from([0x3B], "hex")
    const buffer = Buffer.concat([header, logicalScreen, trailer])
    const gifContent = decoder.decode(buffer)

    expect(gifContent.header).toEqual({
      signature: "GIF",
      version: "89a"
    })

    expect(gifContent.logicalScreen.logicalScreenDescriptor).toEqual({
      width: 0,
      height: 0,
      globalColorTableFlag: false,
      colorResolution: 1,
      sortFlag: false,
      globalColorTableSize: 2,
      backgroundColorIndex: 0,
      pixelAspectRatio: 0
    })

    expect(gifContent.data).toHaveLength(0)
  })

  test("monochromatic GIF", done => {
    fs.readFile("./test/fixtures/w3c_home_2.gif", function (err, buffer) {
      if (err) {
        done(err)
        return
      }

      const gifContent = decoder.decode(buffer)

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
      expect(gifContent.data[1].data.imageData.data).toHaveLength(72 * 48)

      done()
    })
  })
})

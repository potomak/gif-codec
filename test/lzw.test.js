import helpers from "./helpers"
import lzw from "../src/lzw"

describe("compress", () => {
  test("prepends the code stream with the clear code", () => {
    const buffer = Buffer.from("", "ascii")
    const bytes = new Uint8Array(buffer)
    // Codes: [256, 257]
    // Codes (binary): [100000000, 100000001]
    // Packed: [00000000, 00000011, 00000010]
    expect(lzw.compress(8, bytes)).toEqual([0, 3, 2])
  })

  test("returns the correct code stream", () => {
    const buffer = Buffer.from("TOBEORNOTTOBEORTOBEORNOT", "ascii")
    const bytes = new Uint8Array(buffer)
    // Codes: [256, 84, 79, 66, 69, 79, 82, 78, 79, 84, 258, 260, 262, 267, 261, 263, 265, 257]
    // Codes (binary): [100000000, 001010100, 001001111, 001000010]
    // Packed: [00000000, 10101001, 00111100, 00010001, ...]
    expect(lzw.compress(8, bytes)).toEqual([0, 169, 60, 17, 82, 228, 137, 20, 39, 79, 168, 8, 36, 104, 112, 97, 193, 131, 9, 3, 2])
  })
})

describe("decompress", () => {
  [
    "",
    "TOBEORNOTTOBEORTOBEORNOT",
    "aaaaabbbbb"
  ].forEach(input => {
    test("returns the correct string", () => {
      const buffer = Buffer.from(input, "ascii")
      const bytes = new Uint8Array(buffer)
      const compressed = lzw.compress(8, bytes)
      expect(lzw.decompress(8, compressed)).toEqual(input)
    })
  })

  test("returns the correct ", () => {
    const buffer = Buffer.from([ 8, 33, 67, 101, 7, 36 ])
    const bytes = new Uint8Array(buffer)
    const decompressed = lzw.decompress(3, bytes)
    expect(Buffer.from(decompressed, "ascii")).toEqual(Buffer.from([ 0, 1, 2, 3, 4, 5, 6, 7, 0 ]))
  })
})

describe("compress/decompress behavior", () => {
  helpers.repeat(10, () => {
    const codeSize = helpers.randomInt(7) + 2
    const messageLength = helpers.randomInt(1000) + 1
    const message = []
    for (let i = 0; i < messageLength; i++) {
      message.push(helpers.randomInt(1 << codeSize))
    }

    test(`decompress(compress(M)) is equal to M (code size: ${codeSize})`, () => {
      const buffer = Buffer.from(message)
      const bytes = new Uint8Array(buffer)
      const compressed = lzw.compress(codeSize, bytes)
      const decompressed = lzw.decompress(codeSize, compressed)
      expect(Buffer.from(decompressed, "ascii")).toEqual(buffer)
    })
  })
})

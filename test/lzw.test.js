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
})

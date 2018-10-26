import InputStream from "../src/input_stream"
import OutputStream from "../src/output_stream"
import helpers from "./helpers"

describe("pack", () => {
  test("computes the output stream correctly", () => {
    let outputStream = new OutputStream()
    const codeLength = 8
    outputStream.pack(codeLength, 1)
    expect(outputStream.offset).toEqual(1)
    expect(outputStream.bitOffset).toEqual(0)
    expect(outputStream.output).toEqual([1])
    outputStream.pack(codeLength, 2)
    expect(outputStream.offset).toEqual(2)
    expect(outputStream.bitOffset).toEqual(0)
    expect(outputStream.output).toEqual([1, 2])
    outputStream.pack(codeLength, 3)
    expect(outputStream.offset).toEqual(3)
    expect(outputStream.bitOffset).toEqual(0)
    expect(outputStream.output).toEqual([1, 2, 3])
  })

  test("computes the output stream correctly (code length > 8)", () => {
    let outputStream = new OutputStream()
    const codeLength = 9
    outputStream.pack(codeLength, 256)
    expect(outputStream.offset).toEqual(1)
    expect(outputStream.bitOffset).toEqual(1)
    expect(outputStream.output).toEqual([0, 1])
  })

  test("computes the output stream correctly (code length < 8, progressive values)", () => {
    let outputStream = new OutputStream()
    const codeLength = 4
    outputStream.pack(codeLength, 0)
    expect(outputStream.offset).toEqual(0)
    expect(outputStream.bitOffset).toEqual(4)
    expect(outputStream.output).toEqual([0])
    outputStream.pack(codeLength, 1)
    expect(outputStream.offset).toEqual(1)
    expect(outputStream.bitOffset).toEqual(0)
    expect(outputStream.output).toEqual([16])
    outputStream.pack(codeLength, 2)
    expect(outputStream.offset).toEqual(1)
    expect(outputStream.bitOffset).toEqual(4)
    expect(outputStream.output).toEqual([16, 2])
    outputStream.pack(codeLength, 3)
    expect(outputStream.offset).toEqual(2)
    expect(outputStream.bitOffset).toEqual(0)
    expect(outputStream.output).toEqual([16, 50])
  })

  test("computes the output stream correctly (code length < 8)", () => {
    let outputStream = new OutputStream()
    const codeLength = 4
    outputStream.pack(codeLength, 15)
    expect(outputStream.offset).toEqual(0)
    expect(outputStream.bitOffset).toEqual(4)
    expect(outputStream.output).toEqual([15])
    outputStream.pack(codeLength, 0)
    expect(outputStream.offset).toEqual(1)
    expect(outputStream.bitOffset).toEqual(0)
    expect(outputStream.output).toEqual([15])
    outputStream.pack(codeLength, 15)
    expect(outputStream.offset).toEqual(1)
    expect(outputStream.bitOffset).toEqual(4)
    expect(outputStream.output).toEqual([15, 15])
    outputStream.pack(codeLength, 0)
    expect(outputStream.offset).toEqual(2)
    expect(outputStream.bitOffset).toEqual(0)
    expect(outputStream.output).toEqual([15, 15])
  })

  test("computes the output stream correctly (code length not a power of 2)", () => {
    let outputStream = new OutputStream()
    const codeLength = 5
    outputStream.pack(codeLength, 15)
    expect(outputStream.offset).toEqual(0)
    expect(outputStream.bitOffset).toEqual(5)
    expect(outputStream.output).toEqual([15])
    outputStream.pack(codeLength, 0)
    expect(outputStream.offset).toEqual(1)
    expect(outputStream.bitOffset).toEqual(2)
    expect(outputStream.output).toEqual([15, 0])
    outputStream.pack(codeLength, 15)
    expect(outputStream.offset).toEqual(1)
    expect(outputStream.bitOffset).toEqual(7)
    expect(outputStream.output).toEqual([15, 60])
    outputStream.pack(codeLength, 0)
    expect(outputStream.offset).toEqual(2)
    expect(outputStream.bitOffset).toEqual(4)
    expect(outputStream.output).toEqual([15, 60, 0])
  })

  test("computes the output stream correctly (bit offset not 0)", () => {
    let outputStream = new OutputStream()
    outputStream.bitOffset = 2
    const codeLength = 5
    outputStream.pack(codeLength, 15)
    expect(outputStream.offset).toEqual(0)
    expect(outputStream.bitOffset).toEqual(7)
    expect(outputStream.output).toEqual([60])
    outputStream.pack(codeLength, 0)
    expect(outputStream.offset).toEqual(1)
    expect(outputStream.bitOffset).toEqual(4)
    expect(outputStream.output).toEqual([60, 0])
    outputStream.pack(codeLength, 15)
    expect(outputStream.offset).toEqual(2)
    expect(outputStream.bitOffset).toEqual(1)
    expect(outputStream.output).toEqual([60, 240, 0])
    outputStream.pack(codeLength, 0)
    expect(outputStream.offset).toEqual(2)
    expect(outputStream.bitOffset).toEqual(6)
    expect(outputStream.output).toEqual([60, 240, 0])
  })

  test("computes the output stream correctly (bit offset not 0, non symmetrical values)", () => {
    let outputStream = new OutputStream()
    outputStream.bitOffset = 2
    const codeLength = 5
    outputStream.pack(codeLength, 13)
    expect(outputStream.offset).toEqual(0)
    expect(outputStream.bitOffset).toEqual(7)
    expect(outputStream.output).toEqual([52])
    outputStream.pack(codeLength, 0)
    expect(outputStream.offset).toEqual(1)
    expect(outputStream.bitOffset).toEqual(4)
    expect(outputStream.output).toEqual([52, 0])
    outputStream.pack(codeLength, 13)
    expect(outputStream.offset).toEqual(2)
    expect(outputStream.bitOffset).toEqual(1)
    expect(outputStream.output).toEqual([52, 208, 0])
    outputStream.pack(codeLength, 0)
    expect(outputStream.offset).toEqual(2)
    expect(outputStream.bitOffset).toEqual(6)
    expect(outputStream.output).toEqual([52, 208, 0])
  })
})

describe("pack/unpack behavior", () => {
  helpers.repeat(10, () => {
    const codeLength = helpers.randomInt(11) + 2
    const messageLength = helpers.randomInt(1000) + 1
    const message = []
    for (let i = 0; i < messageLength; i++) {
      message.push(helpers.randomInt(1 << codeLength))
    }

    test("unpack(pack(C)) is equal to C", () => {
      let outputStream = new OutputStream()
      message.forEach(code => outputStream.pack(codeLength, code))

      let inputStream = new InputStream(Buffer.from(outputStream.output, "ascii"))
      message.forEach(code => {
        expect(inputStream.unpack(codeLength)).toEqual(code)
      })
    })
  })
})

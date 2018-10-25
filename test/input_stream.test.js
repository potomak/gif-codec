import InputStream from "../src/input_stream"

describe("unpack", () => {
  test("unpacks the input stream correctly", () => {
    let inputStream = new InputStream([1, 2, 3])
    const codeLength = 8
    expect(inputStream.unpack(codeLength)).toEqual(1)
    expect(inputStream.offset).toEqual(1)
    expect(inputStream.bitOffset).toEqual(0)
    expect(inputStream.unpack(codeLength)).toEqual(2)
    expect(inputStream.offset).toEqual(2)
    expect(inputStream.bitOffset).toEqual(0)
    expect(inputStream.unpack(codeLength)).toEqual(3)
    expect(inputStream.offset).toEqual(3)
    expect(inputStream.bitOffset).toEqual(0)
  })

  test("unpacks the input stream correctly (code length > 8)", () => {
    let inputStream = new InputStream([0, 1])
    const codeLength = 9
    expect(inputStream.unpack(codeLength)).toEqual(256)
    expect(inputStream.offset).toEqual(1)
    expect(inputStream.bitOffset).toEqual(1)
  })

  test("unpacks the input stream correctly (code length > 8, first 2 bytes of message)", () => {
    let inputStream = new InputStream([0, 169, 60, 17])
    const codeLength = 9
    expect(inputStream.unpack(codeLength)).toEqual(256)
    expect(inputStream.offset).toEqual(1)
    expect(inputStream.bitOffset).toEqual(1)
    expect(inputStream.unpack(codeLength)).toEqual(84)
    expect(inputStream.offset).toEqual(2)
    expect(inputStream.bitOffset).toEqual(2)
    expect(inputStream.unpack(codeLength)).toEqual(79)
    expect(inputStream.offset).toEqual(3)
    expect(inputStream.bitOffset).toEqual(3)
  })

  test("unpacks the input stream correctly (code length > 8, empty message)", () => {
    let inputStream = new InputStream([0, 3, 2])
    const codeLength = 9
    expect(inputStream.unpack(codeLength)).toEqual(256)
    expect(inputStream.offset).toEqual(1)
    expect(inputStream.bitOffset).toEqual(1)
    expect(inputStream.unpack(codeLength)).toEqual(257)
    expect(inputStream.offset).toEqual(2)
    expect(inputStream.bitOffset).toEqual(2)
  })

  test("unpacks the input stream correctly (code length < 8)", () => {
    let inputStream = new InputStream([15, 15])
    const codeLength = 4
    expect(inputStream.unpack(codeLength)).toEqual(15)
    expect(inputStream.offset).toEqual(0)
    expect(inputStream.bitOffset).toEqual(4)
    expect(inputStream.unpack(codeLength)).toEqual(0)
    expect(inputStream.offset).toEqual(1)
    expect(inputStream.bitOffset).toEqual(0)
    expect(inputStream.unpack(codeLength)).toEqual(15)
    expect(inputStream.offset).toEqual(1)
    expect(inputStream.bitOffset).toEqual(4)
    expect(inputStream.unpack(codeLength)).toEqual(0)
    expect(inputStream.offset).toEqual(2)
    expect(inputStream.bitOffset).toEqual(0)
  })

  test("unpacks the input stream correctly (code length not a power of 2)", () => {
    let inputStream = new InputStream([15, 60, 0])
    const codeLength = 5
    expect(inputStream.unpack(codeLength)).toEqual(15)
    expect(inputStream.offset).toEqual(0)
    expect(inputStream.bitOffset).toEqual(5)
    expect(inputStream.unpack(codeLength)).toEqual(0)
    expect(inputStream.offset).toEqual(1)
    expect(inputStream.bitOffset).toEqual(2)
    expect(inputStream.unpack(codeLength)).toEqual(15)
    expect(inputStream.offset).toEqual(1)
    expect(inputStream.bitOffset).toEqual(7)
    expect(inputStream.unpack(codeLength)).toEqual(0)
    expect(inputStream.offset).toEqual(2)
    expect(inputStream.bitOffset).toEqual(4)
  })
})

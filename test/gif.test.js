import gif from "../src/gif"

describe("decode", () => {
  test("is defined", () => {
    expect(gif.decode).toBeInstanceOf(Function)
  })
})

describe("encode", () => {
  test("is defined", () => {
    expect(gif.encode).toBeInstanceOf(Function)
  })
})

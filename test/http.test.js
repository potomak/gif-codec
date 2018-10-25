import http from "../src/http"

describe("get", () => {
  test("is defined", () => {
    expect(http.get).toBeInstanceOf(Function)
  })
})

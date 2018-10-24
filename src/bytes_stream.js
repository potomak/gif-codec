function BytesStream (buffer) {
  this.data = new Uint8Array(buffer)
  this.offset = 0
}

BytesStream.prototype.peek = function () {
  return this.data[this.offset]
}

BytesStream.prototype.read = function (size) {
  if (size) {
    if (this.offset + size > this.data.length) {
      throw new Error("Out of bound")
    }
    this.offset += size
    return this.data.slice(this.offset - size, this.offset)
  }

  if (this.offset >= this.data.length) {
    throw new Error("Out of bound")
  }
  return this.data[this.offset++]
}

export default BytesStream

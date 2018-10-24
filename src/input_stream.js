function InputStream (input) {
  this.input = input
  this.offset = 0
  this.bitOffset = 0
}

InputStream.prototype.unpack = function (codeLength) {
  let code = 0
  for (let i = 0; i < codeLength; i++) {
    let bit = this.input[this.offset] & (0x1 << this.bitOffset)
    if (this.bitOffset > i) {
      bit >>= this.bitOffset - i
    } else {
      bit <<= i - this.bitOffset
    }
    code += bit
    this.bitOffset++
    if (this.bitOffset > 7) {
      this.offset++
      this.bitOffset = 0
    }
  }

  return code
}

export default InputStream

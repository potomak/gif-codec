import InputStream from "./input_stream"
import OutputStream from "./output_stream"

const MAX_CODE_VALUE = 4095

const initCompressDictionary = dictSize => {
  let dict = {}
  for (let i = 0; i < dictSize; i++) {
    dict[String.fromCharCode(i)] = i
  }
  return dict
}

const compress = (codeSize, bytes) => {
  let codeLength = codeSize + 1
  let dictSize = (1 << codeSize) + 2
  // Reserved codes:
  // * clear code (CC)
  // * end of information (EOI)
  const clearCode = 1 << codeSize
  const endOfInformation = (1 << codeSize) + 1

  let outputStream = new OutputStream()
  // Start the code stream with the CC
  outputStream.pack(codeLength, clearCode)
  if (bytes.length === 0) {
    outputStream.pack(codeLength, endOfInformation)
    return outputStream.output
  }

  let dict = initCompressDictionary(dictSize)
  let sequence = ""

  for (let i = 0; i < bytes.length; i++) {
    const char = String.fromCharCode(bytes[i])
    const join = sequence + char
    if (dict.hasOwnProperty(join)) {
      sequence = join
      continue
    }
    outputStream.pack(codeLength, dict[sequence])
    dict[join] = dictSize++
    sequence = char
    if (dictSize > MAX_CODE_VALUE) {
      codeLength = codeSize + 1
      dictSize = (1 << codeSize) + 2
      dict = initCompressDictionary(dictSize)
      outputStream.pack(codeLength, clearCode)
    } else if (dictSize >= 1 << codeLength) {
      codeLength++
    }
  }

  outputStream.pack(codeLength, dict[sequence])
  outputStream.pack(codeLength, endOfInformation)

  return outputStream.output
}

const initDecompressDictionary = dictSize => {
  let dict = {}
  for (let i = 0; i < dictSize; i++) {
    dict[i] = String.fromCharCode(i)
  }
  return dict
}

const decompress = (codeSize, bytes) => {
  // Reserved codes:
  // * clear code (CC)
  // * end of information (EOI)
  const clearCode = 1 << codeSize
  const endOfInformation = (1 << codeSize) + 1

  let dict, dictSize, codeLength, sequence, prevSequence
  let inputStream = new InputStream(bytes)
  let output = []
  let code = inputStream.unpack(codeSize + 1)

  while (code != endOfInformation) {
    if (code === clearCode) {
      codeLength = codeSize + 1
      dictSize = (1 << codeSize) + 2
      dict = initDecompressDictionary(dictSize)
      code = inputStream.unpack(codeLength)
      prevSequence = null
      continue
    }

    if (dict.hasOwnProperty(code)) {
      sequence = prevSequence + dict[code][0]
    } else {
      sequence = prevSequence + prevSequence[0]
    }

    if (prevSequence) {
      dict[dictSize++] = sequence
    }
    prevSequence = dict[code]
    output.push(dict[code])

    if (dictSize >= 1 << codeLength) {
      codeLength = Math.min(codeLength + 1, 12)
    }

    code = inputStream.unpack(codeLength)
  }

  return output.join("")
}

export default {
  compress,
  decompress
}

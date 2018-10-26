import constants from "./constants"
import lzw from "./lzw"
import BytesStream from "./bytes_stream"

const decode = buffer => {
  let bytes = new BytesStream(buffer)
  const header = decodeHeader(bytes)
  let logicalScreen = decodeLogicalScreen(bytes)
  let data = []

  while (bytes.peek() !== constants.trailer) {
    data.push(decodeData(bytes))
  }

  return {
    header,
    logicalScreen,
    data
  }
}

const decodeHeader = bytes => {
  const signature = decodeAscii(bytes.read(constants.signatureSize))
  if (signature !== constants.signature) {
    throw new Error(`signatureNotSupportedError: signature: ${signature}`)
  }

  const version = decodeAscii(bytes.read(constants.versionSize))
  if (version !== constants.version) {
    throw new Error(`versionNotSupportedError, version: ${version}`)
  }

  return { signature, version }
}

const decodeAscii = bytes => {
  return String.fromCharCode(...bytes)
}

const decodeLogicalScreen = bytes => {
  let logicalScreenDescriptor = {}
  logicalScreenDescriptor.width = decodeUInt16(bytes)
  logicalScreenDescriptor.height = decodeUInt16(bytes)
  const fields = bytes.read()
  logicalScreenDescriptor.globalColorTableFlag = decodeBool(fields, constants.globalColorTableFlagMask)
  logicalScreenDescriptor.colorResolution = ((fields & constants.colorResolutionMask) >> 4) + 1
  logicalScreenDescriptor.sortFlag = decodeBool(fields, constants.sortFlagMask)
  logicalScreenDescriptor.globalColorTableSize = 1 << ((fields & constants.globalColorTableSizeMask) + 1)
  logicalScreenDescriptor.backgroundColorIndex = bytes.read()
  logicalScreenDescriptor.pixelAspectRatio = bytes.read()

  if (logicalScreenDescriptor.globalColorTableFlag) {
    var colorTable = decodeColorTable(bytes, logicalScreenDescriptor.globalColorTableSize)
  }

  return {
    logicalScreenDescriptor,
    globalColorTable: colorTable
  }
}

const decodeUInt16 = bytes => {
  const low = bytes.read()
  const high = bytes.read() << 8
  return low | high
}

const decodeBool = (byte, mask) => {
  return (byte & mask) > 0
}

const decodeColorTable = (bytes, size) => {
  let colors = []
  let r, g, b
  for (let i = 0; i < size; i++) {
    r = bytes.read()
    g = bytes.read()
    b = bytes.read()
    colors.push({ r, g, b })
  }
  return colors
}

const decodeData = bytes => {
  const introducer = bytes.read()
  switch (introducer) {
  case constants.extensionIntroducer:
    return decodeExtension(bytes)
  case constants.imageSeparator:
    return decodeTableBasedImage(bytes)
  default:
    throw new Error(`blockNotSupportedError, introducer: ${introducer}`)
  }
}

const decodeExtension = bytes => {
  const label = bytes.read()
  switch (label) {
  case constants.graphicControlExtensionLabel:
    return decodeGraphicControlExtension(bytes)
  case constants.applicationExtensionLabel:
    return decodeApplicationExtension(bytes)
  default:
    // TODO: decode comment extension
    throw new Error(`extensionNotSupportedError, label: ${label}`)
  }
}

const decodeGraphicControlExtension = bytes => {
  // Read block size (fixed value: 4)
  bytes.read()

  let graphicControlExtension = {}
  const fields = bytes.read()
  graphicControlExtension.disposalMethod = (fields & constants.disposalMethodMask) >> 2
  graphicControlExtension.userInputFlag = decodeBool(fields, constants.userInputFlagMask)
  graphicControlExtension.transparentColorFlag = decodeBool(fields, constants.transparentColorFlagMask)
  graphicControlExtension.delayTime = decodeUInt16(bytes)
  graphicControlExtension.transparentColorIndex = bytes.read()

  // Read block terminator
  bytes.read()

  return {
    type: "GRAPHIC_BLOCK",
    data: graphicControlExtension
  }
}

const decodeTableBasedImage = bytes => {
  const imageDescriptor = decodeImageDescriptor(bytes)

  if (imageDescriptor.localColorTableFlag) {
    var colorTable = decodeColorTable(bytes, imageDescriptor.localColorTableSize)
  }

  const imageData = decodeImageData(bytes)

  return {
    type: "TABLE_BASED_IMAGE",
    data: {
      imageDescriptor,
      localColorTable: colorTable,
      imageData
    }
  }
}

const decodeImageDescriptor = bytes => {
  let imageDescriptor = {}
  imageDescriptor.leftPosition = decodeUInt16(bytes)
  imageDescriptor.topPosition = decodeUInt16(bytes)
  imageDescriptor.width = decodeUInt16(bytes)
  imageDescriptor.height = decodeUInt16(bytes)
  const fields = bytes.read()
  imageDescriptor.localColorTableFlag = decodeBool(fields, constants.localColorTableFlagMask)
  imageDescriptor.interlaceFlag = decodeBool(fields, constants.interlaceFlagMask)
  imageDescriptor.sortFlag = decodeBool(fields, constants.idSortFlagMask)
  imageDescriptor.localColorTableSize = 1 << ((fields & constants.localColorTableSizeMask) + 1)

  return imageDescriptor
}

const decodeImageData = bytes => {
  const lzwMinimumCodeSize = bytes.read()
  const blocks = decodeDataSubBlocks(bytes)
  const compressedData = concatenate(blocks.map(block => block.data))
  const data = codes(lzw.decompress(lzwMinimumCodeSize, compressedData))

  return {
    lzwMinimumCodeSize,
    blocks,
    data
  }
}

const concatenate = arrays => {
  const length = arrays.reduce((sum, array) => sum + array.length, 0)
  let result = new Uint8Array(length)
  arrays.reduce((offset, array) => {
    result.set(array, offset)
    return offset + array.length
  }, 0)
  return result
}

const codes = string => {
  let result = []
  for (let i = 0; i < string.length; i++) {
    result.push(string.charCodeAt(i))
  }
  return result
}

const decodeDataSubBlocks = bytes => {
  let block = decodeDataSubBlock(bytes)
  let blocks = []
  while (!block.isBlockTerminator) {
    blocks.push(block)
    block = decodeDataSubBlock(bytes)
  }
  return blocks
}

const decodeDataSubBlock = bytes => {
  const size = bytes.read()
  const isBlockTerminator = size === 0
  let data
  if (isBlockTerminator) {
    data = []
  } else {
    data = bytes.read(size)
  }
  return {
    size,
    data,
    isBlockTerminator
  }
}

const decodeApplicationExtension = bytes => {
  // Read block size (fixed value: 11)
  bytes.read()

  const applicationIdentifierData = bytes.read(constants.applicationIdentifierSize)
  const applicationAuthCodeData = bytes.read(constants.applicationAuthCodeSize)
  const applicationIdentifier = decodeAscii(applicationIdentifierData)
  const applicationAuthCode = decodeAscii(applicationAuthCodeData)

  let applicationExtension = {
    applicationIdentifier,
    applicationAuthCode
  }

  if (applicationIdentifier === "NETSCAPE" && applicationAuthCode === "2.0") {
    // Read block size (fixed value: 3)
    bytes.read()
    // Read sub-block id (fixed value: 1)
    bytes.read()

    const loopCount = decodeUInt16(bytes)
    applicationExtension.data = { loopCount }

    // Read block terminator
    bytes.read()
  } else {
    decodeDataSubBlocks(bytes)
    applicationExtension.data = "applicationExtensionNotSupportedError"
  }

  return {
    type: "APPLICATION_EXTENSION",
    data: applicationExtension
  }
}

export default {
  decode
}

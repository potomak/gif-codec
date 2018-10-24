import constants from "./constants"
import lzw from "./lzw"

const decode = bytes => {
  const header = decodeHeader(bytes)
  var { nextOffset, logicalScreen } = decodeLogicalScreen(bytes)
  let offset = nextOffset
  let dataArray = []

  while (bytes[offset] !== constants.trailer) {
    var { nextOffset, data } = decodeData(bytes, offset)
    dataArray.push(data)

    if (nextOffset <= offset) {
      throw new Error("genericError")
    }
    offset = nextOffset
  }

  return {
    header,
    logicalScreen,
    data: dataArray
  }
}

const decodeHeader = bytes => {
  const signature = decodeAscii(bytes.slice(constants.signatureRange[0], constants.signatureRange[0] + constants.signatureRange[1]))
  if (signature !== constants.signature) {
    throw new Error(`signatureNotSupportedError: signature: ${signature}`)
  }

  const version = decodeAscii(bytes.slice(constants.versionRange[0], constants.versionRange[0] + constants.versionRange[1]))
  if (version !== constants.version) {
    throw new Error(`versionNotSupportedError, version: ${version}`)
  }

  return { signature, version }
}

const decodeAscii = bytes => {
  return String.fromCharCode(...bytes)
}

const decodeLogicalScreen = bytes => {
  let logicalScreenDescriptor = {
    width: decodeUInt16(bytes, constants.widthOffset),
    height: decodeUInt16(bytes, constants.heightOffset),
    globalColorTableFlag: decodeBool(bytes, constants.fieldsOffset, constants.globalColorTableFlagMask),
    colorResolution: ((bytes[constants.fieldsOffset] & constants.colorResolutionMask) >> 4) + 1,
    sortFlag: decodeBool(bytes, constants.fieldsOffset, constants.sortFlagMask),
    globalColorTableSize: 1 << ((bytes[constants.fieldsOffset] & constants.globalColorTableSizeMask) + 1),
    backgroundColorIndex: bytes[constants.backgroundColorIndexOffset],
    pixelAspectRatio: bytes[constants.pixelAspectRatioOffset]
  }

  var nextOffset = constants.globalColorTableOffset

  if (logicalScreenDescriptor.globalColorTableFlag) {
    var { nextOffset, colorTable } = decodeColorTable(bytes, nextOffset, logicalScreenDescriptor.globalColorTableSize)
  }

  return {
    nextOffset,
    logicalScreen: {
      logicalScreenDescriptor,
      globalColorTable: colorTable
    }
  }
}

const decodeUInt16 = (bytes, offset) => {
  return bytes[offset] | bytes[offset + 1] << 8
}

const decodeBool = (bytes, offset, mask) => {
  return (bytes[offset] & mask) > 0
}

const decodeColorTable = (bytes, offset, size) => {
  let colorTable = []
  for (let i = 0; i < size; i++) {
    let j = offset + i * 3
    colorTable.push({
      r: bytes[j],
      g: bytes[j + 1],
      b: bytes[j + 2]
    })
  }
  return { nextOffset: offset + size * 3, colorTable }
}

const decodeData = (bytes, offset) => {
  switch (bytes[offset]) {
  case constants.extensionIntroducer:
    if (bytes[offset + 1] === constants.graphicControlExtensionLabel) {
      let graphicControlExtensionOffset = offset + 2
      let graphicControlExtension = decodeGraphicControlExtension(bytes, graphicControlExtensionOffset)
      let graphicControlExtensionSize = constants.transparentColorIndexOffset + 2
      var nextOffset = graphicControlExtensionOffset + graphicControlExtensionSize
      return {
        nextOffset,
        data: {
          type: "GRAPHIC_BLOCK",
          data: graphicControlExtension
        }
      }
    }

    var { nextOffset, specialPurposeBlock } = decodeSpecialPurposeBlock(bytes, offset + 1)
    return {
      nextOffset,
      data: {
        type: "SPECIAL_PURPOSE_BLOCK",
        data: specialPurposeBlock
      }
    }
  case constants.imageDescriptor:
    var { nextOffset, tableBasedImage } = decodeTableBasedImage(bytes, offset + 1)
    return {
      nextOffset,
      data: {
        type: "TABLE_BASED_IMAGE",
        data: tableBasedImage
      }
    }
  default:
    throw new Error(`blockNotSupportedError, introducer: ${bytes[offset]}`)
  }
}

const decodeGraphicControlExtension = (bytes, offset) => {
  return {
    disposalMethod: (bytes[constants.packedFieldsOffset + offset] & constants.disposalMethodMask) >> 2,
    userInputFlag: decodeBool(bytes, constants.packedFieldsOffset + offset, constants.userInputFlagMask),
    transparentColorFlag: decodeBool(bytes, constants.packedFieldsOffset + offset, constants.transparentColorFlagMask),
    delayTime: decodeUInt16(bytes, constants.delayTimeOffset + offset),
    transparentColorIndex: bytes[constants.transparentColorIndexOffset + offset]
  }
}

const decodeTableBasedImage = (bytes, offset) => {
  const imageDescriptor = decodeImageDescriptor(bytes, offset)
  var nextOffset = offset + constants.idFieldsOffset + 1

  if (imageDescriptor.localColorTableFlag) {
    var { nextOffset, colorTable } = decodeColorTable(bytes, nextOffset, imageDescriptor.localColorTableSize)
  }

  var { nextOffset, imageData } = decodeImageData(bytes, nextOffset)

  return {
    nextOffset,
    tableBasedImage: {
      imageDescriptor,
      localColorTable: colorTable,
      imageData
    }
  }
}

const decodeImageDescriptor = (bytes, offset) => {
  return {
    leftPosition: decodeUInt16(bytes, offset + constants.leftPositionOffset),
    topPosition: decodeUInt16(bytes, offset + constants.topPositionOffset),
    width: decodeUInt16(bytes, offset + constants.idWidthOffset),
    height: decodeUInt16(bytes, offset + constants.idHeightOffset),
    localColorTableFlag: decodeBool(bytes, offset + constants.idFieldsOffset, constants.localColorTableFlagMask),
    interlaceFlag: decodeBool(bytes, offset + constants.idFieldsOffset, constants.interlaceFlagMask),
    sortFlag: decodeBool(bytes, offset + constants.idFieldsOffset, constants.idSortFlagMask),
    localColorTableSize: 1 << ((bytes[offset + constants.idFieldsOffset] & constants.localColorTableSizeMask) + 1)
  }
}

const decodeImageData = (bytes, offset) => {
  const lzwMinimumCodeSize = bytes[offset]
  let { nextOffset, blocks } = decodeDataSubBlocks(bytes, offset + 1)
  const compressedData = concatenate(blocks.map(block => block.data))
  const data = codes(lzw.decompress(lzwMinimumCodeSize, compressedData))

  return {
    nextOffset,
    imageData: {
      lzwMinimumCodeSize,
      blocks,
      data
    }
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

const decodeDataSubBlocks = (bytes, offset) => {
  var { nextOffset, block } = decodeDataSubBlock(bytes, offset)
  let blocks = [block]
  while (!block.isBlockTerminator) {
    var { nextOffset, block } = decodeDataSubBlock(bytes, nextOffset)
    blocks.push(block)
  }
  return { nextOffset, blocks }
}

const decodeDataSubBlock = (bytes, offset) => {
  const blockSize = bytes[offset]
  const nextOffset = offset + blockSize + 1
  const block = {
    blockSize,
    data: bytes.slice(offset + 1, offset + 1 + blockSize),
    isBlockTerminator: blockSize === 0
  }
  return { nextOffset, block }
}

const decodeSpecialPurposeBlock = (bytes, offset) => {
  switch (bytes[offset]) {
  case constants.applicationExtensionLabel:
    var { nextOffset, extensionData } = decodeApplicationExtension(bytes, offset + 1)
    return {
      nextOffset,
      specialPurposeBlock: {
        type: "APPLICATION_EXTENSION",
        data: extensionData
      }
    }
  default:
    // TODO: decode comment extension
    throw new Error(`extensionNotSupportedError, label: ${bytes[offset]}`)
  }
}

const decodeApplicationExtension = (bytes, offset) => {
  const applicationIdentifierData = bytes.slice(constants.applicationIdentifierRange[0] + offset, constants.applicationIdentifierRange[0] + offset + constants.applicationIdentifierRange[1])
  const applicationAuthCodeData = bytes.slice(constants.applicationAuthCodeRange[0] + offset, constants.applicationAuthCodeRange[0] + offset + constants.applicationAuthCodeRange[1])
  const applicationIdentifier = decodeAscii(applicationIdentifierData)
  const applicationAuthCode = decodeAscii(applicationAuthCodeData)

  let applicationExtension = {
    applicationIdentifier,
    applicationAuthCode
  }

  if (applicationIdentifier === "NETSCAPE" && applicationAuthCode === "2.0") {
    const loopCount = decodeUInt16(bytes, offset + constants.loopCountOffset)
    applicationExtension.data = { loopCount }
    // Note: 2 bytes (loop count) + 1 byte to skip the block terminator
    var nextOffset = constants.loopCountOffset + offset + 3
  } else {
    var { nextOffset } = decodeDataSubBlocks(bytes, offset + constants.applicationExtensionDataOffset)
    applicationExtension = `applicationExtensionNotSupportedError, identifier: ${applicationIdentifier}, authCode: ${applicationAuthCode}`
  }

  return {
    nextOffset,
    extensionData: applicationExtension
  }
}

const encode = () => {
  console.log("encode")
  return "encode"
}

export default {
  encode,
  decode
}

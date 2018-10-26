import Animation from "./encoder/animation"
import Image from "./encoder/image"
import constants from "./constants"
import lzw from "./lzw"

const MAX_BLOCK_SIZE = 255

const encode = data => {
  if (data instanceof Image) {
    return encodeImage(data)
  } else if (data instanceof Animation) {
    return encodeAnimation(data)
  }

  throw `Type not supported: ${data.constructor.name}`
}

const encodeImage = image => {
  const header = encodeHeader()
  const logicalScreen = encodeLogicalScreen(image)
  const tableBasedImage = encodeTableBasedImage(image)
  const trailer = Buffer.from([constants.trailer])

  return Buffer.concat([header, logicalScreen, tableBasedImage, trailer])
}

const encodeHeader = () => {
  return Buffer.from("GIF89a", "ascii")
}

const encodeLogicalScreen = image => {
  const logicalScreenDescriptor = encodeLogicalScreenDescriptor(image)
  const globalColorTable = encodeColorTable(image)

  return Buffer.concat([logicalScreenDescriptor, globalColorTable])
}

const encodeLogicalScreenDescriptor = image => {
  const width = encodeUInt16(image.width)
  const height = encodeUInt16(image.height)
  const globalColorTableFlag = 1
  const colorResolution = 7
  const sortFlag = 0
  const globalColorTableSize = colorTableSize(image) - 1
  const fields =
    globalColorTableFlag << 7 |
    colorResolution << 4 |
    sortFlag << 3 |
    globalColorTableSize
  const backgroundColorIndex = 0
  const pixelAspectRatio = 0

  return Buffer.from([
    ...width,
    ...height,
    fields,
    backgroundColorIndex,
    pixelAspectRatio
  ])
}

const encodeUInt16 = n => {
  return [n & 0xff, n >> 8]
}

const colorTableSize = image => {
  return Math.max(Math.ceil(Math.log2(image.colorTable.length)), 1)
}

const encodeColorTable = image => {
  let colorTable = []
  let colorTableLength = 1 << colorTableSize(image)
  for (let i = 0; i < colorTableLength; i++) {
    let color = { r: 0, g: 0, b: 0 }
    if (i < image.colorTable.length) {
      color = image.colorTable[i]
    }
    colorTable.push(color.r)
    colorTable.push(color.g)
    colorTable.push(color.b)
  }

  return Buffer.from(colorTable)
}

const encodeTableBasedImage = image => {
  const imageSeparator = Buffer.from([constants.imageSeparator])
  const imageDescriptor = encodeImageDescriptor(image)
  const imageData = encodeImageData(image)

  return Buffer.concat([imageSeparator, imageDescriptor, imageData])
}

const encodeImageDescriptor = image => {
  const leftPosition = encodeUInt16(0)
  const topPosition = encodeUInt16(0)
  const width = encodeUInt16(image.width)
  const height = encodeUInt16(image.height)
  const localColorTableFlag = 0
  const interlaceFlag = 0
  const sortFlag = 0
  const reserved = 0
  const localColorTableSize = 0
  const fields =
    localColorTableFlag << 7 |
    interlaceFlag << 6 |
    sortFlag << 5 |
    reserved << 3 |
    localColorTableSize

  return Buffer.from([
    ...leftPosition,
    ...topPosition,
    ...width,
    ...height,
    fields
  ])
}

const encodeImageData = image => {
  const lzwMinimumCodeSize = Math.max(Math.ceil(Math.log2(image.colorTable.length)), 2)
  const compressedBitmap = lzw.compress(lzwMinimumCodeSize, image.indexedBitmap)
  const blocks = encodeDataSubBlocks(compressedBitmap)

  return Buffer.concat([Buffer.from([lzwMinimumCodeSize]), ...blocks])
}

const encodeDataSubBlocks = data => {
  let blocks = []
  for (let i = 0; i < data.length; i += MAX_BLOCK_SIZE) {
    blocks.push(encodeDataSubBlock(data.slice(i, i + MAX_BLOCK_SIZE)))
  }
  // Encode block terminator
  blocks.push(encodeDataSubBlock([]))
  return blocks
}

const encodeDataSubBlock = data => {
  return Buffer.from([data.length].concat(data))
}

// TODO
const encodeAnimation = animation => {
  return animation
}

export default {
  encode
}

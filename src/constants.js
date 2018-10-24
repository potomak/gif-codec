export default {
  signature: "GIF",
  version: "89a",
  trailer: 0x3B,
  extensionIntroducer: 0x21,
  applicationExtensionLabel: 0xFF,
  graphicControlExtensionLabel: 0xF9,
  imageDescriptor: 0x2C,
  // Header
  signatureRange: [0x0, 3],
  versionRange: [0x3, 3],
  widthOffset: 0x6,
  heightOffset: 0x8,
  fieldsOffset: 0xA,
  backgroundColorIndexOffset: 0xB,
  pixelAspectRatioOffset: 0xC,
  globalColorTableFlagMask: 0b10000000,
  colorResolutionMask: 0b01110000,
  sortFlagMask: 0b00001000,
  globalColorTableSizeMask: 0b00000111,
  // Global color table
  globalColorTableOffset: 0xD,
  // Application extension
  applicationIdentifierRange: [0x1, 8],
  applicationAuthCodeRange: [0x9, 3],
  applicationExtensionDataOffset: 0xC,
  // Netscape application extension
  loopCountOffset: 0xE,
  // Graphic control extension
  packedFieldsOffset: 0x1,
  delayTimeOffset: 0x2,
  transparentColorIndexOffset: 0x4,
  disposalMethodMask: 0b00011100,
  userInputFlagMask: 0b00000010,
  transparentColorFlagMask: 0b00000001,
  // Image descriptor
  leftPositionOffset: 0x0,
  topPositionOffset: 0x2,
  idWidthOffset: 0x4,
  idHeightOffset: 0x6,
  idFieldsOffset: 0x8,
  localColorTableFlagMask: 0b10000000,
  interlaceFlagMask: 0b01000000,
  idSortFlagMask: 0b00100000,
  localColorTableSizeMask: 0b00000111
}

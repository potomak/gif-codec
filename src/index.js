import http from "./http"
import gif from "./gif"

const init = () => {
  let filepath = "/jumping-man.gif"
  // let filepath = "/clarke.gif"
  // let filepath = "/dog.gif"
  // let filepath = "/monster.gif"
  // let filepath = "/monster_small.gif"
  http.get(filepath).then(gif.decode)
    .then(gifContent => {
      let imageElement = document.createElement("div")
      imageElement.style.position = "relative"
      document.body.appendChild(imageElement)

      let framesCount = 0
      for (let i = 0; i < gifContent.data.length; i++) {
        if (gifContent.data[i].type !== "TABLE_BASED_IMAGE") {
          continue
        }
        drawFrame(
          imageElement,
          framesCount++,
          gifContent.logicalScreen.logicalScreenDescriptor.width,
          gifContent.logicalScreen.logicalScreenDescriptor.height,
          composeImageData(
            gifContent.data[i].data.imageData.data,
            gifContent.logicalScreen.globalColorTable
          )
        )
      }

      let id = 0
      setInterval(() => {
        let prev = (id + framesCount - 1) % framesCount
        document.getElementById(`frame-${prev}`).style.display = "none"
        document.getElementById(`frame-${id}`).style.display = "block"
        id = (id + 1) % framesCount
      }, 500)
    })
}

// TODO: move
const composeImageData = (indexData, colorTable) => {
  return indexData.map(index => {
    let color = colorTable[index]
    return [color.r, color.g, color.b]
  })
}

const drawFrame = (imageElement, id, width, height, imageData) => {
  let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  svg.style.position = "absolute"
  svg.style.display = "none"
  svg.id = `frame-${id}`
  svg.setAttribute("shape-rendering", "crispEdges")
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`)
  for (let i = 0; i < imageData.length; i++) {
    svg.appendChild(pixelRect(i % width, Math.floor(i / width), ...imageData[i]))
  }
  imageElement.appendChild(svg)
}

const pixelRect = (x, y, r, g, b) => {
  let rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
  rect.setAttribute("fill", `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`)
  rect.setAttribute("x", x)
  rect.setAttribute("y", y)
  rect.setAttribute("width", 1)
  rect.setAttribute("height", 1)
  return rect
}

document.addEventListener("DOMContentLoaded", init)

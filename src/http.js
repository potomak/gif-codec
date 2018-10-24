const get = url => {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest()
    req.open("GET", url, true)
    req.responseType = "arraybuffer"
    req.onerror = reject

    req.onload = () => {
      const buffer = req.response
      if (buffer) {
        resolve(new Uint8Array(buffer))
      }
    }

    req.send(null)
  })
}

export default {
  get
}

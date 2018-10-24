const get = url => {
  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest()
    req.open("GET", url, true)
    req.responseType = "arraybuffer"
    req.onerror = reject
    req.onload = () => { resolve(req.response) }
    req.send(null)
  })
}

export default {
  get
}

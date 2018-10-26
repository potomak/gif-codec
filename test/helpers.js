const randomInt = (max) => {
  return Math.floor(Math.random() * Math.floor(max))
}

const repeat = (n, f) => {
  for (let i = 0; i < n; i++) {
    f()
  }
}

export default {
  randomInt,
  repeat
}

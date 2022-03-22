export function uint8Arr2HexStr (arr) {
  let str = 'Hex:'
  arr.forEach(ele => {
    str = str + ' ' + (ele < 16 ? '0x0' + ele.toString(16).toUpperCase() : '0x' + ele.toString(16).toUpperCase())
  })
  return str
}

export function hexStr2Uint8Arr (str) {
  console.log(str)
  let hexNums = str.split(' ')
  let realHexNums = []
  let resStr = ''
  hexNums.forEach(ele => {
    if (ele !== '') {
      realHexNums.push(ele.trim())
      resStr += ' ' + ele
    }
  })
  let uint8Arr = new Uint8Array(realHexNums.length)
  for (let i = 0; i < realHexNums.length; i++) {
    const ele = realHexNums[i]
    if (!ele.startsWith('0x')) {
      throw new Error('data not right')
    }
    if (ele.length !== 4) {
      throw new Error('data not right')
    }
    uint8Arr[i] = parseInt(ele, 16)
  }
  return {
    'arr': uint8Arr,
    'str': resStr
  }
}

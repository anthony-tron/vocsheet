function encrypt(str) {
    let newStr = ''
    for (c of str) {
        newStr += String.fromCharCode(c.charCodeAt()-1)
    }
    return newStr
}

function decrypt(str) {
    let newStr = ''
    for (c of str) {
        newStr += String.fromCharCode(c.charCodeAt()+1)
    }
    return newStr
}
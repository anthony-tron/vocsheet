function addRow(caller, element, options) {
    if (caller) caller.removeAttribute('onchange')

    let goodParent = caller
    while (goodParent && !goodParent.classList.contains('extendable')) {
        goodParent = goodParent.parentElement
    }

    // goodParent => the extendable table
    let newRow = document.createElement('div')
    newRow.classList.add('row')

    let newCol = document.createElement('div')
    newCol.classList.add('col', 'input-group')

    let termInput = document.createElement('input')
    termInput.classList.add('form-control')
    termInput.setAttribute('type', 'text')
    termInput.setAttribute('placeholder', 'term')
    if (!options || !options.disableOnChange)
        termInput.setAttribute('onchange', 'addRow(this)')

    let definitionInput = document.createElement('input')
    definitionInput.classList.add('form-control')
    definitionInput.setAttribute('type', 'text')
    definitionInput.setAttribute('placeholder', 'definition')

    if (element) {
        termInput.value = element.term
        definitionInput.value = element.definition
    }

    newCol.append(termInput)
    newCol.append(definitionInput)
    newRow.append(newCol)
    goodParent.append(newRow)
}

function generateLines() {
    let entries = entriesArea.getElementsByTagName('input')
    let lines = []

    let settingsLine = ''

    for (const checkbox of checkboxes) {
        if (checkbox.checked) settingsLine += '1'
        else settingsLine += '0'
    }

    lines.push(settingsLine)
    
    for (let i = 0; i < entries.length; i+=2) {
        if (entries[i].value && entries[i+1].value) {
            let newLine = entries[i].value + ':' + entries[i+1].value
            if (settingsLine[0] == '1')
                newLine = encrypt(newLine)

            lines.push(newLine)
        }
    }

    return lines;
}

function exportToFile() {
    let lines = generateLines()

    download('sheet.txt', lines.join('\n'))
    console.log(lines.join('\n'))
}

function copyToClipboard(id) {
    var copyText = document.getElementById(id);

    copyText.select();
    copyText.setSelectionRange(0, 99999); /*For mobile devices*/

    document.execCommand("copy");
}

function download(filename, content) {

    let file = new Blob([content], {type: 'text/plain'})

    let link = document.createElement('a')
    link.href = window.URL.createObjectURL(file)
    link.download = filename
    link.click()
}

function createURL() {
    urlHolders.linkGame.value = encodeURI(baseURL + 'vocsheet/linkgame.html?' + generateLines().join('|'))
}

function loadDataFromFile(event) {
    const file = event.target.files[0]
    var reader = new FileReader()
    reader.readAsText(file)

    let elements = []

    reader.onload = function(e) {

        const lines = e.target.result.split('\n')

        const isEncrypted = lines[0][0] == '1'

        for (line of lines) {
            if (isEncrypted) line = decrypt(line)
            const info = line.split(':')
            
            if (info[0] && info[1])
                elements.push({term: info[0], definition: info[1]})
        }

        updateHTML(elements, {isEncrypted: isEncrypted, shuffleTerms: lines[0][1] == '1', shuffleDefinitions: lines[0][2] == '1'})
    }
}

function loadDataFromURL(url) {
    if (!url.includes('?')) return

    url = decodeURI(url)

    let content = url.split('?')[1]
    if(!content) return

    let codedElements = content.split('|')

    const settingsLine = codedElements.shift()
    const isEncrypted = settingsLine[0] == '1'
    

    let elements = []

    for (const codedElement of codedElements) {
        let info = codedElement
        if (isEncrypted)
            info = decrypt(info)
        
        console.log(info)

        info = info.split(':')

        elements.push({term: info[0], definition: info[1]})
    }

    updateHTML(elements, {isEncrypted: isEncrypted, shuffleTerms: settingsLine[1] == '1', shuffleDefinitions: settingsLine[2] == '1'})
    //generate(elements, {shuffleTerms: settingsLine[1] == '1', shuffleDefinitions: settingsLine[2] == '1'})
}

function updateHTML(elements, settings) {
    checkboxes[0].checked = settings.isEncrypted
    checkboxes[1].checked = settings.shuffleTerms
    checkboxes[2].checked = settings.shuffleDefinitions

    while(entriesArea.lastChild)
        entriesArea.removeChild(entriesArea.lastChild)
    
    let row
    for (element of elements) {
        row = addRow(entriesArea, element, {disableOnChange: true})
    }
    addRow(entriesArea)
}


let baseURL = 'http://nicolasduflot.com/anthony/'

let entriesArea = document.getElementById('entries')
let checkboxes = [
    document.getElementById('encrypt-checkbox'),
    document.getElementById('shuffle-terms-checkbox'),
    document.getElementById('shuffle-definitions-checkbox')
]

let urlHolders = {
    linkGame: document.getElementById('linkgame-url')
}

let fileSelector = document.getElementById('file-selector').addEventListener('change', loadDataFromFile)

let urlToLoadField = document.getElementById('url-to-load')
let loadUrlButton = document.getElementById('load-url-button').addEventListener('click', function() {
    loadDataFromURL(urlToLoadField.value)
})
const Position = {
    LEFT: 'left',
    RIGHT: 'right'
}

function linkingPoint(htmlElement, position) {
    if (!htmlElement.getBoundingClientRect) return

    let rect = htmlElement.getBoundingClientRect()
    let coords = {}


    coords.y = rect.y + rect.height / 2

    if (position == Position.LEFT)          coords.x = rect.x + 16
    else if (position == Position.RIGHT)    coords.x = rect.x + rect.width - 16
    else return

    return coords
}

function createLink(leftElement, rightElement) {
    coords1 = linkingPoint(leftElement, Position.RIGHT)
    coords2 = linkingPoint(rightElement, Position.LEFT)

    let newLine = document.createElementNS('http://www.w3.org/2000/svg', 'line')
    newLine.setAttribute('stroke', 'black')
    newLine.setAttribute('x1', coords1.x)
    newLine.setAttribute('y1', coords1.y)
    newLine.setAttribute('x2', coords2.x)
    newLine.setAttribute('y2', coords2.y)

    return newLine
}

function redraw() {

    while (lineArea.lastChild)
        lineArea.removeChild(lineArea.lastChild)
    
    lineArea.append(draggableLink)

    while (el = document.getElementsByClassName('linked')[0])
        el.classList.remove('linked')
    
    for (link of links) {
        let newLine = createLink(link.term, link.definition)
        lineArea.appendChild(newLine)

        link.term.classList.add('linked')
        link.definition.classList.add('linked')
    }
}

function areSameLinks(a, b) {
    return (a.term === b.term && a.definition === b.definition)
}

function countSameLinks(array1, array2) {
    let occurences = 0
    for (const link1 of array1) {
        for (const link2 of array2) {
            if (areSameLinks(link1, link2)) {
                ++occurences
                break
            }
        }
    }
    return occurences
}

function handleDraggableLink(event) {
    draggableLink.style.visibility = 'visible'
    updateDraggableLink(linkingPoint(origin, Position.RIGHT), {x: event.clientX, y: event.clientY})
}

function updateDraggableLink(leftCoords, rightCoords) {
    draggableLink.setAttribute('x1', leftCoords.x)
    draggableLink.setAttribute('y1', leftCoords.y)
    draggableLink.setAttribute('x2', rightCoords.x)
    draggableLink.setAttribute('y2', rightCoords.y)
}

function checkAnswers() {
    let score = countSameLinks(links, correctLinks)
    alert.classList = []
    alert.classList.add('alert')

    if (score == correctLinks.length) {
        alert.classList.add('alert-success')
    } else if (score == 0) {
        alert.classList.add('alert-danger')
    } else {
        alert.classList.add('alert-warning')
    }

    alert.style.display = 'block'
    scoreArea.innerHTML = '<strong>Score:</strong> ' + score + '/' + correctLinks.length
}

function clearUp(htmlElement) {
    while (htmlElement.lastChild) {
        htmlElement.removeChild(htmlElement.lastChild)
    }
}

function shuffleList(list) {
    for (let i = list.children.length; i >= 0; --i)
        list.appendChild(list.children[Math.random() * i | 0])
}

function generate(elements, options) {
    // element = {term: ..., definition: ...}
    clearUp(termsList)
    clearUp(definitionsList)

    let id = 1
    for (const element of elements) {
        const answerId = 'r'+id

        let term = document.createElement('li')
        term.setAttribute('ans', answerId)
        term.innerHTML = element.term + '<span class="selectable right dot"></span>'
        termsList.append(term)
        
        let definition = document.createElement('li')
        definition.setAttribute('id', answerId)
        definition.innerHTML = element.definition + '<span class="selectable left dot mr"></span>'
        definitionsList.append(definition)

        ++id
    }

    if (options) {
        if (options.shuffleTerms) shuffleList(termsList)
        if (options.shuffleDefinitions) shuffleList(definitionsList)
    }

    setup()
}

function setup() {
    links = []
    correctLinks = []
    origin = undefined
    
    selectedTerm = undefined
    selectedDefinition = undefined

    for (const term of termsList.children) {
        const closeTerm = term;
    
        term.addEventListener('mousedown', function() {
            selectedTerm = closeTerm
    
            origin = closeTerm
            closeTerm.classList.add('manipulated')
            window.addEventListener('mousemove', handleDraggableLink)
        })
    }
    
    for (const def of definitionsList.children) {
        const closeDef = def;
        def.addEventListener('mouseup', function() {
            selectedDefinition = closeDef
            if(selectedTerm) {
                let newLine = createLink(selectedTerm, selectedDefinition)
                lineArea.append(newLine)
    
                links = links.filter( x => x.definition !== selectedDefinition )
    
                let alreadyKnown = false
                for (link of links) {
                    if (link.term === selectedTerm) {
                        link.definition = selectedDefinition
                        alreadyKnown = true
                        break
                    }
                }
    
                if(!alreadyKnown) {
                    links.push({term: selectedTerm, definition: selectedDefinition})
                }
    
                selectedTerm.classList.remove('manipulated')

                selectedTerm = undefined
                selectedDefinition = undefined
    
                redraw()
            }
        })
    }
    
    for (const li of termsList.children) {
        correctLinks.push({term: li, definition: document.getElementById(li.getAttribute('ans'))})
    }

    alert.style.display = 'none';

    redraw()
}

function readFromFile(event) {
    const file = event.target.files[0]
    var reader = new FileReader()
    reader.readAsText(file)

    let elements = []

    reader.onload = function(e) {

        const lines = e.target.result.split('\n')

        const isEncrypted = lines[0][0] == '1'
        const shuffleTerms = lines[0][1] == '1'
        const shuffleDefinitions = lines[0][2] == '1'

        for (line of lines) {
            if (isEncrypted) line = decrypt(line)
            const info = line.split(':')
            
            if (info[0] && info[1])
                elements.push({term: info[0], definition: info[1]})
        }

        generate(elements, {shuffleTerms: shuffleTerms, shuffleDefinitions: shuffleDefinitions})
    }
}

function shuffle() {
    shuffleList(termsList)
    shuffleList(definitionsList)
    redraw()
}

function readFromURL() {
    let url = window.location.href
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

    generate(elements, {shuffleTerms: settingsLine[1] == '1', shuffleDefinitions: settingsLine[2] == '1'})
}

function drawCorrectLinks() {
    while (lineArea.lastChild)
        lineArea.removeChild(lineArea.lastChild)
    
    lineArea.append(draggableLink)
    
    for (link of correctLinks) {
        let newLine = createLink(link.term, link.definition)
        newLine.setAttribute('stroke', 'green')
        lineArea.appendChild(newLine)
       

        link.term.classList.add('linked')
        link.definition.classList.add('linked')
    }
}

let fileSelector = document.getElementById('file-selector')
fileSelector.addEventListener('change', readFromFile)


let termsList = document.getElementById('terms')
let definitionsList = document.getElementById('definitions')
let lineArea = document.getElementById('line-area')
let alert = document.getElementById('alert')
let scoreArea = document.getElementById('score')
let getAnswerButton = document.getElementById('get-answers-button')
let links = []
let correctLinks = []
let resetAndShuffleButton = document.getElementById('reset-and-shuffle-button')
let resetButton = document.getElementById('reset-button')
let shuffleButton = document.getElementById('shuffle-button')

let draggableLink = document.getElementById('draggable-link')
let origin = undefined

let selectedTerm = undefined
let selectedDefinition = undefined

readFromURL()
setup()

window.addEventListener('resize', redraw)
window.addEventListener('scroll', redraw)
window.addEventListener('mouseup', function() {
    if(selectedTerm) selectedTerm.classList.remove('manipulated')
    draggableLink.style.visibility = 'hidden'
    window.removeEventListener('mousemove', handleDraggableLink)
})

getAnswerButton.addEventListener('click', function(event) {
    links = []
    drawCorrectLinks()
})

resetAndShuffleButton.addEventListener('click', function() {
    shuffle()
    setup()
})

resetButton.addEventListener('click', setup)
shuffleButton.addEventListener('click', shuffle)
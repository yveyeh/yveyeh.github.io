const container = document.querySelector('.container')
const text = document.querySelector('#text')

const totalTime = 12000
const breatheTime = totalTime / 3
const holdTime = totalTime / 3

breatheAnimation()

function breatheAnimation() {
    text.innerHTML = 'Breathe In ...'
    container.className = 'container grow'

    setTimeout(() => {
        text.innerText = 'Hold'

        setTimeout(() => {
            text.innerText = 'Breath Out ...'
            container.className = 'container shrink'
        }, holdTime)
    }, breatheTime)
}

setInterval(breatheAnimation, totalTime);
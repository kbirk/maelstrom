'use strict';

function getTypingPauseMS() {
    return Math.random() * 100 + 100;
}

function getLongPauseMS() {
    return Math.random() * 2000 + 3000;
}

function getShortPauseMS() {
    return Math.random() * 1000;
}

function getDeletingPauseMS() {
    return Math.random() * 50 + 40;
}

function typeText($elem, text, callback) {

    const $text = $elem.children().first();
    let numLetters = 0;

    function typeLetter() {
        // check if done typing
        if (numLetters > text.length) {
            // wait and then execute callback
            setTimeout(callback, getLongPauseMS());
            return;
        }
        // add next letter
        $text.text(text.substring(0, numLetters));
        // increment letter count
        numLetters++;
        // wait for next letter
        setTimeout(typeLetter, getTypingPauseMS());
    }

    typeLetter();
}

function deleteText($elem, text, callback) {

    const $text = $elem.children().first();
    let numLetters = text.length;

    function deleteLetter() {
        // check if done deleting
        if (numLetters < 0) {
            // wait and then execute callback
            setTimeout(callback, getShortPauseMS());
            return;
        }
        // remove next letter
        $text.text(text.substring(0, numLetters));
        // decrement letter count
        numLetters--;
        // wait for next letter
        setTimeout(deleteLetter, getDeletingPauseMS());
    }

    deleteLetter();
}

function animatedTyping($elem, text) {

    function type(index) {
        // start typing line at `index`
        typeText($elem, text[index], () => {
            // start deleting line at `index`
            deleteText($elem, text[index], () => {
                // go to next line
                type((index+1) % text.length);
            });
        });
    }

    type(0);
}

module.exports = animatedTyping;

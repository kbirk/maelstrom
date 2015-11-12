( function() {

    "use strict";

    function getTypingPause() {
        return Math.random() * 100 + 100;
    }

    function typeText( $elem, text, callback ) {

        function typeLetter() {
            if ( numLetters > text.length ) {
                callback();
                return;
            }
            $text.text( text.substring( 0, numLetters ) );
            numLetters++;
            setTimeout( typeLetter, getTypingPause() );
        }

        var $text = $elem.children().first(),
            numLetters = 0;
        typeLetter();
    }

    function getDeletingPause() {
        return Math.random() * 50 + 20;
    }

    function deleteText( $elem, text, callback ) {

        function deleteLetter() {
            if ( numLetters < 0 ) {
                callback();
                return;
            }
            $text.text( text.substring( 0, numLetters ) );
            numLetters--;
            setTimeout( deleteLetter, getDeletingPause() );
        }

        var $text = $elem.children().first(),
            numLetters = text.length;
        deleteLetter();
    }

    function getLongPause() {
        return Math.random() * 2000 + 3000;
    }

    function getShortPause() {
        return Math.random() * 1000;
    }

    function animatedTyping( $elem, text ) {

        console.log("ASdfasdf");
        function type( index ) {
                console.log("tyyy");
            typeText( $elem, text[ index ], function() {
                setTimeout( function() {
                        console.log("deee");
                    deleteText( $elem, text[ index ], function() {
                            console.log("again");
                        setTimeout( function() {
                            type( (index+1) % text.length );
                        }, getShortPause() );
                    });
                }, getLongPause() );
            });
        }

        type( 0 );
    }

    window.animatedTyping = animatedTyping;

}());

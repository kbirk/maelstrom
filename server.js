(function() {

    "use strict";

    var express = require( 'express' ),
        bodyParser = require( 'body-parser' ),
        compression = require( 'compression' ),
        app = express();
    app.use( bodyParser.json() ); // support JSON-encoded bodies
    app.use( bodyParser.urlencoded({ extended: false }) ); // support URL-encoded bodies
    app.use( compression() );
    app.use( express.static( __dirname + "/build/" ) );
    app.listen( 8080, '127.0.0.1', function() {
        console.log( 'Listening on port %d', 8080 );
    });

}());

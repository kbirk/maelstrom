(function() {

    'use strict';

    var express = require( 'express' );
    var bodyParser = require( 'body-parser' );
    var compression = require( 'compression' );

    var HOST = '127.0.0.1';
    var PORT = 8080;

    var app = express();
    app.use( bodyParser.json() ); // support JSON-encoded bodies
    app.use( bodyParser.urlencoded({ extended: false }) ); // support URL-encoded bodies
    app.use( compression() );
    app.use( express.static( __dirname + '/build/' ) );
    app.listen( PORT, HOST, function() {
        console.log( 'Listening on port %d', PORT );
    });

}());

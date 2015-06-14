( function() {

    "use strict";

    var gulp = require('gulp'),
        concat = require('gulp-concat'),
        bower,
        csso,
        filter,
        uglify;

    var paths = {
        js: [ 'webapp/js/**/*.js', 'webapp/*.js' ],
        css: [ 'webapp/css/reset.css', 'webapp/css/*.css' ],
        html: [ 'webapp/html/**/*.html' ],
        index: [ 'webapp/index.html' ],
        images: [ 'webapp/resources/images/*.png' ],
        shaders: [ 'webapp/resources/shaders/*.vert', 'webapp/resources/shaders/*.frag' ]
    };

    gulp.task('clean', function () {
        var del = require('del');
       	del.sync([ 'build/*']);
    });

    gulp.task('lint', function() {
        var jshint = require('gulp-jshint');
        return gulp.src( [ './webapp/**/*.js',
            '!./webapp/vendor/**/*.js'] )
            .pipe( jshint() )
            .pipe( jshint('.jshintrc') )
            .pipe( jshint.reporter('jshint-stylish') );
    });

    gulp.task('build-min-js', function() {
        uglify = uglify || require('gulp-uglify');
        return gulp.src( paths.js )
            .pipe( concat('maelstrom.min.js') )
            //.pipe( uglify().on('error', function(e){console.log(e);}) )
            .pipe( gulp.dest('build') );
    });

    gulp.task('build-min-css', function () {
        csso = csso || require('gulp-csso');
        var concat = require('gulp-concat');
        return gulp.src( paths.css )
            .pipe( csso() )
            .pipe( concat('maelstrom.min.css') )
            .pipe( gulp.dest('build') );
    });

    gulp.task('build-min-html', function() {
        var minifyHtml = require('gulp-minify-html');
        return gulp.src( paths.html )
            .pipe( minifyHtml() )
            .pipe( gulp.dest('build/html') );
    });

    gulp.task('copy-index', function() {
        return gulp.src( paths.index )
            .pipe( gulp.dest('build') );
    });

    gulp.task('copy-shaders', function() {
        return gulp.src( paths.shaders )
            .pipe( gulp.dest('build/shaders/') );
    });

    gulp.task('copy-images', function() {
        return gulp.src( paths.images )
            .pipe( gulp.dest('build/images/') );
    });

    gulp.task('build-vendor-js', function() {
        filter = filter || require('gulp-filter');
        bower = bower || require('main-bower-files');
        uglify = uglify || require('gulp-uglify');
        return gulp.src( bower() )
            .pipe( filter('**/*.js') ) // filter js files
            .pipe( concat('vendor.min.js') )
            .pipe( uglify() )
            .pipe( gulp.dest('build') );
    });

    gulp.task('build-vendor-css', function() {
        filter = filter || require('gulp-filter');
        bower = bower || require('main-bower-files');
        csso = csso || require('gulp-csso');
        return gulp.src( bower() )
            .pipe( filter('**/*.css') ) // filter css files
            .pipe( csso() )
            .pipe( concat('vendor.min.css') )
            .pipe( gulp.dest('build') );
    });

    gulp.task('watch', function() {
        gulp.watch( paths.js, [ 'build-min-js' ] );
        gulp.watch( paths.css, ['build-min-css'] );
        gulp.watch( paths.html, [ 'build-min-html' ] );
        gulp.watch( paths.images, [ 'copy-images' ] );
        gulp.watch( paths.index, [ 'copy-index' ] );
        gulp.watch( paths.shaders, [ 'copy-shaders' ] );
    });

    gulp.task('serve', ['build'], function() {
        var express = require( 'express' ),
            bodyParser = require( 'body-parser' ),
            app = express();
        app.use( bodyParser.json() ); // support JSON-encoded bodies
        app.use( bodyParser.urlencoded({ extended: false }) ); // support URL-encoded bodies
        app.use( express.static( __dirname + "/build/" ) );
        app.listen( 8080, function() {
            console.log( 'Listening on port %d', 8080 );
        });
        return app;
    });

    gulp.task('build', [ 'clean', 'lint' ], function() {
        gulp.start( 'build-min-js' );
        gulp.start( 'build-min-css' );
        gulp.start( 'build-min-html' );
        gulp.start( 'build-vendor-js' );
        gulp.start( 'build-vendor-css' );
        gulp.start( 'copy-index' );
        gulp.start( 'copy-images' );
        gulp.start( 'copy-shaders' );
    });

    gulp.task('default', [ 'watch', 'build', 'serve' ], function() {
    });

}());

// Gulp is a "task runner" (aka web dev helper) that helps us with things like compiling React's JSX into plain old JS
// requires having Gulp installed both locally and globally via NPM (the Node Package Manager)

'use strict';

var gulp = require('gulp');
var useref = require('gulp-useref');
// helper for using gulp-plugins
var $ = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'gulp.*'],
  replaceString: /\bgulp[\-.]/
});
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var watchify = require('watchify');
var reactify = require('reactify');
var rimraf = require('rimraf');

// TODO: implement browserSync with live page reloading
// var browserSync = require('browser-sync');
// var reload = browserSync.reload;

// object containing file names and paths for output
var path = {
  HTML: 'src/index.html',
  JSON: 'data/*.geojson',
  MINIFIED_OUT: 'build.min.js',
  OUT: 'build.js',
  DEST: 'dist',
  DEST_BUILD: 'dist/build',
  DEST_SRC: 'dist/src',
  CSS_SRC: 'src/**/*.css',
  ENTRY_POINT: './src/js/App.js',
  DEPENDENCIES: 'node_modules/'
};

gulp.task('clean', function () {
  rimraf(path.DEST, {}, function () {});
});

// helper task to copy our index.html from src to dest
gulp.task('copy', function(){
  gulp.src([path.HTML, path.JSON, path.CSS_SRC])
    .pipe(gulp.dest(path.DEST))
    .pipe($.connect.reload());
});

gulp.task('connect', function() {
  $.connect.server({
    root: 'dist',
    livereload: true
  });
});

// watch: bundle everything and convert our JSX but don't minify or uglify it
gulp.task('watch', function() {
  gulp.watch(path.HTML, ['copy']);

  var watcher  = watchify(
    browserify({
    entries: [path.ENTRY_POINT],
    transform: [reactify],
    debug: true,
    cache: {},
    packageCache: {},
    fullPaths: true
  }));

  return watcher.on('update', function () {
    watcher.bundle()
      .pipe(source(path.OUT))
      .pipe(gulp.dest(path.DEST_SRC))
      console.log('Updated');
  })
    .bundle()
    .pipe(source(path.OUT))
    .pipe(gulp.dest(path.DEST_SRC));
});

// build: convert our JSX, bundle, minify, and uglify our code for production
gulp.task('build', function(){
  browserify({
    entries: [path.ENTRY_POINT],
    transform: [reactify]
  })
    .bundle()
    .pipe(source(path.MINIFIED_OUT))
    .pipe($.streamify($.uglify()))
    .pipe(gulp.dest(path.DEST_BUILD));
});

// swap out build.js with build.min.js in index.html
gulp.task('replaceHTML', function(){
  gulp.src(path.HTML)
    .pipe($.htmlReplace({
      'js': 'build/' + path.MINIFIED_OUT
    }))
    .pipe(gulp.dest(path.DEST));
});

gulp.task('useref', function(){
  gulp.src(path.HTML)
    .pipe(useref())
    .pipe(gulp.dest(path.DEST));
});

// these are what get called when we do either `gulp` or `gulp production` on the CLI
gulp.task('default', ['connect', 'watch', 'clean', 'copy', 'useref']);
gulp.task('production', ['useref', 'build']);
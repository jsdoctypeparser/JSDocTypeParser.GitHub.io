'use strict';

var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var sourceFiles = [
  'node_modules/bootstrap/dist/css/bootstrap.min.css',
  'node_modules/bootstrap/dist/fonts/*',
  'node_modules/github-fork-ribbon-css/gh-fork-ribbon.css',
  'node_modules/jquery/dist/jquery.min.js',
  'node_modules/google-code-prettify/src/prettify.js',
];
var outputPath = 'copied_node_modules/';

gulp.task('copy', function () {
  return gulp
      .src(sourceFiles)
      .pipe(gulp.dest(outputPath));
});

gulp.task('javascript', function () {
  var b = browserify({
    entries: './index.js',
    debug: true,
  });

  return b.bundle()
    .pipe(source('jsdoctypeparser-demo.js'))
    .pipe(buffer())
    .pipe(gulp.dest('./dist/'));
});


gulp.task('build', gulp.parallel('javascript', 'copy'));

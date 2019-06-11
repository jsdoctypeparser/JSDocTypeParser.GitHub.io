'use strict';

var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');


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


gulp.task('build', gulp.series('javascript'));

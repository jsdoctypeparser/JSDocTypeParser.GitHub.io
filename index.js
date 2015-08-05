/* globals jQuery, prettyPrint */
(function($, prettyPrint) {
  'use strict';
  var jsdoctypeparser = require('jsdoctypeparser');
  var events = require('events');
  var util = require('util');

  var INITIAL_TYPE_EXPR = '?TypeExpression=';



  function TypeExpressionModel() {
    events.EventEmitter.call(this);
  }
  util.inherits(TypeExpressionModel, events.EventEmitter);


  TypeExpressionModel.EventType = {
    CHANGE: 'change',
  };


  TypeExpressionModel.prototype.parse = function(typeExpr) {
    try {
      var ast = jsdoctypeparser.parse(typeExpr);

      this.ast = ast;
      this.hasSyntaxError = false;
      this.errorMessage = '';
    }
    catch (err) {
      if (!(err instanceof jsdoctypeparser.SyntaxError)) throw err;

      this.ast = null;
      this.hasSyntaxError = true;
      this.errorMessage = err.message;
    }

    this.emit(TypeExpressionModel.EventType.CHANGE);
  };



  function ParseResultView(model, $jsonView, $stringView) {
    this.typeExprModel = model;

    this.$jsonView = $jsonView;
    this.$stringView = $stringView;

    var self = this;
    this.typeExprModel.on(TypeExpressionModel.EventType.CHANGE, function() {
      self.render(self.typeExprModel);
    });
  }


  ParseResultView.prototype.render = function(model) {
    var $allViews = $([
      this.$jsonView[0],
      this.$stringView[0],
    ]);

    if (model.hasSyntaxError) {
      $allViews.text('ERROR');
    }
    else {
      var ast = model.ast;
      this.$jsonView.text(JSON.stringify(ast, null, 2));
      this.$stringView.text(jsdoctypeparser.publish(ast));
    }

    $allViews.removeClass('prettyprinted');
    prettyPrint();
  };



  function ParseSuccessfulAlert(model, $alertElement) {
    this.typeExprModel = model;

    this.$alertElement = $alertElement;

    var self = this;

    this.typeExprModel.on(TypeExpressionModel.EventType.CHANGE, function() {
      self.setVisibility(!self.typeExprModel.hasSyntaxError);
    });
  }


  ParseSuccessfulAlert.prototype.setVisibility = function(isVisible) {
    this.$alertElement.toggle(isVisible);
  };



  function ParseErrorAlert(model, $alertElement, $messageElement, $closeButton) {
    this.typeExprModel = model;

    this.$alertElement = $alertElement;
    this.$messageElement = $messageElement;
    this.$closeButton = $closeButton;

    var self = this;

    this.typeExprModel.on(TypeExpressionModel.EventType.CHANGE, function() {
      self.render(self.typeExprModel);
    });

    this.$closeButton.on('click', function() {
      self.setVisibility(true);
    });
  }


  ParseErrorAlert.prototype.render = function(model) {
    this.setVisibility(model.hasSyntaxError);
    this.setMessage(model.errorMessage);
  };


  ParseErrorAlert.prototype.setVisibility = function(isVisible) {
    this.$alertElement.toggle(isVisible);
  };


  ParseErrorAlert.prototype.setMessage = function(msg) {
    this.$messageElement.text(msg);
  };


  function bootstrap() {
    var typeExprModel = new TypeExpressionModel();

    createParseSuccessfulAlert(typeExprModel);
    createParseErrorAlert(typeExprModel);
    createParseResultView(typeExprModel);

    var $input = $('#input');
    $input.on('change', function() {
      var typeExprStr = $input.val();
      typeExprModel.parse(typeExprStr);
    });

    var $form = $('#form');
    $form.on('submit', function(e) {
      // Prevent page reloading when form submitted.
      e.preventDefault();
    });

    typeExprModel.parse(INITIAL_TYPE_EXPR, true);
  }



  function createParseSuccessfulAlert(model) {
    var $alertElement = $('#success');
    return new ParseSuccessfulAlert(model, $alertElement);
  }



  function createParseErrorAlert(model) {
    var $alertElement = $('#err');
    var $messageElement = $('#err-msg');
    var $closeButton = $('#err-close');
    return new ParseErrorAlert(model, $alertElement, $messageElement, $closeButton);
  }



  function createParseResultView(model) {
    var $jsonView = $('#output-obj');
    var $stringView = $('#output-str');
    return new ParseResultView(model, $jsonView, $stringView);
  }


  bootstrap();
})(jQuery, prettyPrint);

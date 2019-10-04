/* globals jQuery, prettyPrint */
(function($, prettyPrint) {
  'use strict';
  const jsdoctypeparser = require('jsdoctypeparser');
  const events = require('events');
  const util = require('util');

  const INITIAL_TYPE_EXPR = '?TypeExpression=';



  function TypeExpressionModel() {
    events.EventEmitter.call(this);
  }
  util.inherits(TypeExpressionModel, events.EventEmitter);


  TypeExpressionModel.EventType = {
    CHANGE: 'change',
  };


  TypeExpressionModel.prototype.parse = function(typeExpr) {
    try {
      const ast = jsdoctypeparser.parse(typeExpr);

      this.ast = ast;
      this.hasSyntaxError = false;
      this.errorMessage = '';
    }
    catch (err) {
      if (!(err instanceof jsdoctypeparser.JSDocTypeSyntaxError)) throw err;

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

    this.typeExprModel.on(TypeExpressionModel.EventType.CHANGE, () => {
      this.render(this.typeExprModel);
    });
  }


  ParseResultView.prototype.render = function(model) {
    const $allViews = $([
      this.$jsonView[0],
      this.$stringView[0],
    ]);

    if (model.hasSyntaxError) {
      $allViews.text('ERROR');
    }
    else {
      const ast = model.ast;
      this.$jsonView.text(JSON.stringify(ast, null, 2));
      this.$stringView.text(jsdoctypeparser.publish(ast));
    }

    $allViews.removeClass('prettyprinted');
    prettyPrint();
  };



  function ParseSuccessfulAlert(model, $alertElement) {
    this.typeExprModel = model;

    this.$alertElement = $alertElement;

    this.typeExprModel.on(TypeExpressionModel.EventType.CHANGE, () => {
      this.setVisibility(!this.typeExprModel.hasSyntaxError);
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

    this.typeExprModel.on(TypeExpressionModel.EventType.CHANGE, () => {
      this.render(this.typeExprModel);
    });

    this.$closeButton.on('click', () => {
      this.setVisibility(true);
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
    const typeExprModel = new TypeExpressionModel();

    createParseSuccessfulAlert(typeExprModel);
    createParseErrorAlert(typeExprModel);
    createParseResultView(typeExprModel);

    const $input = $('#input');
    $input.on('change', function() {
      const typeExprStr = $input.val();
      typeExprModel.parse(typeExprStr);
    });

    const $form = $('#form');
    $form.on('submit', function(e) {
      // Prevent page reloading when form submitted.
      e.preventDefault();
    });

    typeExprModel.parse(INITIAL_TYPE_EXPR, true);
  }



  function createParseSuccessfulAlert(model) {
    const $alertElement = $('#success');
    return new ParseSuccessfulAlert(model, $alertElement);
  }



  function createParseErrorAlert(model) {
    const $alertElement = $('#err');
    const $messageElement = $('#err-msg');
    const $closeButton = $('#err-close');
    return new ParseErrorAlert(model, $alertElement, $messageElement, $closeButton);
  }



  function createParseResultView(model) {
    const $jsonView = $('#output-obj');
    const $stringView = $('#output-str');
    return new ParseResultView(model, $jsonView, $stringView);
  }


  bootstrap();
})(jQuery, prettyPrint);

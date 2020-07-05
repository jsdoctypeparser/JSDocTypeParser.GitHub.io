/* globals jQuery, prettyPrint */
(function($, prettyPrint) {
  'use strict';
  const jsdoctypeparser = require('jsdoctypeparser');

  const modeMap = new Map([
    ['permissive', jsdoctypeparser.JSDocTypeSyntaxError],
    ['jsdoc', jsdoctypeparser.JSDocSyntaxError],
    ['closure', jsdoctypeparser.ClosureSyntaxError],
    ['typescript', jsdoctypeparser.TypeScriptSyntaxError],
  ]);
  const INITIAL_TYPE_EXPR = '?TypeExpression=';

  class ParseSuccessfulAlert {
    constructor (model, $alertElement) {
      this.typeExprModel = model;

      this.$alertElement = $alertElement;

      this.typeExprModel.addEventListener('change', () => {
        this.setVisibility(!this.typeExprModel.hasSyntaxError);
      });
    }

    setVisibility (isVisible) {
      this.$alertElement.toggle(isVisible);
    }
  }

  class ParseErrorAlert {
    constructor (model, $alertElement, $messageElement, $closeButton) {
      this.typeExprModel = model;

      this.$alertElement = $alertElement;
      this.$messageElement = $messageElement;
      this.$closeButton = $closeButton;

      this.typeExprModel.addEventListener('change', () => {
        this.render(this.typeExprModel);
      });

      this.$closeButton.on('click', () => {
        this.setVisibility(true);
      });
    }

    render (model) {
      this.setVisibility(model.hasSyntaxError);
      this.setMessage(model.errorMessage);
    }

    setVisibility (isVisible) {
      this.$alertElement.toggle(isVisible);
    }

    setMessage (msg) {
      this.$messageElement.text(msg);
    }
  }

  class ParseResultView {
    constructor (model, $jsonView, $stringView) {
      this.typeExprModel = model;

      this.$jsonView = $jsonView;
      this.$stringView = $stringView;

      this.typeExprModel.addEventListener('change', () => {
        this.render(this.typeExprModel);
      });
    }

    render (model) {
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
    }
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

  class TypeExpressionModel extends EventTarget {
    constructor () {
      super();
    }

    parse (typeExpr, {mode, startRule}) {
      try {
        const ast = jsdoctypeparser.parse(typeExpr, {mode, startRule});

        this.ast = ast;
        this.hasSyntaxError = false;
        this.errorMessage = '';
      }
      catch (err) {
        console.log(err);

        const syntaxError = modeMap.get(mode);
        if (!(err instanceof syntaxError)) throw err;

        this.ast = null;
        this.hasSyntaxError = true;
        this.errorMessage = err.message;
      }

      this.dispatchEvent(new CustomEvent('change'));
    }
  }

  function bootstrap() {
    const typeExprModel = new TypeExpressionModel();

    createParseSuccessfulAlert(typeExprModel);
    createParseErrorAlert(typeExprModel);
    createParseResultView(typeExprModel);

    const $input = $('#input');
    const $mode = $('#mode');
    const $startRule = $('#startRule');

    function getOptions () {
      const mode = $mode.val();
      const startRule = $startRule.val();
      return {
        mode,
        startRule,
      };
    }

    function parseInput () {
      const typeExprStr = $input.val();
      typeExprModel.parse(typeExprStr, getOptions());
    }

    $input.on('change', parseInput);
    $mode.on('change', parseInput);
    $startRule.on('change', parseInput);

    const $form = $('#form');
    $form.on('submit', function(e) {
      // Prevent page reloading when form submitted.
      e.preventDefault();
    });

    $input.val(INITIAL_TYPE_EXPR);

    parseInput();
  }

  bootstrap();
})(jQuery, prettyPrint);

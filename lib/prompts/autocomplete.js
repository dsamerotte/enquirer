'use strict';

const colors = require('ansi-colors');
const Select = require('./select');

const placeholder = (input, color = colors.red) => {
  return str => {
    let i = str.indexOf(input);
    return str.slice(0, i) + color(input) + str.slice(i + input.length);
  };
};

class AutoComplete extends Select {
  constructor(options = {}) {
    super(options);
    this.cursorShow();
  }

  moveCursor(n) {
    this.state.cursor += n;
  }

  dispatch(ch) {
    return this.append(ch);
  }

  space(ch) {
    return this.options.multiple ? super.space(ch) : this.append(ch);
  }

  append(ch) {
    let { cursor, input } = this.state;
    this.state.input = input.slice(0, cursor) + ch + input.slice(cursor);
    this.moveCursor(1);
    return this.complete();
  }

  delete() {
    let { cursor, input } = this.state;
    if (!input) return this.alert();
    this.state.input = input.slice(0, cursor - 1) + input.slice(cursor);
    this.moveCursor(-1);
    return this.complete();
  }

  async complete() {
    this.completing = true;
    this.choices = (await this.suggest(this.state.input, this.state._choices));
    this.state.limit = void 0; // allow getter/setter to reset limit
    this.index = Math.min(Math.max(this.visible.length - 1, 0), this.index);
    await this.render();
    this.completing = false;
  }

  suggest(input = this.state.input, choices = this.state._choices) {
    if (typeof this.options.suggest === 'function') {
      return this.options.suggest.call(this, input, choices);
    }
    return choices.filter(ch => ch.message.toLowerCase().includes(input.toLowerCase()));
  }

  pointer() {
    return '';
  }

  format() {
    if (!this.focused) return this.input;
    if (this.options.multiple && this.state.submitted) {
      return this.selected.map(ch => this.styles.primary(ch.message)).join(', ');
    }
    if (this.state.submitted) {
      let value = this.value = this.state.input = this.focused.value;
      return this.styles.primary(value);
    }
    return this.state.input;
  }

  async render() {
    let color = placeholder(this.state.input, this.styles.complement);
    let visible = !this.state.submitted ? await this.suggest() : [];
    this.visible = visible.map(ch => ({ ...ch, message: color(ch.message) }));
    await super.render();
    this.visible = visible;
  }

  submit() {
    if (this.options.multiple) {
      this.value = this.selected.map(ch => ch.name);
    }
    return super.submit();
  }
}

module.exports = AutoComplete;
class EditableDivWithPlaceholder {
  constructor(containerId, spellcheck) {
      this.container = document.getElementById(containerId);
      if (!this.container) throw new Error(`Container with id ${containerId} not found`);
      this.container.classList.add('editable-container');
      this.placeholderText = this.container.getAttribute('data-placeholder') || 'Use the data-placeholder attribute to add placeholder text';
      this.spellcheck = spellcheck;
      this.render();
      this.bindEvents();
  }

  render() {
      this.container.innerHTML = `
          <div id="${this.container.id}Text" class="editable-div" contenteditable="plaintext-only" spellcheck="${this.spellcheck}"></div>
          <div id="${this.container.id}Placeholder" class="placeholder">${this.placeholderText}</div>
      `;

      this.editableDiv = this.container.querySelector(`#${this.container.id}Text`);
      this.placeholder = this.container.querySelector(`#${this.container.id}Placeholder`);
  }

  blur() {
    this.editableDiv.blur();
  }

  bindEvents() {
      this.editableDiv.addEventListener('input', () => {
        const isEmpty = this.editableDiv.textContent.trim() === '';
        this.placeholder.classList.toggle('hidden', !isEmpty);
      });

      this.editableDiv.addEventListener('focus', () => {
          if (this.editableDiv.textContent.trim() === '') {
              this.editableDiv.textContent = '';
          }
      });
      this.editableDiv.addEventListener('blur', () => {
          if (this.editableDiv.textContent.trim() === '') {
              this.editableDiv.textContent = '';
              this.placeholder.classList.remove('hidden');
          }
      });
  }

  getEditableDiv() {
    return this.editableDiv;
  }

  getText() {
    return this.editableDiv.textContent.trim();
  }

  setText(text) {
    this.editableDiv.textContent = text;
    const isEmpty = text.trim() === '';
    this.placeholder.classList.toggle('hidden', !isEmpty);
  }
};

export { EditableDivWithPlaceholder };
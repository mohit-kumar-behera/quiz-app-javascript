'use strict';

const ALERT = {
  DANGER: 'alert-danger',
  INFO: 'alert-info',
  WARN: 'alert-warn',
  SUCCESS: 'alert-success',
};

const OPERATION_TYPE = {
  CREATE: 'added',
  UPDATE: 'edited',
};

const ALERTBOX_TIMEOUT_SEC = 3;
const HIDE_FORM_TIMEOUT_SEC = 1.5;
const MIN_INPUT_LENGTH = 5;

const addQuestionBtn = document.querySelector('.add-question');
const formWrapper = document.querySelector('.form-wrapper');
const closeFormBtn = document.querySelector('.close-form-btn');
const saveBtn = document.querySelector('.save-btn');
const form = document.getElementById('question-form');
const questionInput = document.getElementById('input-question');
const answerInput = document.getElementById('input-answer');
const qnaContainer = document.querySelector('.qna-container');
const alertBox = document.querySelector('.alert-box');

class Question {
  date = new Date();
  id = this.date.getTime();

  constructor(question, answer) {
    this.question = question;
    this.answer = answer;
  }
}

class LocalStorage {
  KEY = 'quiz-questions';

  addToLocalStorage(data) {
    localStorage.clear();
    const dataJSON = JSON.stringify(data);
    localStorage.setItem(this.KEY, dataJSON);
  }

  retriveFromLocalStorage() {
    const questions = localStorage.getItem(this.KEY);
    if (!questions) return [];

    const questionsParsed = JSON.parse(questions);
    return questionsParsed;
  }

  clearLocalStorage() {
    localStorage.clear();
  }
}

class UI {
  hideForm() {
    formWrapper.classList.remove('show');
    addQuestionBtn.classList.add('show');

    if (this.buffer?.isQuestionInBuffer) {
      const qInBuffer = this.buffer.questionInBuffer;

      // Add the buffered question back
      this._onSuccessfullQuestionFn(qInBuffer, OPERATION_TYPE.UPDATE);

      // Remove question from buffer
      this.buffer.removeQuestionFromBuffer();
    }
  }

  showForm() {
    // Clear Input Fields
    this.clearFields && this.clearFields(questionInput, answerInput);

    formWrapper.classList.add('show');
    addQuestionBtn.classList.remove('show');
  }

  showAlertWindow(message = 'Something went wrong', type = ALERT.INFO) {
    alertBox.classList.add('show', type);
    alertBox.textContent = message;

    setTimeout(function () {
      alertBox.classList.remove('show', type);
    }, ALERTBOX_TIMEOUT_SEC * 1000);
  }

  addQuestion(element, data) {
    const div = document.createElement('div');
    div.classList.add('container', 'quiz-card');
    div.innerHTML = `
      <div class="quiz-card-head">
        <h3 class="question-text">${data.question}</h3>
      </div>
      <div class="quiz-card-body">
        <button type="submit" class="btn-text btn-text-primary show-hide-btn">
          Show / Hide the answer
        </button>
        <p class="answer-text">${data.answer}</p>
      </div>
      <div class="quiz-card-footer">
        <button type="button" class="btn btn-o-secondary edit-btn" data-id="${data.id}">
          Edit
        </button>
        <button type="button" class="btn btn-primary delete-btn" data-id="${data.id}">
          Delete
        </button>
      </div>
    `;

    element.appendChild(div);
  }

  removeQuestion(element, target) {
    element.removeChild(target);
  }
}

class Buffer {
  _questionInBuffer = null;

  get isQuestionInBuffer() {
    return this._questionInBuffer ? true : false;
  }

  get questionInBuffer() {
    return this._questionInBuffer;
  }

  addQuestionToBuffer(question) {
    this._questionInBuffer = question;
    qnaContainer.classList.add('freeze');
  }

  removeQuestionFromBuffer() {
    this._questionInBuffer = null;
    qnaContainer.classList.remove('freeze');
  }
}

class QuizApp {
  questions = [];
  ls = new LocalStorage();
  ui = new UI();
  buffer = new Buffer();

  constructor() {
    // Fetch previously stored quiz data
    const quizData = this.ls.retriveFromLocalStorage();

    // Update UI and questions array
    quizData.forEach(qData => {
      this.questions.push(qData);
      this.ui.addQuestion(qnaContainer, qData);
    });

    // Event Listener
    addQuestionBtn.addEventListener('click', this.ui.showForm.bind(this));
    closeFormBtn.addEventListener('click', this.ui.hideForm.bind(this));
    form.addEventListener('submit', this._addNewQuestion.bind(this));
    qnaContainer.addEventListener('click', this._handleQuizCard.bind(this));
  }

  clearFields(...fields) {
    fields.forEach(field => (field.value = ''));
  }

  _onSuccessfullQuestionFn(question, type = OPERATION_TYPE.CREATE) {
    // Add Question
    this.questions.push(question);

    // Add to local storage
    this.ls.addToLocalStorage(this.questions);

    // Update UI
    this.ui.addQuestion(qnaContainer, question);

    if (type === OPERATION_TYPE.UPDATE) return;

    // Show success message
    this.ui.showAlertWindow('Question was saved successfully.', ALERT.SUCCESS);
  }

  _validateInput(questionVal, answerVal) {
    let flag = true;

    if (questionVal === '' || answerVal === '') {
      this.ui.showAlertWindow('Fields cannot be left empty.', ALERT.DANGER);

      flag = false;
    } else if (
      questionVal.length <= MIN_INPUT_LENGTH ||
      answerVal.length <= MIN_INPUT_LENGTH
    ) {
      this.ui.showAlertWindow(
        `The Question and Answer field values must be atleast ${MIN_INPUT_LENGTH} character.`,
        ALERT.INFO
      );

      flag = false;
    }

    return flag;
  }

  _addNewQuestion(e) {
    e.preventDefault();

    // Fetch FormData
    const dataArr = [...new FormData(e.target)];
    const { inputQuestion: questionVal, inputAnswer: answerVal } =
      Object.fromEntries(dataArr);

    // Validate Input
    const isValidate = this._validateInput(questionVal, answerVal);
    if (!isValidate) return;

    // Create Question Obj
    const question = new Question(questionVal, answerVal);

    // On Successfully adding a question
    this._onSuccessfullQuestionFn(question);

    // Clear Input Fields
    this.clearFields(questionInput, answerInput);

    // Hide Form
    setTimeout(
      function () {
        this.ui.hideForm();
      }.bind(this),
      HIDE_FORM_TIMEOUT_SEC * 1000
    );

    // Remove question from buffer
    if (this.buffer?.isQuestionInBuffer) this.buffer.removeQuestionFromBuffer();
  }

  _removeQuestion(qid, elem) {
    // Remove question from UI
    this.ui.removeQuestion(qnaContainer, elem);

    // Update questions array
    this.questions = this.questions.filter(
      question => question.id !== parseInt(qid)
    );

    // Update Local Storage
    this.ls.addToLocalStorage(this.questions);
  }

  _handleQuizCard(e) {
    e.preventDefault();

    // Disable it if there is a question in buffer
    if (this.buffer.isQuestionInBuffer) {
      this.ui.showAlertWindow(
        'First save your changes in currently ongoing edit process or cancel it',
        ALERT.WARN
      );
      return;
    }

    const cardElTarget = e.target;

    /* SHOW-HIDE CARD */
    if (cardElTarget.classList.contains('show-hide-btn')) {
      cardElTarget.nextElementSibling.classList.toggle('show');
      return;
    }

    /* EDIT CARD */
    if (cardElTarget.classList.contains('edit-btn')) {
      // ID of current clicked quiz card
      const id = cardElTarget.dataset.id;
      const [editQuestion] = this.questions.filter(
        question => question.id === parseInt(id)
      );

      // Add question to Buffer Storage
      this.buffer.addQuestionToBuffer(editQuestion);

      // Remove Question
      const rootEl = cardElTarget.parentElement.parentElement;
      this._removeQuestion(id, rootEl);

      // Show Form to Edit
      this.ui.showForm();
      questionInput.value = editQuestion.question;
      answerInput.value = editQuestion.answer;
      return;
    }

    /* DELETE CARD */
    if (cardElTarget.classList.contains('delete-btn')) {
      // ID of current clicked quiz card
      const id = cardElTarget.dataset.id;

      // Remove Question
      const rootEl = cardElTarget.parentElement.parentElement;
      this._removeQuestion(id, rootEl);
      return;
    }
  }
}

const app = new QuizApp();

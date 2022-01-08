'use strict';

const ALERT = {
  DANGER: 'alert-danger',
  INFO: 'alert-info',
  WARN: 'alert-warn',
  SUCCESS: 'alert-success',
};
const ALERTBOX_TIMEOUT_SEC = 3;
const HIDE_FORM_TIMEOUT_SEC = 1.5;
const MIN_INPUT_LENGTH = 1; // MUST BE 5

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
  }

  showForm() {
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

class QuizApp {
  questions = [];
  ls = new LocalStorage();
  ui = new UI();

  constructor() {
    // Fetch previously stored quiz data
    const quizData = this.ls.retriveFromLocalStorage();

    // Update UI and questions array
    quizData.forEach(qData => {
      this.questions.push(qData);
      this.ui.addQuestion(qnaContainer, qData);
    });

    // Event Listener
    addQuestionBtn.addEventListener('click', this.ui.showForm);
    closeFormBtn.addEventListener('click', this.ui.hideForm);
    form.addEventListener('submit', this._addNewQuestion.bind(this));
    qnaContainer.addEventListener('click', this._handleQuizCard.bind(this));
  }

  _clearFields(...fields) {
    fields.forEach(field => (field.value = ''));
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

    // Add Question
    const question = new Question(questionVal, answerVal);
    this.questions.push(question);

    // Clear Input Fields
    this._clearFields(questionInput, answerInput);

    // Add to local storage
    this.ls.addToLocalStorage(this.questions);

    // Update UI
    this.ui.addQuestion(qnaContainer, question);

    // Show success message
    this.ui.showAlertWindow('Question was added successfully.', ALERT.SUCCESS);

    // Hide Form
    setTimeout(
      function () {
        this.ui.hideForm();
      }.bind(this),
      HIDE_FORM_TIMEOUT_SEC * 1000
    );
  }

  _removeQuestion(qid, elem) {
    this.ui.removeQuestion(qnaContainer, elem);

    // Update questions array
    this.questions = this.questions.filter(item => item.id !== parseInt(qid));

    this.ls.addToLocalStorage(this.questions);
  }

  _handleQuizCard(e) {
    e.preventDefault();
    const cardElTarget = e.target;

    if (cardElTarget.classList.contains('show-hide-btn')) {
      cardElTarget.nextElementSibling.classList.toggle('show');
    } else if (cardElTarget.classList.contains('edit-btn')) {
      // ID of current clicked quiz card
      const id = cardElTarget.dataset.id;
    } else if (cardElTarget.classList.contains('delete-btn')) {
      // ID of current clicked quiz card
      const id = cardElTarget.dataset.id;

      // Remove Question from UI
      const rootEl = cardElTarget.parentElement.parentElement;
      this._removeQuestion(id, rootEl);
    } else {
      return;
    }
  }
}

const app = new QuizApp();

/* TODO: 
## EDIT ##
1) Add question to buffer
2) Remove question from UI
CASE 1: EDIT DONE
  add the question as if it is created and clear the buffer
CASE 2: EDIT CANCELLED
  Before hiding the form check if there is some question in buffer and if it is there then add that question to ui

*/

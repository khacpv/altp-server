var Question = function (question, answers, answerRight, questionIndex) {
    this.question = question;
    this.answers = answers;
    this.answerRight = answerRight;
    this.questionIndex = questionIndex;
};

module.exports = Question;
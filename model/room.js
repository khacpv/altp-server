var Room = function(id, users, questions, answerRight) {
    this.id = id;
    this.users = users;
    this.questions = questions;
    this.answerRight = answerRight | 0;
    this.questionIndex = 0;
};

module.exports = Room;
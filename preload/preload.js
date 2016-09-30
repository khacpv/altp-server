var string = {};

string.init = function () {
    // add contains() to String
    String.prototype.contains = function (it) {
        return this.indexOf(it) != -1;
    };

    String.prototype.containsAtLeastOneItemInArray = function(arr){
        return new RegExp(arr.join('|')).test(this);
    };

    Math.randomBetween = function(min,max){
        return Math.floor(Math.random() * max) + min;
    };
};

string.init();
module.exports = string;
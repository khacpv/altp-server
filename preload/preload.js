var string = {};

string.init = function () {
    // add contains() to String
    String.prototype.contains = function (it) {
        return this.indexOf(it) != -1;
    };

    String.prototype.containsAtLeastOneItemInArray = function(arr){
        return new RegExp(arr.join('|')).test(this);
    }
};

string.init();
module.exports = string;
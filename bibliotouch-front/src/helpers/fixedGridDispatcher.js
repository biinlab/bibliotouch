//require('dragscroll');

var FixedGridDispatcher = function () {
}

FixedGridDispatcher.prototype.dispatch = function(elements, columns, cellWidth, cellHeight) {
    let i = 0;

    elements.forEach(function(element) {
        element.dispatch = {
            x : (i%columns)*cellWidth,
            y : Math.trunc(i/columns)*cellHeight
        };
        i++;
    }, this);
}


module.exports = new FixedGridDispatcher();
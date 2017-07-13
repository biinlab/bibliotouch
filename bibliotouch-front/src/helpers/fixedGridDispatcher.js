/**
 * @author Alix Ducros <ducrosalix@hotmail.fr>
 * @module
 */

/**
 * A module giving xy coordinates to elements for a given number of columns
 * I doubt of its usefulness now
 * @constructor
 * 
 */
var FixedGridDispatcher = function () {
}

/**
 * Give to each element of elements a dispatch property with a x and a y value.
 * 
 * @param {Arry} elements - The array of elements to dispatch
 * @param {integer} columns - The number of columns on which we wish to dispatch
 * @param {integer} cellWidth - The width of and element
 * @param {integer} cellHeight - The height of an element
 */
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
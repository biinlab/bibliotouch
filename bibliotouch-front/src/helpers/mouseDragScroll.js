var curYPos, curXPos, curDown;

/**
 * @author Alix Ducros <ducrosalix@hotmail.fr>
 * @module
 */

var mousemove = function(e){ 
    if(curDown){
        window.scrollTo(scrollX - e.movementX, scrollY - e.movementY);
    }
};

var mousedown = function(e){ 
    curYPos = e.pageY; 
    curXPos = e.pageX; 
    curDown = true; 
};

var mouseup =  function(e){ 
    curDown = false; 
};


/**
 * Enable window scrolling using mouse click and drag interaction
 * @constructor
 */
var MouseDragScroll = function(){}

/**
 * Enables scrolling
 * 
 */
MouseDragScroll.prototype.enableDragScroll = function(){
    window.addEventListener('mousemove', mousemove);
    window.addEventListener('mousedown', mousedown);
    window.addEventListener('mouseup', mouseup);
};

/**
 * Disables scrolling
 * 
 */
MouseDragScroll.prototype.disableDragScroll = function(){
    window.removeEventListener('mousemove', mousemove);
    window.removeEventListener('mousedown', mousedown);
    window.removeEventListener('mouseup', mouseup);
}

module.exports = new MouseDragScroll();
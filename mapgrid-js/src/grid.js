//require('dragscroll');

var Mapgrid = function (grid, columns, options) {
    this.grid = grid;
    this.columns = columns;
    this.lastIndex = 0;
    this.cellWidth = -1;
    this.cellHeight = -1;

    if(!options){
        options = {};
    }

    grid.style.height = options.height || window.innerHeight+"px";
    grid.style.width = options.width || window.innerWidth+"px";

    grid.style.overflow = 'scroll';
    grid.style.position = 'relative';
    grid.className += ' dragscroll';

    var self = this;

    //Place already present cells
    for (var index = 0; index < this.grid.childElementCount ; index++) {
        this.placeCell();
    }

    // select the target node
    var target = this.grid;
    
    // create an observer instance
    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if(mutation.type == "childList"){
                for(var index = 0 ; index < mutation.addedNodes.length ; index++) {
                    self.placeCell();
                }
            }
        });    
    });

    // configuration of the observer:
    let config = {childList: true};
    
    // pass in the target node, as well as the observer options
    observer.observe(target, config);
}

Mapgrid.prototype.placeCell = function() {
        let cell = this.grid.childNodes[this.lastIndex];
        cell.style.position = "absolute";
        if(this.cellHeight < 0 ||this.cellWidth < 0) {
            this.cellWidth = cell.offsetWidth;
            this.cellHeight = cell.offsetHeight;
        }
        cell.style.left = ((this.lastIndex%this.columns)*this.cellWidth).toString()+'px';
        cell.style.top = (Math.trunc(this.lastIndex/this.columns)*this.cellHeight).toString()+'px';
        this.lastIndex++;
}
 


Mapgrid.prototype.getCellWidth = function(){
    let firstChild = this.grid.firstChild;
    if(firstChild != null){
        return firstChild.innerWidth;
    }
}

Mapgrid.prototype.getCellHeight = function() {
    let firstChild = this.grid.firstChild;
    if(firstChild != null) {
        return firstChild.innerHeight;
    }
}

module.exports = Mapgrid;
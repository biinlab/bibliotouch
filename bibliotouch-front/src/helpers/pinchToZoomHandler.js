
var ZoomHandler = function (el) {
    this.el = el;
}

ZoomHandler.prototype.setZoomHandlers = function(zoomInCallback, zoomOutCallback) {

    var startDistance = 0;
    var endDistance = 0;
    var scaling = false;
    var targetX = 0, targetY = 0;
    
    let start_handler = function(e){
        if(e.touches.length == 2) {
            e.preventDefault();
            scaling = true;
            startDistance = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY-e.touches[1].pageY);
        }
    }

    let move_handler = function(e){
        if(scaling){
            e.preventDefault();
            endDistance = Math.hypot(e.touches[0].pageX - e.touches[1].pageX, e.touches[0].pageY-e.touches[1].pageY);
            targetX = Math.trunc(e.touches[0].pageX - e.touches[1].pageX);
            targetY = Math.trunc(e.touches[0].pageY - e.touches[1].pageY);
        }
    }

    let end_handler = function(e){
        if(scaling){
            e.preventDefault();
            scaling = false;
            if(endDistance < startDistance) {
                zoomOutCallback();
            } else {
                zoomInCallback(targetX, targetY);
            }
        }
    }

    this.el.ontouchstart= start_handler;
    this.el.ontouchmove= move_handler;
    // Use same handler for touchcancel and touchend
    this.el.ontouchcancel= end_handler;
    this.el.ontouchend= end_handler;
}

ZoomHandler.prototype.removeZoomHandlers = function(){
    this.el.ontouchstart = null;
    this.el.ontouchmove = null;
    this.el.ontouchcancel = null;
    this.el.ontouchend = null;
}

module.exports = ZoomHandler;
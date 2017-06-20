var Vue = require('vue');

Vue.component('border-indicators', {
    template : `<!--LEFT INDICATOR-->
                <div>
                    <transition name="fade">
                        <div    v-if="showLeftNeighbour && leftNeighbour"
                                v-bind:style="{
                                        position : 'fixed',
                                        left : '0px',
                                        top : '50%',
                                        transform: 'translate(0, -50%)',
                                        margin : '10px'
                                    }">
                            <div v-bind:style="{
                                        width : '12px',
                                        height : '12px',
                                        borderRadius : '6px',
                                        backgroundColor : 'black',
                                        float : 'left',
                                        position : 'absolute',
                                        left : '0px',
                                        top : '50%',
                                        transform: 'translate(0, -50%)'
                                    }">
                            </div>
                            <div    class="indicator"
                                    v-bind:style="{
                                        marginLeft : '18px'
                                        }">
                                {{leftNeighbour.name}}
                            </div>
                        </div>
                    </transition>
                    <!--RIGHT INDICATOR-->
                    <transition name="fade">
                        <div    v-if="showRightNeighbour && rightNeighbour"
                                v-bind:style="{
                                        position : 'fixed',
                                        right : '0px',
                                        top : '50%',
                                        transform: 'translate(0, -50%)',
                                        margin : '10px'
                                    }">
                            <div v-bind:style="{
                                        width : '12px',
                                        height : '12px',
                                        borderRadius : '6px',
                                        backgroundColor : 'black',
                                        float : 'right',
                                        position : 'absolute',
                                        right : '0px',
                                        top : '50%',
                                        transform: 'translate(0, -50%)'
                                    }">
                            </div>
                            <div    class="indicator"
                                    v-bind:style="{
                                        marginRight : '18px'
                                        }">
                                {{rightNeighbour.name}}
                            </div>
                        </div>
                    </transition>
                    <!--TOP INDICATOR-->
                    <transition name="fade">
                        <div    v-if="showTopNeighbour && topNeighbour"
                                v-bind:style="{
                                        position : 'fixed',
                                        left : '50%',
                                        top : '0px',
                                        transform: 'translate(-50%, 0)',
                                        margin : '10px'
                                    }">
                            <div v-bind:style="{
                                        width : '12px',
                                        height : '12px',
                                        borderRadius : '6px',
                                        backgroundColor : 'black',
                                        transform: 'translate(-50%, 0)'
                                    }">
                            </div>
                            <div    class="indicator"
                                    v-bind:style="{
                                        transform: 'translate(-50%, 0)',
                                        marginTop : '6px'
                                        }">
                                {{topNeighbour.name}}
                            </div>
                        </div>
                    </transition>
                    <!--BOT INDICATOR-->
                    <transition name="fade">
                        <div    v-if="showBotNeighbour && botNeighbour"
                                v-bind:style="{
                                        position : 'fixed',
                                        left : '50%',
                                        bottom : '0px',
                                        transform: 'translate(-50%, 0)',
                                        margin : '10px'
                                    }">
                            <div    class="indicator"
                                    v-bind:style="{
                                        transform: 'translate(-50%, 0)',
                                        marginBottom : '18px'
                                        }">
                                {{botNeighbour.name}}
                            </div>
                            <div v-bind:style="{
                                        position : 'absolute',
                                        bottom: '0px',
                                        width : '12px',
                                        height : '12px',
                                        borderRadius : '6px',
                                        backgroundColor : 'black',
                                        transform: 'translate(-50%, 0)'
                                    }">
                            </div>
                        </div>
                    </transition>
                </div>`,
    props : ['topNeighbour','botNeighbour','leftNeighbour','rightNeighbour'],
    data : function(){
        return {
            showTopNeighbour : false,
            showBotNeighbour : false,
            showLeftNeighbour : false,
            showRightNeighbour : false
        }
    },
    mounted : function(){
        let self = this;
        self.scrollTimer = -1;
        window.onscroll = function(e){
            var hideNeighbour = function(){
                self.showTopNeighbour = self.showBotNeighbour = self.showLeftNeighbour = self.showRightNeighbour = false;
            }

            var showNeighbours = function(){
                if(self.lastXPos && self.lastYPos){
                    hideNeighbour();
                    if( window.scrollY < self.lastYPos){
                        self.showTopNeighbour = true;
                    }
                    if( window.scrollY > self.lastYPos){
                        self.showBotNeighbour = true;
                    }
                    if(window.scrollX < self.lastXPos){
                        self.showLeftNeighbour = true;
                    }
                    if(window.scrollX > self.lastXPos){
                        self.showRightNeighbour = true;
                    }
                }
                self.lastXPos = window.scrollX;
                self.lastYPos = window.scrollY;
            }

            showNeighbours(e);
            if(self.scrollTimer != -1){
                clearTimeout(self.scrollTimer);
            }
            self.scrollTimer = window.setTimeout(hideNeighbour, 500);
        };
    }
})
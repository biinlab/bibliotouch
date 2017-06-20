var PackerGrowing = require('./packerGrowing');

var QuadBinPacker = function (bookcellHeight, bookcellWidth) {
    this.bookcellHeight = bookcellHeight;
    this.bookcellWidth = bookcellWidth;
    this.mapSize = {
        w : -1,
        h : -1
    }
}

QuadBinPacker.prototype.sortThemes = function(themes){
    if(!themes){
        return;
    }
    let sortedThemes = [];

    for (var key in themes){
        let larg = Math.trunc((Math.sqrt(themes[key].nbBooks)+1)*1.2);
        let haut = Math.trunc(themes[key].nbBooks/larg)+1;
        if(larg && haut){
            themes[key].w = larg*this.bookcellWidth;
            themes[key].h = haut*this.bookcellHeight;
            themes[key].id = key;
            sortedThemes.push(themes[key]);
        } else {
            console.error(themes[key]);
        }
    }
    sortedThemes.sort(function(a, b) {
        return b.h - a.h;
    });
    return sortedThemes;
}

QuadBinPacker.prototype.pack = function(sortedThemes){
    let getBiggestSizePack = function(roots){
        let biggestW = -1;
        let biggestH = -1;
        for(let i = 0 ; i<roots.length ; i++){
            if(roots[i].w > biggestW){
                biggestW = roots[i].w;
            }
            if(roots[i].h > biggestH){
                biggestH = roots[i].h;
            }
        }
        return {w : biggestW, h : biggestH};
    }

    if(sortedThemes.length == 0){
        return;
    }

    let multi = [];
    multi[0] = [];  //upleft
    multi[1] = [];  //upright
    multi[2] = [];  //downleft
    multi[3] = [];  //downright

    let i = 0;
    sortedThemes.forEach(function(theme){
        multi[i%4].push(theme);
        i++;
    })

    let packer = new PackerGrowing();
    let roots = [];
    for(i = 0 ; i<multi.length ; i++){
        packer.fit(multi[i]);
        roots.push({w : packer.root.w, h : packer.root.h});
    }

    let maxSizes = getBiggestSizePack(roots);
    this.mapSize = {
        w : maxSizes.w*2,
        h : maxSizes.h*2
    }
    //Now we have 4 packs oriented each of them to the top-left
    //We transform each of the elements to obtain a 2x2 square of the 4 packs and all of them oriented to center of the 2x2 square
    //Upleft
    multi[0].forEach(function(theme){
        theme.fit.x = maxSizes.w - theme.w - theme.fit.x;
        theme.fit.y = maxSizes.h - theme.h - theme.fit.y;
    });

    //Upright
    multi[1].forEach(function(theme){
        theme.fit.x = theme.fit.x + maxSizes.w;
        theme.fit.y = maxSizes.h - theme.h - theme.fit.y;
    });

    //DownLeft
    multi[2].forEach(function(theme){
        theme.fit.x = maxSizes.w - theme.w - theme.fit.x;
        theme.fit.y = theme.fit.y + maxSizes.h;
    });

    //Downright
    multi[3].forEach(function(theme){
        theme.fit.x = theme.fit.x + maxSizes.w;
        theme.fit.y = theme.fit.y + maxSizes.h;
    });

    let packedThemes = [];
    for(i = 0 ; i < multi.length ; i++){
        Array.prototype.push.apply(packedThemes, multi[i]);
    }

    return packedThemes;
}

module.exports = QuadBinPacker;
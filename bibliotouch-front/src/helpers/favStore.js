var FavStore = function(){
    this.books = [];    
}

FavStore.prototype.addBook = function (book) {
    if(this.books.indexOf(book) == -1){
        this.books.push(book);
    }
}

FavStore.prototype.removeBook = function (book){
    let index = this.books.indexOf(book);
    if(index != -1){
        this.books.splice(index,1);
    }
}

FavStore.prototype.contains = function (book) {
    if(this.books.indexOf(book) != -1){
        return true;
    } else {
        return false;
    }
}

module.exports = new FavStore();


/**
 * Helper module for storing, retrieving and deleting favorites
 * @constructor
 */
var FavStore = function(){
    this.books = [];    
}

/**
 * Adds a book to the FavStore
 * 
 * @param {any} book - The book to add
 */
FavStore.prototype.addBook = function (book) {
    if(this.books.indexOf(book) == -1){
        this.books.push(book);
    }
}

/**
 * Removes a book from the FavStore
 * 
 * @param {any} book - The book to remove
 */
FavStore.prototype.removeBook = function (book){
    let index = this.books.indexOf(book);
    if(index != -1){
        this.books.splice(index,1);
    }
}


/**
 * Check if the FavStore contains a given book
 * 
 * @param {any} book - The book we want to check
 * @returns {boolean} - if the FavStore contains the given book
 */
FavStore.prototype.contains = function (book) {
    if(this.books.indexOf(book) != -1){
        return true;
    } else {
        return false;
    }
}

module.exports = new FavStore();
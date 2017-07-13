/**
 * @author Alix Ducros <ducrosalix@hotmail.fr>
 * @module
 */

/**
 * Tiny module to build queryArrays to be used by search-index module
 * @constructor
 */
var QueryBuilder = function () {}

/**
 * Enum for Boolean operator values
 * @readonly
 * @enum {number}
 */
QueryBuilder.prototype.BooleanOperator = Object.freeze({
    AND: 0,
    OR: 1,
    NOT: 2
});

/**
 * Returns a queryArray from an array of terms
 * @param {Array} terms - An array of term object (with fields 'field', 'text' and 'operator')
 * @return {Array} Array of query objects
 */
QueryBuilder.prototype.buildQuery = function(terms){
    let queryArray = [];
    let queryUnit = {AND:{},NOT:{}};
    let lastUnitIsOR = false;
    for(let term of terms){
        lastUnitIsOR = false;
        if(term.operator === this.BooleanOperator.AND){
            if(!queryUnit.AND[term.field]) {
                queryUnit.AND[term.field] = [];
            }
            queryUnit.AND[term.field].push(term.text.toLowerCase());
        }
        if(term.operator === this.BooleanOperator.NOT){
            if(!queryUnit.NOT[term.field]) {
                queryUnit.NOT[term.field] = [];
            }
            queryUnit.NOT[term.field].push(term.text.toLowerCase());
        }
        if(term.operator === this.BooleanOperator.OR){
            queryArray.push(queryUnit);
            queryUnit = {AND:{},NOT:{}};

            if(!queryUnit.AND[term.field]) {
                queryUnit.AND[term.field] = [];
            }
            queryUnit.AND[term.field].push(term.text.toLowerCase());

            lastUnitIsOR = true;
        }
    }

    queryArray.push(queryUnit);
    return queryArray;
}

module.exports = new QueryBuilder();
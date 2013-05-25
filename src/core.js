/**
 * Main JS class for this project.
 * Instantiating a JSWielder will trigger error protection and reporting.
 */
JSWielder = function() {
    this.init();
};

JSWielder.prototype.init = function() {
    this.protectAsyncFunctions();
};

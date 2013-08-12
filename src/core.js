//=============================================================================
// JS Error Wielder
// This file contains a bunch of util functions/classes to work with JS errors
//=============================================================================

/**
 * Custom onerror handler.
 * To use: window.onerror = JSErrorWielder.onerror;
 *
 * @param {string} message Error message, is a string is most browser, in most
 *     cases. HOWEVER, it can be an object in FFx when an event exception
 *     occurs.
 * @param {string} fileName File name in which the error occurred
 *     TODO: do all browsers have that filled in?
 *     TODO: what does that say when the error comes from an inline script?
 *     TODO: what does that tell us usually? What format?
 * @param {string} lineNumber Line number
 *     TODO: do all browsers have that filled in?
 *     TODO: what does that say when the error comes from an inline script?
 *     TODO: what does that tell us usually? What format?
 * @return {Boolean} true, always (that prevents the error from propagating.
 * You don't want that in production). Note: Chrome got that backwards at some
 * point: http://crbug.com/92062.
 */
JSErrorWielder.onerror = function(message, fileName, lineNumber) {
    var report = Serializer(window).fromTheDead(message, fileName, lineNumber);
    JSErrorWielder.Sender
    return true
};


/**
 * Class to handle live/dead error => report conversion.
 * A report is a serialized version of an error, containing as much information
 * as we can get to ease later debugging.
 * @param {Object} window Necessary global dependency on window, because our
 *     serializer needs to know about its environment to collect info.
 */
Serializer = function(window, undefined) {
    this.window = window;
};

Serializer.prototype.fromTheDead = function(message, fileName, lineNumber) {};
Serializer.prototype.fromException = function(exceptionObject) {};


/**
 * Class to send reports
 */
Sender = function() {};

/**
 * This is a straight copy/paste from https://gist.github.com/pamelafox/1878283
 * Having it sitting in this repo is just a personal convenience
 */
function sendError(message, url, lineNum) { 
    var i;
 
    // First check the URL and line number of the error
    url = url || window.location.href;
    lineNum = lineNum || 'None';
 
    // If the error is from these 3rd party script URLs, we ignore
    // We could also just ignore errors from all scripts that aren't our own
    var scriptURLs = [
      // Facebook flakiness
      'https://graph.facebook.com',
      // Facebook blocked
      'http://connect.facebook.net/en_US/all.js',
      // Woopra flakiness
      'http://eatdifferent.com.woopra-ns.com',
      'http://static.woopra.com/js/woopra.js',
      // Chrome extensions
      'extensions/',
      // Other (from plugins)
      'http://127.0.0.1:4001/isrunning', // Cacaoweb
      'http://webappstoolbarba.texthelp.com/',
      'http://metrics.itunes.apple.com.edgesuite.net/'
    ];
 
    for (i = 0; i < scriptURLs.length; i++) {
      if (url.indexOf(scriptURLs[i]) === 0) {
        return false;
      }
    }
 
    // Now figure out the actual error message
    // If it's an event, as triggered in several browsers
    if (message.target && message.type) {
      message = message.type;
    }
    if (!message.indexOf) {
      message = 'Non-string, non-event error: ' + (typeof message);
    }
 
    // If the error matches these, ignore.
    var errorsToIgnore = [
       // Random plugins/extensions
      'top.GLOBALS',
      'originalCreateNotification', // See: http://blog.errorception.com/2012/03/tale-of-unfindable-js-error.html
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'http://tt.epicplay.com',
      'Can\'t find variable: ZiteReader',
      'jigsaw is not defined',
      'ComboSearch is not defined',
      'http://loading.retry.widdit.com/',
      'atomicFindClose',
      // Facebook borked
      'fb_xd_fragment',
      // Probably comes from extensions: http://stackoverflow.com/questions/5913978/cryptic-script-error-reported-in-javascript-in-chrome-and-firefox
      'Script error.'
    ];
 
    for (i = 0; i < errorsToIgnore.length; i++) {
      if (message.indexOf(errorsToIgnore[i]) > -1) { 
        return false;
      }
    }
 
    // Otherwise, send the error and relevant information
    var error = 'JS Error: ' + message + ' URL: ' + url + ' Line: ' + lineNum;
    error += '\n Document URL: ' + document.URL;
    if (window.UserAgent) {
      var userAgent = new UserAgent();
      error += '\n Browser: ' + userAgent.browser_name + ' ' + userAgent.browser_version + ' | OS: ' + userAgent.os + ' | Platform: ' + userAgent.platform;
    }
    if (window.printStackTrace) {
      try {
          error += '\n Stacktrace: ' + printStackTrace().slice(4).join('\n -');
      } catch(e) {}
    }
    if (window.ED.CURRENT_USER) error += '\n User: ' + ED.CURRENT_USER.email + ' http://' + window.location.host + '/user/' + ED.CURRENT_USER.id; 
    ED.shared.sendData('log-error', 'error=' + error, function() {});
    return false;
  }

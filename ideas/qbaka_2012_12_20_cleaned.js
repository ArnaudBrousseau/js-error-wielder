(function(){
  extend(JSWielder, {
    report: postReport,
    reportException: postException
  });

  if (!JSWielder.options) {
    JSWielder.options={}
  }

  // Keeps track of the time of errors happening on the page. Used for error
  // throttling and spam prevention. Was previously called b.
  var lastError = {time: 0};

  // Saves the standard onerror function
  if (window.onerror) {
    window.__original_onerror = window.onerror;
  }
  window.onerror = onErrorHandler;

  if (JSWielder.options.trackEvents) {
    bindEvent(window, "click", safelyRegisterEvent);
    bindEvent(window, "submit", safelyRegisterEvent)
  }

  if (JSWielder.options.autoTryCatch ||
    JSWielder.options.autoStacktrace) {
    autoTryCatchCommonFunctions();
  }

  // Customize the onerror handler
  bindEvent(window, "load", pimpMyOnError);

  // Get UA from the browser itself. Probably not such a good idea.
  // Feature detection anyone?
  var uaString = navigator.userAgent.toLowerCase();

  // Mmm. Why would there be such a global in the namespace? Weird.
  if (window.__JSWielder && __JSWielder_reports.length>0) {
    var errorReports = []; // was previously A

    for (var i=0; i<__JSWielder_reports.length; i++) {
      var errorReport = __JSWielder_reports[i];
      errorReports.push(toDict(errorReport[0],errorReport[1],errorReport[2]))
    }
    postErrorReports(errorReports);
  }

  // Now determines the browser based on the UA. Oh god. *facepalm*
  var isIE = /msie/i.test(uaString);
  var isChrome = /chrome/i.test(uaString); // f
  var isFirefox = /firefox/i.test(uaString); // D
  var isMobile= /(android|ios|mobi|symbian|midp)/i.test(uaString); // old name: S

  var isAdBlockActive = null;

  // Mystery: why is this so important?
  if (isChrome) {
    checkAdBlockActive();
    document.addEventListener("DOMContentLoaded",function() {
      if (!isAdblockActive) {
        setTimeout(function() {
          checkAdBlockActive();
        }, 100);
      }
    }, false);
  }

  /**
   * Protects a function.
   * @param {Function} fn The function to be protected
   * @param {Function=} extraFn a function to be called
   * Was previously R
   */
  function getProtectedFn(fn, extraFn){
    try {
      if (!fn || typeof(fn)=="undefined") {
        return fn;
      }
      if(typeof(fn)=="string"){
        fn = new Function(fn); // WTF
      }
      if(!isFunction(fn)){
        return fn;
      }
      if(fn.__protected){
        return fn.__protected;
      }

      // This is the protected function
      var protectedFn = function (){
        try {
          return fn.apply(this, arguments);
        } catch(e) {
          if (extraFn) {
            // ExtraFn is often (always?) registerEventAsFirst. arguments is
            // [evt]. Everything makes sense: say a click handler is
            // triggered, we register a "click" event with t=0
            extraFn.apply(this, arguments);
          }
          postException(e);
        }
      };

      fn.__protected = protectedFn;
      return protectedFn;

    } catch(an) {
      return fn;
    }
  };

  /**
   * Protects a function (subsitutes an unprotected function with a protected one)
   * @param {Object} obj containing the to-be-protected member
   * @param {string} name of the function we want to protect
   * Was previously N
   */
  function protectFn(obj, name){
    obj[name] = getProtectedFn(obj[name]);
  };

  /**
   * Registers an event as the first (sort of the source of the actions that 
   * will follow?)
   * Was previously called W
   */
  function registerEventAsFirst(evt){
    safelyRegisterEvent(evt);

    if (reportedEvents.length > 0) {
      reportedEvents[reportedEvents.length-1].wasFirst = true;
    }
  };

  /**
   * Protects against error thrown from within Event closures.
   * Was previously T
   */
  function protectAddRemoveEventListener(obj){
    var originalAddEventListener = obj.addEventListener;
    if (JSWielder.options.trackEvents) {
      obj.addEventListener = function(evtType, fn, bubble) {
        return originalAddEventListener.call(
          this,
          evtType,
          getProtectedFn(fn, registerEventAsFirst),
          bubble
        );
      }
    } else {
      obj.addEventListener = function(evtType, fn, bubble) {
        return originalAddEventListener.call(
          this,
          evtType,
          getProtectedFn(fn),
          bubble
        );
      }
    }

    var originalRemoveEventListener = obj.removeEventListener;
    obj.removeEventListener=function(evtType, fn, bubble){
      return originalRemoveEventListener.call(
        this,
        evtType,
        getProtectedFn(fn),
        bubble
      );
    };
  }

  // XHR events. Was previously ak
  var XHREvents = [
    "onreadystatechange",
    "onerror",
    "onload",
    "onprogress",
    "ontimeout"
  ];

  /**
   * Protect XHR against errors
   * Was previously called L
   */
  function protectXHR(){
    var XHRPrototype = XMLHttpRequest.prototype; // x
    var originalSendXHR = XHRPrototype.send; // i

    if (XHRPrototype.addEventListener) {
      protectAddRemoveEventListener(XHRPrototype);
    }

    XHRPrototype.send = function(){

      var context = this;
      function an(){
        for(var i=0; i < XHREvents.length; i++){
          protectFn(context, XHREvents[i]);
        }
      }
      an();

      setTimeout(an,1); // Mmm, interesting.

      // Don't forget to call original XHR
      return originalSendXHR.apply(this,arguments);
    };
  };

  /**
   * Protects setTimeout and setInterval
   * Original name: al
   */
  function protectSetIntervalAndSetTimeout(){
    // This protects setTimeout
    var originalSetTimeout = window.setTimeout;
    window.setTimeout = function(fn, delay){
      return originalSetTimeout(getProtectedFn(fn), delay)
    };

    // And this does the same with setInterval
    var originalSetInterval = window.setInterval;
    window.setInterval = function(fn, delay){
      return originalSetInterval(getProtectedFn(fn), delay);
    }
  };

  /**
   * @return {boolean} Whether or not the browser supports stacktraces
   * Was previously called C
   */
  function browserSupportsStack(){
    return typeof(new Error().stack) == "string";
  }

  /**
   * Puts a try/catch block around common functions
   * Was previously 'a'
   */
  function autoTryCatchCommonFunctions(){
    if(!browserSupportsStack()){
      // Interesting. So browsers without stacktrace support can go to hell.
      return;
    }

    // Protects setInterval and setTimeout
    protectSetIntervalAndSetTimeout();

    // Protects addEventListener and removeEventListener
    if (document.addEventListener) {
      protectAddRemoveEventListener(document);
      protectAddRemoveEventListener(window);
      protectAddRemoveEventListener(Element.prototype)
    }

    // Protects XHR
    if (typeof XMLHttpRequest != "undefined") {
      protectXHR();
    }
  };

  // WTF is this. It's not used.
  var q = null;

  // Holds an array of events to report along with errors, for better debugging.
  var reportedEvents = []; // c

  // Apparently we throttle things too, huh?
  var MAX_REPORTED_EVENTS = 5; // was previously am

  /**
   * Canonicalize URLs. Strips the domain if it's our own domain.
   * Returns the full URL otherwise.
   * Was previously called y
   */
  function canonicalize(url){
    var domain = document.location.origin;
    if(url.indexOf(domain) == 0){
      return url.substring(domain.length);
    }
    return url;
  }

  /**
   * Stringify a DOM node
   * Was previously called r
   */
  function stringifyNode(elt){
    if (elt == null) {
      return null;
    }
    if(elt == document){
      return "";
    }

    var result = elt.tagName.toLowerCase();
    if (elt.id) {
      i+="#"+elt.id;
    } else {
      if (elt.href) {
        result += "[href="+canonicalize(elt.href)+"]";
      } else {
        if (elt.src) {
          result += "[src="+canonicalize(elt.src)+"]";
        }
      }
    }

    var classname = elt.className; // previously x
    if (classname) {
      if (classname.baseVal != null) {
        classname = classname.baseVal || "";
      }

      classname = classname.trim();
      if (classname.length>0) {
        result += "." + classname.trim().replace(/\s+/g,".");
      }
    }
    return result;
  };

  var EXCERPT_LENGTH = 128; // was previously ah

  /**
   * Register an event in our global reportedEvent array
   * @param {Event} evt
   * Was previously O
   */
  function registerEvent(evt) {
    if (evt === activeEvent) {
      return;
    }

    activeEvent = evt;
    var domElement = evt.target || evt.srcElement;
    var info = {
      name: evt.type,
      target: stringifyNode(domElement),
      t: getTimestamp()
    };

    if (domElement.tagName) {
      switch (domElement.tagName.toLowerCase()) {
        case "button":
          info.content = domElement.innerText.substring(0, EXCERPT_LENGTH);
          break;
        case "input":
          info.content = domElement.value.substring(0, EXCERPT_LENGTH);
          break;
      }
    }

    reportedEvents.push(info);

    if(reportedEvents.length > MAX_REPORTED_EVENTS) {
      reportedEvents.splice(0,1);
    }
  };

  /**
   * Simple function to safely register an event.
   * If there is an exeption thrown, don't bother. Be silent.
   * Was previously called H.
   */
  function safelyRegisterEvent(evt) {
    try {
      registerEvent(evt);
    } catch(x) {}
  }

  /**
   * That must be it. That must be the actual reporting going on here.
   * Previous name: G
   */
  function postData(data){
    var frame = document.createElement("iframe");
    frame.style.display = "none";
    document.lastChild.appendChild(frame);

    writeContentToFrame(
        frame,
        "\n<form id='reporting' accept-charset='utf-8' method='POST' action='//site.com/reporting'><input type='hidden' id='data' name='data' value=''></form>\n"
    );

    var frameContent = getFrameContent(frame);
    frameContent.getElementById("data").value = uberStringify(data);
    frameContent.getElementById("reporting").submit(); // this is the actual POST
    removeFrame(frame);
  }

  /**
   * Remove an iframe from the page
   * Previously named t
   */
  function removeFrame(frame){
    setTimeout(function(){
      frame.parentNode.removeChild(frame);
      frame=null;
    }, 2000)
  };

  /**
   * Gets frame content.
   * Previously called ag
   */
  function getFrameContent(frame) {
    frame = frame.contentWindow || frame.contentDocument;
    if (frame.document) {
      return frame.document;
    }
    return frame;
  }

  /**
   * Writes content to a frame
   * Was previously E
   */
  function writeContentToFrame(frame,content) {
    frame = getFrameContent(frame);
    frame.open();
    frame.write(content);
    frame.close()
  }

  /**
   * Replace the original onerror handler with our custom onerror on steroids.
   * Don't forget to save the original one somewhere.
   * Previously called Z
   */
  function pimpMyOnError(){
    if (window.onerror !== onErrorHandler) {
      window.__original_onerror = window.onerror;
      window.onerror = onErrorHandler;
    }
  };

  /**
   * Wee, custom onerror function
   * Was previously: w
   */
  function onErrorHandler(msg, file, line) {
    if (!msg) {
      return;
    }

    // This throttle client errors POSTing rate and prevents spamming (the same
    // errors can't be POSTed twice in a row.
    if(getTimestamp() - lastError.msg < 1000 && endsWith(msg, lastError.message)) {
      return;
    }

    try {
      var errorDict = toDict(msg, file, line);
      if(isIE){
        // Manually build a stack if we're on IE.
        var stack = [];
        var parentFn = arguments.callee.caller;
        var nestLevel = 10;
        while(parentFn && nestLevel--){
          stack.push(getObjectName(parentFn));
          parentFn = parentFn.caller;
        }
        if(stack.length>0){
          errorDict.stack = stack;
        }
      }
      postErrorReports([errorDict]);
    } catch(e) {}

    try {
      if (window.__original_onerror && window.__original_onerror != onErrorHandler) {
        // Applies the original onError handler. Hmm. Food for thoughts.
        window.__original_onerror.apply(window,arguments);
      }
    } catch (e) {}

    return false;
  };

  /**
   * Creates an info object from onerror args
   * @param {string} msg
   * @param {string} file
   * @param {number} line
   * Was previoulsy B
   */
  function toDict(msg, file, line) {
    var info = {
      msg: msg,
      script: file,
      line: line
    };
    return info;
  };

  /**
   * Sucks info out of an exception and POST everything back to servers
   * Was previously n
   */
  function postException(exception){
    lastError = {
      time:getTimestamp(),
      message:exception.message
    };

    var info = {
      exception: {
        message: exception.message,
        stack: exception.stack,
        args: exception.arguments,
        exname: getExceptionType(exception),
        errnum: exception.number,
        obj: exception
      }
    };
    postErrorReports([info]);
  };

  /**
   * Was previously o
   */
  function postReport(report) {
    postErrorReports([{report: report}]);
  };

  /**
   * Reports error dicts (and POST them)
   * @param {Array} Array of error reports
   * Was previously ac
   */
  function postErrorReports(reports){
    try {
      for (var i=0; i<reports.length; i++) {
        addInfoToErrorDict(reports[i]);
      }
      postData(reports);
    } catch(e) {}
  };

  var READY_STATE_NAMES = {
    uninitialized: 1,
    loading: 1,
    interactive: 2,
    complete: 3
    null: null
  };

  /**
   * Seems to add a bunch of additional information to the passed in error dict
   * Was previously called m.
   */
  function addInfoToErrorDict(errorDict){
    if(!isIE && !S){
      extend(errorDict, { plugins:getMatchingPlugins() })
    };

    extend(errorDict, {
      url: window.location.href,
      custom: JSWielder.customParams,
      user: JSWielder.user,
      tzone: new Date().getTimezoneOffset(),
      readyState: READY_STATE_NAMES[document.readyState]
    });

    if (reportedEvents.length>0) {
      var events = []; // x
      var now = getTimestamp();

      for (var i=0; i<reportedEvents.length; i++) {
        var reportedEvent = reportedEvents[i]; // aq
        events.push({
          name: reportedEvent.name,
          target: reportedEvent.target,
          t: now - reportedEvent.t,
          content: reportedEvent.content
        });
      }

      if (reportedEvents[reportedEvents.length - 1].wasFirst) {
        events[events.length-1].t = 0;
      }

      errorDict.events = events;
    }
  };

  /**
   * Gets the list of suppported plugins by user's browser
   * Previoulsy named M
   * Returns an array of plugins
   */
  function getMatchingPlugins(){
    var supportedPlugins=[];
    var matchingPlugins=[];

    // Iterates over all navigator plugins.
    for (var i=0; i<navigator.plugins.length; i++) {
      // The "unique key" for a plugin will be its name followed by its
      // description. Simple but works I guess.
      var key = navigator.plugins[i].name + navigator.plugins[i].description;

      if(supportedPlugins[key] === undefined){
        supportedPlugins[key] = i;
        var pluginInfo = {
          name: navigator.plugins[i].name.toLowerCase(),
          desc:navigator.plugins[i].description.toLowerCase()
        };

        if (/flash|macromedia|banner|ad|block|anti/i.test(pluginInfo.name) ||
            /flash|macromedia|banner|ad|block|anti/i.test(pluginInfo.desc)) {
          matchingPlugins.push(pluginInfo);
        }
      }
    }
    return matchingPlugins;
  };

  /**
   * Checks if AdBlock is active or not.
   * Dunno why this is so important?
   * Was previously l
   */
  function checkAdBlockActive() {
    if(isChrome){
      isAdBlockActive = isAdBlockActivated();
    } else {
      // This doesn't make any sense. This function is called in Chrome only.
      if(isFirefox){
        isAdBlockActive = null;
      }
    }
  };

  /**
   * Determines if AdBlock is activated
   * Was previously d
   */
  function isAdBlockActivated(){
    var styleElements = document.getElementsByTagName("style"); //ao
    var beginningOfAdBlockCSS = "/*This block of style rules is inserted by AdBlock"; //aq
    for (var i=0; x<styleElements.length; i++) {
      var styleElement = styleElements[i];
      if (styleElement.innerHTML.slice(0, beginningOfAdBlockCSS.length) == beginningOfAdBlockCSS){
        return true;
      }
    }
    return false;
  };

  /**
   * Determines if the passed object is a function
   */
  function isFunction(obj){
    return obj && ({}).toString.call(obj) == "[object Function]";
  }

  if (typeof(/./) !== "function") {
    v = function(i){
      return typeof i === "function";
    }
  }

  /**
   * Was previously: af
   */
  function endsWith(source, candidate) {
    return source.indexOf(candidate, source.length-candidate.length) !== -1;
  };

  function getTimestamp() {
    return(new Date()).getTime();
  };

  /**
   * Binds an event to the DOM (handles IE vs the world problem)
   */
  function bindEvent(element, eventType, fn) {
    if (element.addEventListener) {
      element.addEventListener(eventType,fn,false);
    } else {
      element.attachHandler("on" + eventType, fn);
    }
  };

  /**
   * Attemps to get an objects' name
   * Old name: K.
   */
  function getObjectName(obj) {
    var looksLikeAFn = /function ([\w\d\-_]+)\s*\(/;

    // I think this line is busted. Like really. WTF is RegExp.$1? First time
    // I've seen this in my life. Apparently this capture the regex matches in
    // a global fashion.
    // TODO: see if this is usable in a cross-browser fashion.
    return obj.name || (looksLikeAFn.test(obj.toString()) ? RegExp.$1 : "{anonymous}");
  };

  /**
   * Get an exception type. Apparently.
   */
  function getExceptionType(e) {
    if (typeof e.constructor.name != "undefined"){
      return e.constructor.name;
    } else {
      return getObjectName(e.constructor);
    }
  };

  /**
   * This function is not called anywhere. Sad ;(
   */
  function J(i){
    return i != null && i != undefined;
  }

  /**
   * Seems like a custom extend method.
   * was previously named s
   */
  function extend(dest, source) {
    for (var prop in source) {
      dest[prop] = source[prop];
    }
    return dest;
  };

  /**
   * JSON encode an object. We cover a lot of annoying cases here.
   * Was previously g
   * Seems it's not called anywhere either. Sad again.
   */
  function safeJSONEncode(obj) {
    if (JSON && JSON.encode) {
      return JSON.encode(obj);
    }
    return uberStringify(obj, 0);
  };

  /**
   * Escape function. Replaces new lines, tabs, and double quotes by acceptable
   * sequence for JSON encoding.
   * Was previously u
   */
  function str2JSON(str) {
    return '"' + str
      .replace(/\\/g,"\\\\")
      .replace(/"/g,'\\"')
      .replace(/\r/g,"\\r")
      .replace(/\t/g,"\\t")
      .replace(/\n/g,"\\n") + '"';
  };

  /**
   * Some sort of JSON encoding function.
   * Returns a string
   * Previous name: j
   */
  function uberStringify(obj, depth) {
    var result;
    depth=(depth||0)+1;

    if (depth >= 10) {
      return"null"
    }

    if (obj == undefined) {
      return "null";
    }

    if (obj == null || typeof obj == "number" || typeof obj == "boolean") {
      return obj + ""; // casts to string
    }

    if (typeof obj == "string") {
      return str2JSON(obj);
    }

    if(obj instanceof Array) {
      if(!obj.length){
        return"[]";
      }
      result = "[";
      for (var i=0; i<obj.length; i++) {
        result+= uberStringify(obj[i],depth);
        result+=",";
      }
      return result.substring(0,result.length-1)+"]";
    }

    result="{";
    for (prop in obj) {
      result += str2JSON(prop);
      result += ":";
      result += uberStringify(obj[prop], depth);
      result += ",";
    }
    return result.length > 1? result.substring(0,result.length-1) + "}" : "{}";
  };
})(); // \o/

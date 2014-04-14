(function (win) {
  "use awesome"; // wat.

  try {

    /**
     * Namespace to access some basic util functions
     */
    var util = function (f) {

      /**
       * Returns the current IE version as a number, or false.
       */
      function getIEVersion(userAgent) {
        userAgent = userAgent || navigator.userAgent;
        var tridentVersion = userAgent.match(/Trident\/([\d.]+)/);

        if (tridentVersion && tridentVersion[1] === "7.0") {
          // Trident 7.0 means IE11
          return 11;
        } else {
          var IEVersion = userAgent.match(/MSIE ([\d.]+)/);
          if (IEVersion) {
            return parseInt(userAgent[1], 10);
          } else {
            return false;
          }
        }
      }

      return {
        slice: Array.prototype.slice,

        /**
         * UUID generator. I'd imagine that's how error reports get grouped.
         */
        uuid: function () {
          return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var d = 16 * Math.random() | 0;

            if (c === "x") {
              return d.toString(16);
            } else {
              return (d & 3 | 8).toString(16);
            }
          })
        },

        /**
         * Basic serializer
         */
        reduce: function (obj) {
          try {
            if (typeof obj === "object" || typeof obj === "function") {
              return obj.toString();
            } else {
              return obj;
            }
          } catch (e) {
            return "unknown";
          }
        },

        /**
         * Delays a function execution until next tic
         */
        defer: function (fn, ctx) {
          setTimeout(function () {
            fn.apply(ctx)
          })
        },

        /**
         * Gives a string representing the current UTC time in ISO format
         */
        isoNow: function () {
          function to2Digits(num) {
            var numStr = String(num);
            if (numStr.length === 1) {
              numStr = "0" + numStr;
            }
            return numStr;
          }

          var date = new Date;
          return date.getUTCFullYear() +
            "-" + to2Digits(date.getUTCMonth() + 1) +
            "-" + to2Digits(date.getUTCDate()) +
            "T" + to2Digits(date.getUTCHours()) +
            ":" + to2Digits(date.getUTCMinutes()) +
            ":" + to2Digits(date.getUTCSeconds()) +
            "." + String((date.getUTCMilliseconds() / 1000).toFixed(3)).slice(2, 5) + "Z";
        },

        /**
         * Hey hey! Apparently we don't bother with IE7. Rad.
         */
        isBrowserIE: getIEVersion,
        isBrowserSupported: function (userAgent) {
          userAgent = userAgent || navigator.userAgent;
          var IEVersion = getIEVersion(userAgent);
          return !IEVersion || IEVersion > 8;
        },

        /**
         * Util contains method for arrays
         */
        contains: function (arr, key) {
          var i;
          for (i = 0; i < arr.length; i++) {
            if (arr[i] === key) {
              return true;
            }
          }
          return false;
        }
      }
    }(this);

    /**
     * Provides access to options/config
     */
    var jsTrackOptions = function (f) {
      var options = {
        endpoint: "https://my.trackjs.com/capture",
        cdnHost: "dl1d2m8ri9v3j.cloudfront.net",
        version: "1.2.4.0",
        trackGlobal: true,
        trackAjaxFail: true,
        trackConsoleError: true,
        inspectors: true,
        consoleDisplay: true,
        globalAlias: true,
        userId: undefined,
        sessionId: undefined,
        ignore: [],

        /**
         * Provides a function to override default options
         */
        mergeCustomerConfig: function (customerConfig) {
          if (customerConfig) {
            var overridableOptions = [
              "userId", "sessionId",
              "trackGlobal", "trackAjaxFail", "trackAjaxFail", "trackConsoleError",
              "inspectors", "consoleDisplay", "globalAlias", "ignore"];
            var i, override;

            for (i = 0; i < overridableOptions.length; i++) {
              overridableOption = overridableOptions[i];

              if (customerConfig[overridableOption] !== undefined) {
                options[overridableOption] = customerConfig[overridableOption];
              }
            }
          }
        },

        /**
         * TODO: see if that's the main entry point?
         */
        initialize: function () {
          if (win._trackJs) {
              options.mergeCustomerConfig(win._trackJs);
          }
          if (util.isBrowserIE()) {
              // Changes to protocol-relative URLs...why just for IE though?!
              options.endpoint = "//" + options.endpoint.split("://")[1];
          }
        }
      };
      return options;
    }(this);

    /**
     * TODO: find out what this is all about
     */
    jsTrack = function (globalWindow) {

      /**
       * TODO: figure out what this is for
       * Best guess: init a channel?
       */
      function e(channel, a) {
        logs[channel] || (logs[channel] = []);

        var uuid = util.uuid();

        logs[channel].push({
          key: uuid,
          value: a
        });

        if (logs[channel].length > 10) {
          logs[channel] = logs[channel].slice(Math.max(logs[channel].length - 10, 0));
        }

        return uuid;
      }

      function c(g, b, a) {
        function c(g, b) {
          var a = new globalWindow.XMLHttpRequest;
          if ("withCredentials" in a) {
            a.open(g, b);
            a.setRequestHeader("Content-Type", "text/plain");
          } else {
            if (typeof globalWindow.XDomainRequest !== undefined) {
            a = new globalWindow.XDomainRequest, a.open(g, b);
            } else {
              a = null;
            }
          }
          return a;
        };

        try {
          if (!m) {
            var l = c(g, b);
            l.onreadystatechange = function (g) {
              if (l.readyState === 4 && l.status !== 200) {
                m = true;
              }
            };
            l.tjs = undefined;
            l.send(JSON.stringify(a));
          }
        } catch (e) {
          m = true;
        }
      };

      /**
       * Throttle function
       * If there's more than 10 errors per sec, rate is limited and this
       * function starts returning true.
       */
      function throttle() {
        var now = (new Date).getTime();
        w++;

        if (reference + 1000 >= now) {
          reference = now;
          if (w > 10) {
            s++;
            return true;
          }
        } else {
          w = 0;
          reference = now;
        }
        return false;
      };

      /**
       * `s` is a module-level var which increases every time an error is sent
       */
      function getThrottledCount() {
        var g = s;
        s = 0;
        return g;
      };

      function transmit(entry, msg, file, line, col, stack) {
        report = {
          column: col,
          entry: entry,
          file: file,
          line: line,
          url: globalWindow.location.toString(),
          message: util.reduce(msg),
          stack: stack,
          timestamp: util.isoNow()
        };

        for (var moduleName in trackingModules) {
          if (trackingModules.hasOwnProperty(moduleName)) {
            module = trackingModules[moduleName];
            if (typeof module.onTransmit === "function") {
              report[moduleName] = module.onTransmit();
              return report[moduleName];
            } else {
              return false;
            }
          }
        }

        if (!throttle()) {
          var i, shouldBeIgnored;
          report.throttled = getThrottledCount();

          // First time in my life I've seen this construct. wat.
          a: {
            // Filters our errors to ignore
            for (i = 0; i < jsTrackOptions.ignore.length; i++) {
              if (jsTrackOptions.ignore[i] && jsTrackOptions.ignore[i].test && jsTrackOptions.ignore[i].test(report.message)) {
                // If we have a match at any point, ditch this error
                shouldBeIgnored = true;
                break a;
              }
             }
            shouldBeIgnored = false;
          }

          if (!shouldBeIgnored) {
            c("POST", jsTrackOptions.endpoint, report);
          }
        }
      };

      function a(g) {
        var a = util.slice.call(arguments, 1);
        var b;
        for (b in g) {
          if (typeof g[b] === "function") {
            if (!util.contains(a, b)) {
              (function () {
                var a = g[b];
                g[b] = function () {
                  try {
                    var g = util.slice.call(arguments, 0);
                    return a.apply(this, g);
                  } catch (e) {
                      transmitErrorObject("catch", e);
                      throw e;
                  }
                };
              }());
            }
          }
        }
      }

      /**
       * Initializes all modules
       */
      function l(modules) {
        for (var moduleName in modules) {
          if (modules.hasOwnProperty(moduleName)) {
            var module = modules[moduleName];
            if (typeof module.onInitialize === "function") {
              module.onInitialize();
            }
          }
        }
      };

      function transmitErrorObject(entry, e) {
        transmit(entry, e.message, e.fileName, e.lineNumber, undefined, e.stack)
      };

      var trackingModules = {};
      var logs = {};
      var m = false;
      var w = 0;
      var s = 0;
      var reference = (new Date).getTime();

      return {
        registerModule: function (a, b) {
          return a ? (trackingModules[a] = {
            onInitialize: b.onInitialize,
            onTransmit: b.onTransmit,
            forTest: b.forTest
          }, true) : false
        },
        getModule: function (a) {
          return trackingModules.hasOwnProperty(a) ? trackingModules[a] : false
        },
        addLogEntry: e,
        getLogEntry: function (a, b) {
          logs[a] || (logs[a] = []);
          for (var c = 0; c < logs[a].length; c++) {
            if (logs[a][c].key === b) {
              return logs[a][c].value;
            };
          }
          return false;
        },
        flushLog: function (a) {
          logs[a] || (logs[a] = []);
          for (var b = [], c = 0; c < logs[a].length; c++) {
            b.push(logs[a][c].value);
          }
          logs[a].length = 0;
          return b;
        },
        updateLogEntry: function (a, b, c) {
          logs[a] || (logs[a] = []);
          for (var l = 0; l < logs[a].length; l++) {
            if (b === logs[a][l].key) {
              logs[a][l].value = c;
              return true;
            }
          }
          return false
        },
        transmit: transmit,
        transmitErrorObject: transmitErrorObject,
        initialize: function () {
          jsTrackOptions.initialize();
          l(trackingModules);
          if (jsTrackOptions.trackGlobal && jsTrackOptions.inspectors) {
            globalWindow.onerror = function (a, b, c, l) {
              transmit("global", a, b, c, l);
            };
          }
          globalWindow.trackJs = {
            track: function (a) {
              if (Object.prototype.toString.call(a) === "[object Error]") {
                transmitErrorObject("direct", a);
              } else {
                transmit("direct", a);
              }
            },
            attempt: function (a, b) {
              try {
                var c = util.slice.call(arguments, 2);
                return a.apply(b || this, c)
              } catch (l) {
                throw transmitErrorObject("catch", l), l;
              }
            },
            watch: function (a, b) {
              return function () {
                try {
                  var c = util.slice.call(arguments, 0);
                  return a.apply(b || this, c)
                } catch (l) {
                  throw transmitErrorObject("catch", l), l;
                }
              }
            },
            watchAll: a,
            trackAll: a,
            configure: jsTrackOptions.mergeCustomerConfig,
            version: jsTrackOptions.version
          };
          var i, c = ["log", "debug", "info", "warn", "error"];
          for (i = 0; i < c.length; i++) {
            (function (a) {
              globalWindow.trackJs[a] = function () {
                var args = util.slice.call(arguments);
                e("c", {
                  timestamp: util.isoNow(),
                  severity: a,
                  message: util.reduce(args)
                });
                if (a === "error" && jsTrackOptions.trackConsoleError) {
                  if ("[object Error]" === Object.prototype.toString.call(args[0])) {
                    transmitErrorObject("console", args[0]);
                  } else {
                    transmit("console", util.reduce(args));
                  }
                }
              }
            })(c[i]);
          }
          jsTrackOptions.globalAlias && (globalWindow.track = globalWindow.trackJs.track)
        },
        forTest: {
          initializeModules: l,
          throttle: throttle,
          getThrottledCount: getThrottledCount,
          wrap: a
        }
      }
    }(this);

    /**
     * Network module
     */
    (function (globalWindow) {
      var maybeLog;

      /**
       * Utility to patch XDomain XMLHttpRequest "open" methods, which
       * signature is:
       * void open(
       *   DOMString method,
       *   DOMString url,
       *   optional boolean async,
       *   optional DOMString user,
       *   optional DOMString password
       * )
       * (source MDN)
       */
      function recordOpen(args, fn) {
        this.tjs = {
          method: args[0],
          url: args[1]
        };
        return fn.apply(this, args);
      }

      /**
       * Protects network-related functions
       */
      function protectNetworkFn(argsArray, fn) {

        /**
         * Maybe adds an entry to our network log
         */
        function maybeLog(obj) {
          if (obj.tjs) {
            var entry = jsTrack.getLogEntry("n", obj.tjs.logId);
            if (entry) {
              entry.completedOn = util.isoNow();
              entry.statusCode = obj.status;
              entry.statusText = obj.statusText;
              jsTrack.updateLogEntry("n", obj.tjs.logId, entry);
              obj.tjs = undefined;
            }
          }
        }

        /**
         * Logs bad AJAX response
         */
        function maybeLogResponse(resp) {
          if (jsTrackOptions.trackAjaxFail && resp.status >= 400) {
            jsTrack.transmit("ajax", resp.status + " " + resp.statusText);
          }
        };

        if (!this.tjs) {
          return fn.apply(this, argsArray);
        }

        /**
         * Initializes the log? Not sure.
         */
        this.tjs.logId = jsTrack.addLogEntry("n", {
          startedOn: util.isoNow(),
          method: this.tjs.method,
          url: this.tjs.url
        });

        if (globalWindow.ProgressEvent && this.addEventListener) {
          this.addEventListener("readystatechange", function (evt) {
            if (this.readyState === 4) {
              maybeLog(this);
            }
          }, true);
        }

        if (this.addEventListener) {
          /**
           * This case handles most of the browsers.
           * Whenever an element loads -- img, iframe, window(?) -- the
           * callback is patched to report failures.
           */
          this.addEventListener("load", function (evt) {
            maybeLog(this);
            maybeLogResponse(this);
          }, true);
        } else if (this.toString() === "[object XDomainRequest]") {
          /**
           * If we fall in this case we're in IE
           * XDomainRequest is IE's way to CORS (IE8 and up)
           * Instead of patching addEventListener we're patching onerror+onload
           */
          var originalOnload = this.onload;
          this.onload = function (evt) {
            maybeLog(this);
            if (typeof originalOnload === "function") {
              originalOnload.apply(this, arguments);
            };
          };

          var originalOnerror = this.onerror;
          this.onerror = function (evt) {
            maybeLog(this);
            if (typeof originalOnerror === "function") {
              originalOnerror.apply(this, arguments);
            }
          }
        } else {
          /**
           * If we don't have anything else to patch, patch onreadystatechange.
           * Note: didn't know onreadystatechange passed an argument when
           * called back. Something to investigate further but I'm not sure how
           * useful that is to be honest...
           */
          var originalOnreadystatechange = this.onreadystatechange;
          var protectedOnreadystatechange = function (evt) {
            if (this.readyState === 4) {
              maybeLog(this);
              maybeLogResponse(this);
            }
            if (typeof originalOnreadystatechange === "function") {
              originalOnreadystatechange.apply(this, arguments);
            }
          };
          this.onreadystatechange = protectedOnreadystatechange;

          util.defer(function () {
            if (this.onreadystatechange !== protectedOnreadystatechange) {
              originalOnreadystatechange = this.onreadystatechange;
              this.onreadystatechange = protectedOnreadystatechange;
            }
          }, this);
        }
        return fn.apply(this, argsArray);
      }

      jsTrack.registerModule("network", {
        onInitialize: function () {
          if (util.isBrowserSupported() && jsTrackOptions.inspectors) {

            /**
             * Patches XMLHttpRequest
             */
            var originalXMLHttpRequestOpen = globalWindow.XMLHttpRequest.prototype.open;
            var originalXMLHttpRequestSend = globalWindow.XMLHttpRequest.prototype.send;
            globalWindow.XMLHttpRequest.prototype.open = function () {
              var args = util.slice.call(arguments, 0);
              return recordOpen.call(this, args, originalXMLHttpRequestOpen);
            };
            globalWindow.XMLHttpRequest.prototype.send = function () {
              var args = util.slice.call(arguments, 0);
              return protectNetworkFn.call(this, args, originalXMLHttpRequestSend);
            };

            /**
             * Patches XDomainRequest
             */
            if (globalWindow.XDomainRequest) {
              var originalXDomainRequestOpen = globalWindow.XDomainRequest.prototype.open;
              var originalXDomainRequestSend = globalWindow.XDomainRequest.prototype.send;

              globalWindow.XDomainRequest.prototype.open = function () {
                var args = util.slice.call(arguments, 0);
                return recordOpen.call(this, args, originalXDomainRequestOpen);
              };

              globalWindow.XDomainRequest.prototype.send = function () {
                var args = util.slice.call(arguments, 0);
                return protectNetworkFn.call(this, args, originalXDomainRequestSend);
              }
            }
          }
        },
        onTransmit: function () {
          return jsTrack.flushLog("n");
        }
      });
    })(this);

    (function (f) {

      function getPatternForValue(val) {
        var EMAIL_REGEX = /^[a-z0-9!#$%&'*+=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
        var DATE_REGEX = /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/;
        var OTHER_DATE_REGEX = /^(\d{4}[\/\-](0?[1-9]|1[012])[\/\-]0?[1-9]|[12][0-9]|3[01])$/;
        var US_PHONE_REGEX = /^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/;

        if (val === "" || val === undefined) {
          return "empty";
        }
        if (EMAIL_REGEX.test(val)) {
          return "email";
        }
        if (DATE_REGEX.test(val) || OTHER_DATE_REGEX(val)) {
          return "date";
        }
        if (US_PHONE_REGEX.test(val)) {
          return "usphone";
        }
        if (/^\s*$/.test(val)) {
          return "whitespace";
        }
        if (/^\d*$/.test(val)) {
          return "numeric";
        }
        if (/^[a-zA-Z]*$/.test(val)) {
          return "alpha";
        }
        if (/^[a-zA-Z0-9]*$/.test(val)) {
          return "alphanumeric";
        }
        return "characters";
      };

      function serializeElement(elem, val, checked) {
        var attributes = {};
        var elemAttributes = elem.attributes;
        var i;

        for (i = 0; i < elemAttributes.length; i++) {
          if (elemAttributes[i].name.toLowerCase() !== "value") {
            attributes[elemAttributes[i].name] = elemAttributes[i].value;
          }
        }
        boundingRect = elem.getBoundingClientRect();

        var value = undefined;
        if (val) {
          value = {
            length: val.length,
            pattern: getPatternForValue(val),
            checked: checked
          };
        }

        return {
          tag: elem.tagName.toLowerCase(),
          attributes: attributes,
          position: {
            left: boundingRect.left,
            top: boundingRect.top,
            width: boundingRect.width,
            height: boundingRect.height
          },
          value: value
        };
      };

      /**
       * Checks that a given element:
       * - has a given tagName
       * - (optionally) has its type among given types
       */
      function elemHasTagAndTypes(elem, tagName, types) {
        // Checks for tagName
        if (elem.tagName.toLowerCase() !== tagName.toLowerCase()) {
          return false;
        }

        // Now check for type attributes, if we have any
        if (!types) {
          return true;
        }

        var elemType = (elem.getAttribute("type") || "").toLowerCase();
        for (i = 0; i < types.length; i++) {
          if (types[i] === elemType) {
            return true;
          }
        }

        return false;
      };

      function logInteraction(elem, evtType, value, checked) {
        jsTrack.addLogEntry("v", {
          timestamp: util.isoNow(),
          action: evtType,
          element: serializeElement(elem, value, checked)
        });
      };

      function onDocumentClicked(evt) {
        var elem = evt.target || document.elementFromPoint(evt.clientX, evt.clientY);
        if (elem && elem.tagName) {
          if (elemHasTagAndTypes(elem, "input", ["checkbox"])) {
            logInteraction(elem, "input", elem.value, elem.checked);
          }
          if (elemHasTagAndTypes(elem, "input", ["radio"])) {
            logInteraction(elem, "input", elem.value, elem.checked);
          }
          if (elemHasTagAndTypes(elem, "a") || elemHasTagAndTypes(elem, "button") || elemHasTagAndTypes(elem, "input", ["button", "submit"])) {
            logInteraction(elem, "click");
          }
        }
      };

      function onInputChanged(evt) {
        var elem = evt.target || document.elementFromPoint(evt.clientX, evt.clientY);
        if (elem && elem.tagName) {
          if (elemHasTagAndTypes(elem, "textarea")) {
            logInteraction(elem, "input", elem.value);
          }
          if (elemHasTagAndTypes(elem, "select")) {
            logInteraction(elem, "input", elem.options[elem.selectedIndex].value);
          }
          if (elemHasTagAndTypes(elem, "input") && !elemHasTagAndTypes(elem, "input", ["button", "submit", "hidden", "checkbox", "radio"])) {
            var elemType = (elem.getAttribute("type") || "").toLowerCase();

            // Nice touch, no PII logging, at least for passwords. Yay!
            logInteraction(elem, "input", elemType === "password" ? undefined : elem.value);
          }
        }
      };

      jsTrack.registerModule("visitor", {
        onInitialize: function () {
          if (jsTrackOptions.inspectors) {
            if (document.addEventListener) {
              document.addEventListener("click", onDocumentClicked, true);
              document.addEventListener("blur", onInputChanged, true);
            } else if (document.attachEvent) {
              document.attachEvent("onclick", onDocumentClicked);
              document.attachEvent("onfocusout", onInputChanged);
            }
          }
        },
        onTransmit: function () {
          return jsTrack.flushLog("v");
        },
        forTest: {
          onDocumentClicked: onDocumentClicked,
          onInputChanged: onInputChanged
        }
      });
    })(this);

    (function (f) {
      var beacon = {};

      function getCustomerToken() {
        if (f._trackJs && f._trackJs.customer) {
          return f._trackJs.customer;
        }
        var scripts = document.getElementsByTagName("script");
        return scripts[scripts.length - 1].getAttribute("data-customer");
      };

      function send(beacon) {
        if (beacon.token) {
          var img = new Image;
          setTimeout(function () {
            img.src = "//" + jsTrackOptions.cdnHost +
              "/usage.gif?customer=" + beacon.token +
              "&correlationId=" + beacon.correlationId +
              "&x=" + util.uuid();
          }, 0)
        }
      };

      jsTrack.registerModule("customer", {
        onInitialize: function () {
          beacon.token = getCustomerToken();

          // W. T. F.
          var UUID = document.cookie.replace(/(?:(?:^|.*;\s*)TJS\s*\=\s*([^;]*).*$)|^.*$/, "$1");

          if (!UUID) {
            UUID = util.uuid();
            // Woah. What a cookie.
            document.cookie = "TJS=" + UUID + "; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
          }
          beacon.correlationId = UUID;
          send(beacon);
        },
        onTransmit: function () {
          beacon.userId = jsTrackOptions.userId;
          beacon.sessionId = jsTrackOptions.sessionId;
          return beacon;
        },
        forTest: {
          getCustomerToken: getCustomerToken
        }
      })
    })(this);

    (function (f) {

      function listenToConsole(c, options) {
        var console = c || {};
        var e = console.log || function () {};
        var levels = ["log", "debug", "info", "warn", "error"];
        var i;

        for (i = 0; i < levels.length; i++) {
          (function (severity) {
            var c = console[severity] || e;
            console[severity] = function () {
              var b = util.slice.call(arguments);
              jsTrack.addLogEntry("c", {
                timestamp: util.isoNow(),
                severity: severity,
                message: util.reduce(b)
              });

              if (severity === "error" && options.trackConsoleError) {
                if (Object.prototype.toString.call(console[0]) === "[object Error]") {
                  jsTrack.transmitErrorObject("console", console[0]);
                } else {
                  jsTrack.transmit("console", util.reduce(console));
                }
              }

              if (options.consoleDisplay && typeof c === "function") {
                if (c.apply) {
                  c.apply(this, console);
                } else {
                  c(console);
                }
              }
            }
          })(levels[i]);
        }
        return console;
      }

      jsTrack.registerModule("console", {
        onInitialize: function () {
          if (jsTrackOptions.inspectors) {
            f.console = listenToConsole(f.console, jsTrackOptions);
          }
        },
        onTransmit: function () {
          return jsTrack.flushLog("c");
        },
        forTest: {
          listenToConsole: listenToConsole
        }
      });
    })(this);

    (function (f, win) {
      function getDependencies(win) {
        var prop, deps = {};

        if (win.jQuery && (win.jQuery.fn && win.jQuery.fn.jquery)) {
          deps.jQuery = win.jQuery.fn.jquery;
        }

        if (win.jQuery && (win.jQuery.ui && win.jQuery.ui.version)) {
          deps.jQueryUI = win.jQuery.ui.version;
        }

        if (win.angular && (win.angular.version && win.angular.version.full)) {
          deps.angular = win.angular.version.full;
        }

        /**
         * Blind iteration over other window property to catch other libraries
         * (that's assuming they have a "version"/i property set correctly)
         * This is probably not very useful, and hecka slow :/
         */
        for (prop in win) {
          if (prop !== "webkitStorageInfo") {
            try {
              if (win[prop]) {
                var version = win[prop].version || win[prop].Version || win[prop].VERSION;
                if (typeof version === "string") {
                  deps[prop] = version;
                }
              }
            } catch (e) {}
          }
        }
        return deps;
      }

      var now = (new Date).getTime();
      jsTrack.registerModule("environment", {
        onTransmit: function () {
          return {
            userAgent: win.navigator.userAgent,
            age: (new Date).getTime() - now,
            viewportHeight: document.documentElement.clientHeight,
            viewportWidth: document.documentElement.clientWidth,
            dependencies: getDependencies(win)
          }
        },
        forTest: {
          discoverDependencies: getDependencies
        }
      })
    })(this, win);

    jsTrack.initialize();

  } catch (e) {
    // If JSTrack fails to initialize
    jsTrack.transmit("tracker", e.message, e.fileName, e.lineNumber, undefined, e.stack);
  }
})(window);

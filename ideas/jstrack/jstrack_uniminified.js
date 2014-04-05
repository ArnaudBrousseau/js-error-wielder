(function (v) {
  "use awesome";
  try {
    var k = function (f) {
      function k(c) {
        c = c || navigator.userAgent;
        var d = c.match(/Trident\/([\d.]+)/);
        return d && "7.0" === d[1] ? 11 : (c = c.match(/MSIE ([\d.]+)/)) ? parseInt(c[1], 10) : !1
      }
      return {
        slice: Array.prototype.slice,
        uuid: function () {
          return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var d = 16 * Math.random() | 0;
            return ("x" == c ? d : d & 3 | 8).toString(16)
          })
        },
        reduce: function (c) {
          try {
            return "object" === typeof c || "function" === typeof c ? c.toString() : c
          } catch (d) {
            return "unknown"
          }
        },
        defer: function (c, d) {
          setTimeout(function () {
            c.apply(d)
          })
        },
        isoNow: function () {
          function c(b) {
            b = String(b);
            1 === b.length && (b = "0" + b);
            return b
          }
          var d = new Date;
          return d.getUTCFullYear() + "-" + c(d.getUTCMonth() + 1) + "-" + c(d.getUTCDate()) + "T" + c(d.getUTCHours()) + ":" + c(d.getUTCMinutes()) + ":" + c(d.getUTCSeconds()) + "." + String((d.getUTCMilliseconds() / 1E3).toFixed(3)).slice(2, 5) + "Z"
        },
        isBrowserIE: k,
        isBrowserSupported: function (c) {
          c = c || navigator.userAgent;
          c = k(c);
          return !c || 8 < c
        },
        contains: function (c, d) {
          var b;
          for (b = 0; b < c.length; b++)
            if (c[b] ===
              d) return !0;
          return !1
        }
      }
    }(this),
      n = function (f) {
        var e = {
          endpoint: "https://my.trackjs.com/capture",
          cdnHost: "dl1d2m8ri9v3j.cloudfront.net",
          version: "1.2.4.0",
          trackGlobal: !0,
          trackAjaxFail: !0,
          trackConsoleError: !0,
          inspectors: !0,
          consoleDisplay: !0,
          globalAlias: !0,
          userId: void 0,
          sessionId: void 0,
          ignore: [],
          mergeCustomerConfig: function (c) {
            if (c) {
              var d = "userId sessionId trackGlobal trackAjaxFail trackAjaxFail trackConsoleError inspectors consoleDisplay globalAlias ignore".split(" "),
                b, f;
              for (b = 0; b < d.length; b++) f = d[b],
              void 0 !== c[f] && (e[f] = c[f])
            }
          },
          initialize: function () {
            v._trackJs && e.mergeCustomerConfig(v._trackJs);
            k.isBrowserIE() && (e.endpoint = "//" + e.endpoint.split("://")[1])
          }
        };
        return e
      }(this),
      m = function (f) {
        function e(g, a) {
          h[g] || (h[g] = []);
          var b = k.uuid();
          h[g].push({
            key: b,
            value: a
          });
          10 < h[g].length && (h[g] = h[g].slice(Math.max(h[g].length - 10, 0)));
          return b
        }

        function c(g, b, a) {
          function c(g, b) {
            var a = new f.XMLHttpRequest;
            "withCredentials" in a ? (a.open(g, b), a.setRequestHeader("Content-Type", "text/plain")) : "undefined" !== typeof f.XDomainRequest ?
              (a = new f.XDomainRequest, a.open(g, b)) : a = null;
            return a
          }
          try {
            if (!m) {
              var l = c(g, b);
              l.onreadystatechange = function (g) {
                4 === l.readyState && 200 !== l.status && (m = !0)
              };
              l.tjs = void 0;
              l.send(JSON.stringify(a))
            }
          } catch (d) {
            m = !0
          }
        }

        function d() {
          var g = (new Date).getTime();
          w++;
          if (r + 1E3 >= g) {
            if (r = g, 10 < w) return s++, !0
          } else w = 0, r = g;
          return !1
        }

        function b() {
          var g = s;
          s = 0;
          return g
        }

        function p(g, a, l, h, q, p) {
          g = {
            column: q,
            entry: g,
            file: l,
            line: h,
            url: f.location.toString(),
            message: k.reduce(a),
            stack: p,
            timestamp: k.isoNow()
          };
          for (var e in t) t.hasOwnProperty(e) &&
            (a = t[e], "function" === typeof a.onTransmit && (g[e] = a.onTransmit()));
          if (!d()) {
            g.throttled = b();
            a: {
              for (e = 0; e < n.ignore.length; e++)
                if (n.ignore[e] && n.ignore[e].test && n.ignore[e].test(g.message)) {
                  e = !0;
                  break a
                }
              e = !1
            }
            e || c("POST", n.endpoint, g)
          }
        }

        function a(g) {
          var a = k.slice.call(arguments, 1),
            b;
          for (b in g) "function" === typeof g[b] && (k.contains(a, b) || function () {
            var a = g[b];
            g[b] = function () {
              try {
                var g = k.slice.call(arguments, 0);
                return a.apply(this, g)
              } catch (b) {
                throw q("catch", b), b;
              }
            }
          }())
        }

        function l(g) {
          for (var a in g)
            if (g.hasOwnProperty(a)) {
              var b =
                g[a];
              if ("function" === typeof b.onInitialize) b.onInitialize()
            }
        }

        function q(a, b) {
          p(a, b.message, b.fileName, b.lineNumber, void 0, b.stack)
        }
        var t = {}, h = {}, m = !1,
          w = 0,
          s = 0,
          r = (new Date).getTime();
        return {
          registerModule: function (a, b) {
            return a ? (t[a] = {
              onInitialize: b.onInitialize,
              onTransmit: b.onTransmit,
              forTest: b.forTest
            }, !0) : !1
          },
          getModule: function (a) {
            return t.hasOwnProperty(a) ? t[a] : !1
          },
          addLogEntry: e,
          getLogEntry: function (a, b) {
            h[a] || (h[a] = []);
            for (var c = 0; c < h[a].length; c++)
              if (h[a][c].key === b) return h[a][c].value;
            return !1
          },
          flushLog: function (a) {
            h[a] || (h[a] = []);
            for (var b = [], c = 0; c < h[a].length; c++) b.push(h[a][c].value);
            h[a].length = 0;
            return b
          },
          updateLogEntry: function (a, b, c) {
            h[a] || (h[a] = []);
            for (var l = 0; l < h[a].length; l++)
              if (h[a][l].key === b) return h[a][l].value = c, !0;
            return !1
          },
          transmit: p,
          transmitErrorObject: q,
          initialize: function () {
            n.initialize();
            l(t);
            n.trackGlobal && n.inspectors && (f.onerror = function (a, b, c, l) {
              p("global", a, b, c, l)
            });
            f.trackJs = {
              track: function (a) {
                "[object Error]" === Object.prototype.toString.call(a) ? q("direct", a) :
                  p("direct", a)
              },
              attempt: function (a, b) {
                try {
                  var c = k.slice.call(arguments, 2);
                  return a.apply(b || this, c)
                } catch (l) {
                  throw q("catch", l), l;
                }
              },
              watch: function (a, b) {
                return function () {
                  try {
                    var c = k.slice.call(arguments, 0);
                    return a.apply(b || this, c)
                  } catch (l) {
                    throw q("catch", l), l;
                  }
                }
              },
              watchAll: a,
              trackAll: a,
              configure: n.mergeCustomerConfig,
              version: n.version
            };
            var b, c = ["log", "debug", "info", "warn", "error"];
            for (b = 0; b < c.length; b++)(function (a) {
              f.trackJs[a] = function () {
                var b = k.slice.call(arguments);
                e("c", {
                  timestamp: k.isoNow(),
                  severity: a,
                  message: k.reduce(b)
                });
                "error" === a && n.trackConsoleError && ("[object Error]" === Object.prototype.toString.call(b[0]) ? q("console", b[0]) : p("console", k.reduce(b)))
              }
            })(c[b]);
            n.globalAlias && (f.track = f.trackJs.track)
          },
          forTest: {
            initializeModules: l,
            throttle: d,
            getThrottledCount: b,
            wrap: a
          }
        }
      }(this);
    (function (f) {
      var e, c, d, b;

      function p(a, b) {
        this.tjs = {
          method: a[0],
          url: a[1]
        };
        return b.apply(this, a)
      }

      function a(a, b) {
        function c(a) {
          if (a.tjs) {
            var b = m.getLogEntry("n", a.tjs.logId);
            b && (b.completedOn = k.isoNow(), b.statusCode =
              a.status, b.statusText = a.statusText, m.updateLogEntry("n", a.tjs.logId, b), a.tjs = void 0)
          }
        }

        function d(a) {
          n.trackAjaxFail && 400 <= a.status && m.transmit("ajax", a.status + " " + a.statusText)
        }
        if (!this.tjs) return b.apply(this, a);
        this.tjs.logId = m.addLogEntry("n", {
          startedOn: k.isoNow(),
          method: this.tjs.method,
          url: this.tjs.url
        });
        f.ProgressEvent && this.addEventListener && this.addEventListener("readystatechange", function (a) {
          4 === this.readyState && c(this)
        }, !0);
        if (this.addEventListener) this.addEventListener("load", function (a) {
          c(this);
          d(this)
        }, !0);
        else if ("[object XDomainRequest]" === this.toString()) {
          var e = this.onload;
          this.onload = function (a) {
            c(this);
            "function" === typeof e && e.apply(this, arguments)
          };
          var p = this.onerror;
          this.onerror = function (a) {
            c(this);
            "function" === typeof p && p.apply(this, arguments)
          }
        } else {
          var s = this.onreadystatechange,
            r = function (a) {
              4 === this.readyState && (c(this), d(this));
              "function" === typeof s && s.apply(this, arguments)
            };
          this.onreadystatechange = r;
          k.defer(function () {
            this.onreadystatechange !== r && (s = this.onreadystatechange,
              this.onreadystatechange = r)
          }, this)
        }
        return b.apply(this, a)
      }
      m.registerModule("network", {
        onInitialize: function () {
          k.isBrowserSupported() && n.inspectors && (d = f.XMLHttpRequest.prototype.open, b = f.XMLHttpRequest.prototype.send, f.XMLHttpRequest.prototype.open = function () {
            var a = k.slice.call(arguments, 0);
            return p.call(this, a, d)
          }, f.XMLHttpRequest.prototype.send = function () {
            var c = k.slice.call(arguments, 0);
            return a.call(this, c, b)
          }, f.XDomainRequest && (e = f.XDomainRequest.prototype.open, c = f.XDomainRequest.prototype.send,
            f.XDomainRequest.prototype.open = function () {
              var a = k.slice.call(arguments, 0);
              return p.call(this, a, e)
            }, f.XDomainRequest.prototype.send = function () {
              var b = k.slice.call(arguments, 0);
              return a.call(this, b, c)
            }))
        },
        onTransmit: function () {
          return m.flushLog("n")
        }
      })
    })(this);
    (function (f) {
      function e(a, b, c) {
        for (var d = {}, h = a.attributes, e = 0; e < h.length; e++) "value" !== h[e].name.toLowerCase() && (d[h[e].name] = h[e].value);
        h = a.getBoundingClientRect();
        return {
          tag: a.tagName.toLowerCase(),
          attributes: d,
          position: {
            left: h.left,
            top: h.top,
            width: h.width,
            height: h.height
          },
          value: b ? {
            length: b.length,
            pattern: "" === b || void 0 === b ? "empty" : /^[a-z0-9!#$%&'*+=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(b) ? "email" : /^(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[012])[\/\-]\d{4}$/.test(b) || /^(\d{4}[\/\-](0?[1-9]|1[012])[\/\-]0?[1-9]|[12][0-9]|3[01])$/.test(b) ? "date" : /^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/.test(b) ?
              "usphone" : /^\s*$/.test(b) ? "whitespace" : /^\d*$/.test(b) ? "numeric" : /^[a-zA-Z]*$/.test(b) ? "alpha" : /^[a-zA-Z0-9]*$/.test(b) ? "alphanumeric" : "characters",
            checked: c
          } : void 0
        }
      }

      function c(a, b, c) {
        if (a.tagName.toLowerCase() !== b.toLowerCase()) return !1;
        if (!c) return !0;
        a = (a.getAttribute("type") || "").toLowerCase();
        for (b = 0; b < c.length; b++)
          if (c[b] === a) return !0;
        return !1
      }

      function d(a, b, c, d) {
        m.addLogEntry("v", {
          timestamp: k.isoNow(),
          action: b,
          element: e(a, c, d)
        })
      }

      function b(a) {
        (a = a.target || document.elementFromPoint(a.clientX,
          a.clientY)) && a.tagName && (c(a, "input", ["checkbox"]) && d(a, "input", a.value, a.checked), c(a, "input", ["radio"]) && d(a, "input", a.value, a.checked), (c(a, "a") || c(a, "button") || c(a, "input", ["button", "submit"])) && d(a, "click"))
      }

      function p(a) {
        if ((a = a.target || document.elementFromPoint(a.clientX, a.clientY)) && a.tagName && (c(a, "textarea") && d(a, "input", a.value), c(a, "select") && d(a, "input", a.options[a.selectedIndex].value), c(a, "input") && !c(a, "input", ["button", "submit", "hidden", "checkbox", "radio"]))) {
          var b = (a.getAttribute("type") ||
            "").toLowerCase();
          d(a, "input", "password" === b ? void 0 : a.value)
        }
      }
      m.registerModule("visitor", {
        onInitialize: function () {
          n.inspectors && (document.addEventListener ? (document.addEventListener("click", b, !0), document.addEventListener("blur", p, !0)) : document.attachEvent && (document.attachEvent("onclick", b), document.attachEvent("onfocusout", p)))
        },
        onTransmit: function () {
          return m.flushLog("v")
        },
        forTest: {
          onDocumentClicked: b,
          onInputChanged: p
        }
      })
    })(this);
    (function (f) {
      function e() {
        if (f._trackJs && f._trackJs.customer) return f._trackJs.customer;
        var b = document.getElementsByTagName("script");
        return b[b.length - 1].getAttribute("data-customer")
      }

      function c(b) {
        if (b.token) {
          var c = new Image;
          setTimeout(function () {
            c.src = "//" + n.cdnHost + "/usage.gif?customer=" + b.token + "&correlationId=" + b.correlationId + "&x=" + k.uuid()
          }, 0)
        }
      }
      var d = {};
      m.registerModule("customer", {
        onInitialize: function () {
          d.token = e();
          var b = document.cookie.replace(/(?:(?:^|.*;\s*)TJS\s*\=\s*([^;]*).*$)|^.*$/, "$1");
          b || (b = k.uuid(), document.cookie = "TJS=" + b + "; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/");
          d.correlationId = b;
          c(d)
        },
        onTransmit: function () {
          d.userId = n.userId;
          d.sessionId = n.sessionId;
          return d
        },
        forTest: {
          getCustomerToken: e
        }
      })
    })(this);
    (function (f) {
      function e(c, d) {
        var b = c || {}, e = b.log || function () {}, a = ["log", "debug", "info", "warn", "error"],
          f;
        for (f = 0; f < a.length; f++)(function (a) {
          var c = b[a] || e;
          b[a] = function () {
            var b = k.slice.call(arguments);
            m.addLogEntry("c", {
              timestamp: k.isoNow(),
              severity: a,
              message: k.reduce(b)
            });
            "error" === a && d.trackConsoleError && ("[object Error]" === Object.prototype.toString.call(b[0]) ?
              m.transmitErrorObject("console", b[0]) : m.transmit("console", k.reduce(b)));
            d.consoleDisplay && "function" === typeof c && (c.apply ? c.apply(this, b) : c(b))
          }
        })(a[f]);
        return b
      }
      m.registerModule("console", {
        onInitialize: function () {
          n.inspectors && (f.console = e(f.console, n))
        },
        onTransmit: function () {
          return m.flushLog("c")
        },
        forTest: {
          listenToConsole: e
        }
      })
    })(this);
    (function (f, e) {
      function c(b) {
        var c, a = {};
        b.jQuery && (b.jQuery.fn && b.jQuery.fn.jquery) && (a.jQuery = b.jQuery.fn.jquery);
        b.jQuery && (b.jQuery.ui && b.jQuery.ui.version) &&
          (a.jQueryUI = b.jQuery.ui.version);
        b.angular && (b.angular.version && b.angular.version.full) && (a.angular = b.angular.version.full);
        for (c in b)
          if ("webkitStorageInfo" !== c) try {
            if (b[c]) {
              var d = b[c].version || b[c].Version || b[c].VERSION;
              "string" === typeof d && (a[c] = d)
            }
          } catch (e) {}
        return a
      }
      var d = (new Date).getTime();
      m.registerModule("environment", {
        onTransmit: function () {
          return {
            userAgent: e.navigator.userAgent,
            age: (new Date).getTime() - d,
            viewportHeight: document.documentElement.clientHeight,
            viewportWidth: document.documentElement.clientWidth,
            dependencies: c(e)
          }
        },
        forTest: {
          discoverDependencies: c
        }
      })
    })(this, v);
    m.initialize()
  } catch (u) {
    m.transmit("tracker", u.message, u.fileName, u.lineNumber, void 0, u.stack)
  }
})(window);

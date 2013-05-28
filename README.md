JavaScript Error Wielder
========================
This repo is aimed to be a set of tools and ideas about how one can handle
JavaScript errors efficiently, with confidence.

### Guidelines for good JavaScript Error wielding

##### Collect information
At least think about what could be useful when you get those errors back.
Think stacktraces (more about that later on), user agent information, version,
current URL, maybe some application specific things like sessions, user ID,
transaction ID, value of a cookie, local storage, who knows.

##### `try/catch` functions you want to protect
That seems like the most basic thing in the world but it's very important to do.
When you have a block of code protected that way, you can do whatever you want
in the catch block (retries, custom information collection, custom message,
etc). Very often that comes in handy when it's time to debug.

##### Protect global callback-attaching functions
Such as `attachEvent`, `addEventListener`, `setTimeout`, `requestAnimationFrame`, etc.
The gist of this is to substitute the original callback-attaching function
by a function that attaches "protected" callbacks instead (that is, callbacks
that are wrapped in a `try/catch` block).

For instance, let's have a look at how we protect `addEventListener`:

    // Keep a reference to the original function
    var original = Element.prototype.addEventListener;

    // Now do the substitution
    Element.prototype.addEventListener = function(type, fn, bubble) {
      original.call(this, type, function() {
        try {
            fn.apply(this, arguments);
        } catch (e) {
          // Do something useful with e. More about that later.
        }
      }, bubble);
    };

##### Exclude Plugin Errors
To be explained

##### Event tracking
To be explained

##### Build A Stacktrace
Closure library has neat tools around that. To be explained.

##### Last man standing: `window.onerror`
This should be your last resort option, for several reasons:
- you don't have the exception object as part of the onerror callback
- you can't obtain a stacktrace, because it's gone by the time the error
  bubbles up to the `onerror` handler.

    window.onerror = function(message, fileName, lineNumber) {
        // No clue what the original error was about. Good luck debugging!
    }


##### Control your error reporting rate.
Think about your users and implement some sort of error queue. At least limit
the rate at which errors can be posted.

If your error-reporting system POSTs an error every time an error occurs,
believe me your users will be pissed when they're stuck in a loop producing
errors.

### Ideas and inspiration
As you can see in the `ideas` directory, the ideas I lay down here aren't new.
I got most of them by looking at how people have approached that problem before.

Particularly:
- The [Qbaka][] folks
- [Errorception][]
- [Pamela Fox][]

[Qbaka]: http://qbaka.com/ "Qbaka"
[Errorception]: http://errorception.com/ "Errorception"
[Pamela Fox]: http://www.pamelafox.org/ "Pamela Fox"

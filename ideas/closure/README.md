### Google Closure Library, what's in it?

[Google Closure Library][] is a JS library used by Google in most of its
JavaScript-heavy projects. In this folder I dumped all of the
`goog.debug`-related things, because I think it's really interesting to read.

Below I go in details about which classes are interesting and why.

#### goog.debug.deepExpose, goog.debug.exposeArray et al.

Object and/or primitive serializers. Let's steal ideas there and reuse.

#### goog.debug.getFunctionName

Interesting concept for getting function names. Closure lets you provide a
`fnNameResolver`. Not exactly sure how it should be used, but it seems it's
useful in dev-like environment, and also pretty expensive (see line 450...regex
on source code, really?)

#### goog.debug.getStackTrace

Very interesting functions to get a stacktrace when `stack` property is not set
on the error object. It goes up the callstack by iterating on
`argments.callee.caller` and deals with stack depth problems. Definitely
something to reuse.

#### goog.debug.EntryPointMonitor

Not sure what's valuable here. This "monitor" approach seems pretty brittle and
only useful when debugging (code lives in `goog.debug` namespace so that's
probably acceptable).

#### goog.debug.Error

Mostly nothing. Interesting idea though: override the `name` property of the
Error's prototype to make custom error types. Why not.

#### goog.debug.ErrorHandler

This class is interesting because it introduces the idea of function
"protection". The idea is to substitute in-place a function by a "protected"
version of it. The protected version of a function, or "wrapped" version is: 1)
safe to execute, because is executes the original function in a try/catch block
and 2) easy to kill because the wrapped version keeps a reference to the
original function. Google puts an `__wrapper_FUNCTION_ID__` or
`__protected_FUNCTION_ID` property to know at runtime what version we're
looking at.

Now if we look at the actual function protection code, here are a couple of
interesting things to take away:
* Google uses `fn.apply(this, arguments)` to execute a function safely inside a
  try block, and `fn.call(this, fn, time)` to protect `setTimeout` and
  `setInterval`. I think `requestAnimationFrame` should be protected the same
  way. Also why not protect `addEventListener`/`attachEvent`?
* To differentiate errors reported from within protected function from errors
  thrown and caught some other way, Google appends a prefix to error messages.
  Probably a smart idea.

#### goog.debug.ErrorReporter

Pretty straightforward class to send errors. Technique here is to use XHR to
send the error back. Uses either `goog.debug.catchError` (implementation of
`window.onerror`) or goog.debug.ErrorHandler` (explicit protection of function
or callback-binding window primitives like `setTimeout`) to catch errors.
Again, I'm surprised that Google Closure doesn't provide `addEventListener`
protection out-of-the-box. Meh.

#### Misc things and bugs to keep in mind

* You could provide a `onerror` handler to something else than window
  apparently. (you can pass a target different than window to
  `goog.debug.catchErrors`)
* An error's filename can be found in `fileName`, `filename` or `sourceURL`
  (Safari uses that). A smart default is the current URL for filename. Duh, but
  I didn't think about it until now
* An error's line number can be found in the `lineNumber` or `line` property of
  the error object
* IE errors contain only `name` and `message`, which are apparently the only 2
  things that are reliably attached to any error object
* Chrome interprets onerror return value backwards (http://crbug.com/92062)
  until it was fixed in webkit revision r94061 (Webkit 535.3). See [Webkit
  bug]
* IE doesn't support .call for setInterval/setTimeout, but it also doesn't care
  what "this" is, so we can just call the original function directly
* Caught exceptions in IE don't provide line numbers
* `onerror` doesn't work in FFx2 or early Chrome

[Google Closure Library]: https://developers.google.com/closure/library/ "Google Closure Library"
[Webkit bug]: https://bugs.webkit.org/show_bug.cgi?id=67119 "Webkit bug"

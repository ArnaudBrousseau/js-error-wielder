### Qbaka, what's in it?
[Qbaka][] is a start-up offering who claims that it can "Collects and analyzes
JavaScript errors on your site. Smart way."
Since I was __really__ curious on how they do things, I downloading their
client-side reporting script and began un-minifying it. Turns out a few things
were interesting.

Open `qbaka_2012_12_20_cleaned.js` to see the un-minified, commented version
I'm talking about below.

##### Auto try/catch
One of the most fundamental ideas Qbaka has in its error protection script is
the notion of auto-protecting common callback-binding functions, such as
`addEventListener`, `setTimeout` or `setInterval`:

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

##### Event tracker
Nothing amazing to see there, but it's worth noting that Qbaka does
_something_. Very often, exceptions are triggered by a given user behavior, so
it's useful to know what users clicked on right before the exception happened.
Qbaka tracks `click`, `submit` and other events by the following snippets:

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

##### Stack builder
Reporting good stacktrace is important, even though on big websites they're
likely to be unusable (who doesn't minify their assets these days?).

Browsers have a `stack` or `stacktrace` property on their native `Error`
objects, so you can directly use those.

    // Manually build a stack if we're on IE.
    var stack = [];
    var parentFn = arguments.callee.caller;
    var nestLevel = 10;
    while(parentFn && nestLevel--){
      stack.push(getObjectName(parentFn));
      parentFn = parentFn.caller;
    }

##### Über stringifyer
To report JS errors, you need to have a way to reliably serializa information,
be it stacktraces, objects, strings, numbers, whatever. Here's Qbaka's stab at
it:

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

##### Iframe posts
Error reporting is not done through a standard XHR. They use iframe posts.
Totally legit choice. In fact, it probably saves the hassle of dealing with IE
compatibility wrt `XMLHTTPRequest` vs `ActiveXObject`. Wise.

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


[Qbaka]: http://qbaka.com/ "Qbaka"

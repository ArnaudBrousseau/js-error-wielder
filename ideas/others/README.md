### Pamela Fox's script, what's in it?
[Pamela Fox][] wrote a gist where there are a couple of interesting things. Namely:
* User agent parsing
* Stack trace printing
* The idea that certain errors shouldn't even be reported

Unfortunately the first two are not shown in this gist directly (`UserAgent`
class implementation is not shared with us, and `printStackTrace` seems magic.
Maybe it comes from Eric Wendelin's [javascript stacktrace][])?)

[Pamela Fox]: http://www.pamelafox.org/ "Pamela Fox"
[javascript stracktrace]: https://github.com/eriwen/javascript-stacktrace "Eric Wendelin's JavaScript stacktrace"

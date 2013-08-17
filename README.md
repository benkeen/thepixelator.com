# thepixelator.com

This is the repo for the standalone, downloadable version of [thepixelator.com](http://thepixelator.com).

The Pixelator is really nothing more than an excuse to play around with Canvas, a fun new(ish) HTML5 technology for
creating images on the fly with javascript. I'd spent a couple of evenings experimenting when a co-worker
sent me a link to DeSandro's amazing [http://close-pixelate.desandro.com/](Close-Pixelate) script. Wow. So awesome.
But the script cried out for a UI to let people construct their own patterns dynamically, and not have to wade through
code. For me, the fun lies in playing with it - finding what patterns work and what don't. So all I really did was slap
on a UI.

Most of it (the interesting bits!) are in the javascript, but there's a few chunks of PHP here and there which may be of
use to someone. The google shortener key in /code/get_short_url.php has been removed, as has the Google Analytics code.
Other than that, it's a carbon copy of the public site.

## Versions

### 1.0.0
The version currently running on the public site. This version is tagged (click on "tags"!)

### 1.1.0 (trunk)
A few more experiments I'm trying out. I was originally hoping to add in a "animate" option that would slowly change the sliders
at random speeds, however Canvas proved to be just too slow - I think I'll need to wait for WebGL for that. :)

This version also contains updates to all the various libraries etc. as well as having a new option to show the original picture.

Ben Keen
[@vancouverben](https://twitter.com/#!/vancouverben)
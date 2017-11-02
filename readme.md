JavaScript-autoComplete
===================

An extremely lightweight and powerful vanilla JavaScript completion suggester.

This is a fork of the original plugin developed by [Pixabay.com](https://pixabay.com/) and released under the MIT License: http://www.opensource.org/licenses/mit-license.php

The original version can be found at: https://github.com/Pixabay/JavaScript-autoComplete

This version is an adaptation specifically tailored for use by a modern Firefox/Chrome plugin. New features of ECMAScript 6 are used wherever possible.

## Changelog

### Date 02-11-2017
* prevent submitting a form when enter key is pressed to choose a suggestion

### Date 18-10-2017
* Change version to v2.0.0
* Mimic key/mouse-handling of standard Firefox autocomplete (down arrow or second mouse-click to trigger autocompletion)
* Remove mousedown eventhandler in destroy method
* Avoid using innerHTML assignment

### Date 17-10-2017
* Change version to v1.1.0
* Converted into a class
* Revert to using 'off' as attribute value for disabling autocomplete
* Added fieldName parameter to suggest method

### Date 14-10-2017
* changed minWidth to option, more variables renamed, ditch multibrowser support (support firefox and chrome)
* Display suggestion box on mousedown for an already focused element

### Date 13-10-2017
* Forked the 10-10-2016 v1.0.4 Pixabay version
* Added minimum width of 100px for the suggestion box
* Use 'false' as attribute value for disabling autocomplete
* Add touchstart event
* Variables renamed, prettified, missing semicolons added, changed var to const or let, use classList

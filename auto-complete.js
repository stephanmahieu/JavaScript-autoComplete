/*
    JavaScript autoComplete v1.1.0

    Forked: 13 oct 2017
    GitHub: https://github.com/stephanmahieu/JavaScript-autoComplete

    Original version:
    Copyright (c) 2014 Simon Steinberger / Pixabay
    GitHub : https://github.com/Pixabay/JavaScript-autoComplete
    License: http://www.opensource.org/licenses/mit-license.php

    Changes:
    13-10-2017
      - Forked the 10-10-2016 v1.0.4 Pixabay version
      - Added minimum width of 100px for the suggestion box
      - Use 'false' as attribute value for disabling autocomplete
      - Add touchstart event
      - Variables renamed, prettified, missing semicolons added, changed var to const or let, use classList
    14-10-2017
      - changed minWidth to option, more variables renamed, ditch multibrowser support (support firefox and chrome)
      - Display suggestion box on mousedown for an already focused element
    16-20-2017
      - Change version to v1.1.0
      - Revert to using 'off' as attribute value for disabling autocomplete
      - Added element parameter to suggest method
      - Removed alternative module support
*/

let autoComplete = (function(){
    // "use strict";
    function autoComplete(customOptions) {

        // helpers
        function addEvent(el, type, handler) {
            el.addEventListener(type, handler);
        }
        function removeEvent(el, type, handler) {
            el.removeEventListener(type, handler);
        }
        function live(elClass, eventType, cb, context){
            addEvent(context || document, eventType, event => {
                let found, el = event.target || event.srcElement;
                while (el && !(found = el.classList.contains(elClass))) {
                    el = el.parentElement;
                }
                if (found) {
                    cb.call(el, event);
                }
            });
        }

        const options = {
            selector: 0,
            source: 0,
            minChars: 3,
            delay: 150,
            offsetLeft: 0,
            offsetTop: 1,
            minWidth: 100,
            cache: 1,
            menuClass: '',
            renderItem: (item, search) => {
                // escape special characters
                search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
                return '<div class="autocomplete-suggestion" data-val="' + item + '">' + item.replace(re, "<b>$1</b>") + '</div>';
            },
            onSelect: (e, term, item) => {}
        };
        for (let k in customOptions) {
            // add custom options to defaultOptions
            if (customOptions.hasOwnProperty(k)) {
                options[k] = customOptions[k];
            }
        }

        // init
        const elems = typeof options.selector === 'object' ? [options.selector] : document.querySelectorAll(options.selector);
        elems.forEach(elem => {
            // create suggestions container "sc"
            elem.sc = document.createElement('div');
            elem.sc.classList.add('autocomplete-suggestions');
            if (options.menuClass) {
                elem.sc.classList.add(options.menuClass);
            }

            elem.autocompleteAttr = elem.getAttribute('autocomplete');
            elem.setAttribute('autocomplete', 'off');
            elem.cache = {};
            elem.last_val = '';

            elem.updateSC = (resize, next) => {
                const rect = elem.getBoundingClientRect();
                elem.sc.style.left = Math.round(rect.left + (window.pageXOffset || document.documentElement.scrollLeft) + options.offsetLeft) + 'px';
                elem.sc.style.top = Math.round(rect.bottom + (window.pageYOffset || document.documentElement.scrollTop) + options.offsetTop) + 'px';
                elem.sc.style.width = Math.max(options.minWidth, Math.round(rect.right - rect.left)) + 'px'; // outerWidth (SJM: minimum width 100px)
                if (!resize) {
                    elem.sc.style.display = 'block';
                    if (!elem.sc.maxHeight) {
                        elem.sc.maxHeight = parseInt((window.getComputedStyle ? getComputedStyle(elem.sc, null) : elem.sc.currentStyle).maxHeight);
                    }
                    if (!elem.sc.suggestionHeight) {
                        elem.sc.suggestionHeight = elem.sc.querySelector('.autocomplete-suggestion').offsetHeight;
                    }
                    if (elem.sc.suggestionHeight) {
                        if (!next) {
                            elem.sc.scrollTop = 0;
                        } else {
                            const scrTop = elem.sc.scrollTop, selTop = next.getBoundingClientRect().top - elem.sc.getBoundingClientRect().top;
                            if (selTop + elem.sc.suggestionHeight - elem.sc.maxHeight > 0) {
                                elem.sc.scrollTop = selTop + elem.sc.suggestionHeight + scrTop - elem.sc.maxHeight;
                            }
                            else if (selTop < 0) {
                                elem.sc.scrollTop = selTop + scrTop;
                            }
                        }
                    }
                }
            };
            addEvent(window, 'resize', elem.updateSC);
            document.body.appendChild(elem.sc);

            live('autocomplete-suggestion', 'mouseleave', () => {
                const sel = elem.sc.querySelector('.autocomplete-suggestion.selected');
                if (sel) {
                    setTimeout(()=>{ sel.classList.remove('selected'); }, 20);
                }
            }, elem.sc);

            live('autocomplete-suggestion', 'mouseover', function() {
                const sel = elem.sc.querySelector('.autocomplete-suggestion.selected');
                if (sel) {
                    sel.classList.remove('selected');
                }
                this.classList.add('selected');
            }, elem.sc);

            live('autocomplete-suggestion', 'mousedown', function(e) {
                if (this.classList.contains('autocomplete-suggestion')) { // else outside click
                    const v = this.getAttribute('data-val');
                    elem.value = v;
                    options.onSelect(e, v, this);
                    elem.sc.style.display = 'none';
                }
            }, elem.sc);

            live('autocomplete-suggestion', 'touchstart', function(e) {
                if (this.classList.contains('autocomplete-suggestion')) { // else outside touch
                    const v = this.getAttribute('data-val');
                    elem.value = v;
                    options.onSelect(e, v, this);
                    elem.sc.style.display = 'none';
                }
            }, elem.sc);

            elem.blurHandler = () => {
                let over_sb;
                try {
                    over_sb = document.querySelector('.autocomplete-suggestions:hover');
                } catch(e) {
                    over_sb = 0;
                }
                if (!over_sb) {
                    elem.last_val = elem.value;
                    elem.sc.style.display = 'none';
                    setTimeout(()=>{ elem.sc.style.display = 'none'; }, 350); // hide suggestions on fast input
                } else if (elem !== document.activeElement) {
                    setTimeout(()=>{ elem.focus(); }, 20);
                }
            };
            addEvent(elem, 'blur', elem.blurHandler);

            const suggest = data => {
                const val = elem.value;
                elem.cache[val] = data;
                if (data.length && val.length >= options.minChars) {
                    let s = '';
                    for (let i=0;i<data.length;i++) {
                        s += options.renderItem(data[i], val);
                    }
                    elem.sc.innerHTML = s;
                    elem.updateSC(0);
                }
                else {
                    elem.sc.style.display = 'none';
                }
            };

            elem.keydownHandler = event => {
                const key = window.event ? event.keyCode : event.which;
                // down (40), up (38)
                if ((key === 40 || key === 38) && elem.sc.innerHTML) {
                    let next, sel = elem.sc.querySelector('.autocomplete-suggestion.selected');
                    if (!sel) {
                        next = (key === 40) ? elem.sc.querySelector('.autocomplete-suggestion') : elem.sc.childNodes[elem.sc.childNodes.length - 1]; // first : last
                        next.classList.add('selected');
                        elem.value = next.getAttribute('data-val');
                    } else {
                        next = (key === 40) ? sel.nextSibling : sel.previousSibling;
                        if (next) {
                            sel.classList.remove('selected');
                            next.classList.add('selected');
                            elem.value = next.getAttribute('data-val');
                        }
                        else {
                            sel.classList.remove('selected');
                            elem.value = elem.last_val; next = 0;
                        }
                    }
                    elem.updateSC(0, next);
                    return false;
                }
                // esc
                else if (key === 27) {
                    elem.value = elem.last_val;
                    elem.sc.style.display = 'none';
                }
                // enter
                else if (key === 13 || key === 9) {
                    const sel = elem.sc.querySelector('.autocomplete-suggestion.selected');
                    if (sel && elem.sc.style.display !== 'none') {
                        options.onSelect(event, sel.getAttribute('data-val'), sel);
                        setTimeout(()=>{ elem.sc.style.display = 'none'; }, 20);
                    }
                }
            };
            addEvent(elem, 'keydown', elem.keydownHandler);

            elem.keyupHandler = event => {
                const key = window.event ? event.keyCode : event.which;
                if (!key || (key < 35 || key > 40) && key !== 13 && key !== 27) {
                    const val = elem.value;
                    if (val.length >= options.minChars) {
                        if (val !== elem.last_val) {
                            elem.last_val = val;
                            clearTimeout(elem.timer);
                            if (options.cache) {
                                if (val in elem.cache) {
                                    suggest(elem.cache[val]);
                                    return;
                                }
                                // no requests if previous suggestions were empty
                                for (let i=1; i<val.length-options.minChars; i++) {
                                    let part = val.slice(0, val.length-i);
                                    if (part in elem.cache && !elem.cache[part].length) {
                                        suggest([]);
                                        return;
                                    }
                                }
                            }
                            elem.timer = setTimeout(()=>{ options.source(val, elem, suggest) }, options.delay);
                        }
                    } else {
                        elem.last_val = val;
                        elem.sc.style.display = 'none';
                    }
                }
            };
            addEvent(elem, 'keyup', elem.keyupHandler);

            elem.focusHandler = event => {
                elem.last_val = '\n';
                elem.keyupHandler(event)
            };
            if (!options.minChars) {
                addEvent(elem, 'focus', elem.focusHandler);
            }

            elem.mouseDownHandler = event => {
                elem.last_val = '\n';
                elem.keyupHandler(event)
            };
            addEvent(elem, 'mousedown', elem.mouseDownHandler);
        });

        // public destroy method
        this.destroy = () => {
            elems.forEach(elem => {
                removeEvent(window, 'resize', elem.updateSC);
                removeEvent(elem, 'blur', elem.blurHandler);
                removeEvent(elem, 'focus', elem.focusHandler);
                removeEvent(elem, 'keydown', elem.keydownHandler);
                removeEvent(elem, 'keyup', elem.keyupHandler);
                if (elem.autocompleteAttr) {
                    elem.setAttribute('autocomplete', elem.autocompleteAttr);
                }
                else {
                    elem.removeAttribute('autocomplete');
                }
                document.body.removeChild(elem.sc);
                elem = null;
            });
        };
    }
    return autoComplete;
})();

(function(){
    window.autoComplete = autoComplete;
})();
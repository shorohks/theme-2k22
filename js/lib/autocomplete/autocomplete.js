// https://www.w3schools.com/howto/howto_js_autocomplete.asp

function autocomplete(inp, arr, options) {
  options = options || {};
  var currentFocus;

  inp.addEventListener("input", dropdown);
  inp.addEventListener("keydown", function(e) {
      var x = document.getElementById(this.id + "autocomplete-list");
      if (x) x = x.getElementsByTagName("div");
      if (e.keyCode == 40) {  // Down
        e.preventDefault();
        currentFocus++;
        addActive(x);
      } else if (e.keyCode == 38) {  // Up
        e.preventDefault();
        currentFocus--;
        addActive(x);
      } else if (e.keyCode == 13) {  // Enter
        e.preventDefault();
        if (currentFocus > -1) {
          if (x) {
            var clickEvent = document.createEvent('MouseEvents');
            clickEvent.initEvent('mousedown', true, true);
            x[currentFocus].dispatchEvent(clickEvent);
          }
        }
      } else if (e.keyCode == 27) {  // Esc
        e.preventDefault();
        e.target.blur();
      }
  });

  inp.addEventListener("blur", function(e) {
    closeAllLists();
    if (typeof options['onBlur'] !== 'undefined' && typeof options.onBlur === 'function') {
      options.onBlur();
    }
  });

  inp.addEventListener("focus", dropdown);

  /////////////////////////////////////////////////////////////////////////////////
  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }

  /////////////////////////////////////////////////////////////////////////////////
  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }

  /////////////////////////////////////////////////////////////////////////////////
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }

  /////////////////////////////////////////////////////////////////////////////////
  function dropdown(){
      var a, b, i, val = this.value;
      closeAllLists();
      if (!val) { return false;}
      currentFocus = -1;
      a = document.createElement("DIV");
      a.setAttribute("id", this.id + "autocomplete-list");
      a.setAttribute("class", "autocomplete-items");
      this.parentNode.appendChild(a);
      for (i = 0; i < arr.length; i++) {
        if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
          b = document.createElement("DIV");
          b.innerHTML = arr[i];
          b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
          b.addEventListener("mousedown", function(e) {
              e.preventDefault();
              inp.value = this.getElementsByTagName("input")[0].value;
              select(inp.value);
          });
          a.appendChild(b);
        }
      }
  }

  /////////////////////////////////////////////////////////////////////////////////
  function select(val) {
    closeAllLists();
    inp.blur();
    if (typeof options['onSelect'] !== 'undefined' && typeof options.onSelect === 'function') {
	  options.onSelect(val);
    }
  }

}


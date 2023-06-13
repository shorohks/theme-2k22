///////////////////////////////////////////////////////////////////
function getCookie(name) {
  var matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

////////////////////////////////////////////////////////////////////////////
function setCookie(name, val, permanent) {
  var today = new Date();
  var expr = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);
  var expire = permanent ? 'expires=' + expr.toGMTString() + '; ' : '';
  document.cookie = name + '=' + val + '; ' + expire + 'path=/; domain=.' + getCookieHost();
}

////////////////////////////////////////////////////////////////////////////
function clearCookie(name) {
  document.cookie = name + '=; Expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/; domain=.' + getCookieHost();
}

////////////////////////////////////////////////////////////////////////////
function getCookieHost() {
  var host = window.location.hostname;
  host = host.replace(/^www\./,'')
  return host;
}

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

////////////////////////////////////////////////////////////////////////////
function AJAXErrorMessage(jqXHR, exception) {
  if (jqXHR.status === 0) {
    return ('Нет сети или ошибка DNS');
  } else if (jqXHR.status == 404) {
    return ('Запрашиваемае действие недоступно на сервере [404]');
  } else if (jqXHR.status == 500) {
    return ('Внутренняя ошибка сервера [500]');
  } else if (exception === 'parsererror') {
    return ('Неверная структура ответа сервера (JSON is invalid)');
  } else if (exception === 'timeout') {
    return ('Превышен срок ожидания ответа сервера');
  } else if (exception === 'abort') {
    return ('Запрос прерван');
  } else if (exception.name === 'SyntaxError') {
    return ('Неверная структура ответа сервера (' + exception.message + ')');
  } else {
    return ('Неизвестная ошибка - ' + jqXHR.responseText);
  }
}

////////////////////////////////////////////////////////////////////////////
function errorMsg(msg) {
  alert('Ошибка: ' + msg);
}

if (!$) throw new Error('InteractiveDeliveryMap: jQuery not found');
if (!ymaps) throw new Error('InteractiveDeliveryMap: Yandex.Maps not found');

/////////////////////////////////////////////////////////////////////////////////////////////
// Конструктор экземпляра плагина
/////////////////////////////////////////////////////////////////////////////////////////////
function InteractiveDeliveryMap(options) {
  var defaults = {
    hash: '#map',
    clear_hash_on_startup: true,
    pickup_button: true,
    cargo: [],
    onPickupsReady: undefined,
    onCalcDeliveryFinish: undefined,
    onCalcDeliveryError: undefined,
    onCalcDeliveryAddressFound: undefined,
    onCalcPickupFinish: undefined,
    onCalcPickupError: undefined,
    onPickupSelect: undefined,
    onPickupCity: undefined,
    onPickupCityError: undefined,
  };
  this.options = $.extend({}, defaults, options);
  this.mapDelivery = undefined;
  this.address = undefined;
  this.placemark = undefined;
  this.delivery_areas = [];
  this.loadDeliveryJSON();
  this.lastAreaSign = undefined;
  this.cityPolygon = undefined;
  this.suburb_path = undefined;
  this.pickup_first_run = true;
  this.need_set_bounds = true;

  if (this.options.clear_hash_on_startup && location.hash == this.options.hash)
    history.replaceState(undefined, document.title, ' ');

  // Создаем DOM
  var template =
    '<div class="idm-modal-background">' +
    '  <div class="container idm-modal-container">' +
    '	<div class="idm-modal idm-spinner">' +
    '	  <div id="pickupMapContainer"></div>' +
    '	  <div id="deliveryMapContainer"></div>' +
    '	</div>' +
    '	<div class="idm-modal-close idm-modal-close-desktop">&times;</div>' +
    '  </div>' +
    '</div>' +
    '<div class="idm-modal-close idm-modal-close-mobile">&times;</div>';
  this.element = $(template).appendTo('body');


  $(window).on('hashchange', $.proxy(this.onHashChange, this));
  $('.idm-modal-close').on('click', $.proxy(this.close, this));
  $('.idm-modal-background').on('mousedown', $.proxy(this.onBackgroundClick, this));
  $(document).on('keyup', $.proxy(this.onKeyPress, this));

  $(this.element).find('.idm-modal > #pickupMapContainer').yadc({
    site_id: 2,
    height: '100%',
    //map_сenter: [lat, lon],
    auto_geolocation: true,
    mark_center: true,
    smart_zoom: false,
    manual_pvz_adding: true,
    geolocation_provider: 'auto',
    auto_open_custom_pickup: false,
    map_scale: 18,
    pickup_button: this.options.pickup_button,
    onReady: $.proxy(this.onYADCReady, this),
    onPickupSelect: $.proxy(this.onPickupSelectClick, this),
    cargo: this.options.cargo,
  });

}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.onHashChange = function() {
  if (location.hash == this.options.hash) {
    $('.idm-modal-background').addClass('active');
  } else if ($('.idm-modal-background').hasClass('active')) {
    $('.idm-modal-background').removeClass('active');
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.show = function() {
  if (location.hash != this.options.hash) {
    window.history.pushState({}, '', this.options.hash);
    this.onHashChange();
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.showDelivery = function(address, needCalc = true) {
  var instance = this;
  $(this.element).find('.idm-modal > div').hide();
  this.show();
  if (needCalc)
    instance.calcDelivery(address);
  else
    instance.displayDeliveryMap();
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.showPickup = function(pvz_id) {
  var instance = this;
  $(instance.element).find('.idm-modal > div').hide(0);
  instance.show();
  var el = $(instance.element).find('.idm-modal > #pickupMapContainer');
  setTimeout(function() {
    // Если первое открытие - добавляем ПВЗ в ObjectManager (долгая операция) пока в окне крутится спиннер
    if (instance.pickup_first_run) {
      el.yadc('addPVZToObjectManager');
      instance.pickup_first_run = false;
    }
    // Отображаем yadc
    el.show(0, function(){
      el.yadc('onMapSizeChange');
      if (instance.need_set_bounds) {
        setTimeout(function(){
          el.yadc('smartBounds');
          instance.need_set_bounds = false;
        }, 100);
      } else
        el.yadc('updateMap');
      if (pvz_id)
        el.yadc('openPVZBaloon', pvz_id);
      el.yadc('updateBalloon');
      el.yadc('updateList');
    });
  }, 100);
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.displayDeliveryMap = function() {
  $(this.element).find('.idm-modal > #deliveryMapContainer').show();
  if (this.mapDelivery !== undefined)
    this.mapDelivery.container.fitToViewport();
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.close = function() {
  if (location.hash == this.options.hash) {
    window.history.go(-1);
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.onBackgroundClick = function(e) {
  if ($(e.target).hasClass('idm-modal-background') || $(e.target).hasClass('idm-modal-container') ) {
    this.close();
    e.stopPropagation();
    e.preventDefault();
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.onKeyPress = function(e) {
  if ((e.key === "Escape") && ($('.idm-modal-background').hasClass('active')))
    this.close();
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.loadDeliveryJSON = function() {
  var instance = this;
  $.ajax({
    url: '/products/delivery.json',
    dataType: 'json',
  }).done(function(data) {
    instance.delivery_areas = data;
  }).fail(function(jqXHR, textStatus, errorThrown){
    console.log(errorThrown);
  });
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.setDeliveryMapCenter = function(coord) {
  if (this.mapDelivery === undefined) {
    var el = $(this.element).find('#deliveryMapContainer')[0];
    this.mapDelivery = new ymaps.Map(el, {center: coord, zoom: 17}, {suppressMapOpenBlock: true});
  } else
    this.mapDelivery.setCenter(coord);
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.setDeliveryPlacemark = function(coord, loc) {
  var preset = (loc !== undefined) ? 'islands#blueGovernmentIcon' : 'islands#redStretchyIcon';
  if (!this.placemark) {

    this.placemark = new ymaps.Placemark(coord, {
      hintContent: "Перетащите метку для уточнения адреса доставки",
      iconContent: "Нет доставки",
    }, {
      preset: preset,
      draggable: false
    });

    this.mapDelivery.geoObjects.add(this.placemark);

  } else {
    this.placemark.geometry.setCoordinates(coord);
    this.placemark.options.set('preset', preset);
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.getDeliveryGeoLocator = function(address) {
  // COMMENT LINE BELOW!!!!
  //return   ymaps.geocode([55.76, 37.64], {}); // Москва
  //return   ymaps.geocode([55.91842865097746, 37.67366708755087], {}); // Мытищи
  //return   ymaps.geocode([54.0503060853841, 58.02375854489996], {}); //Белорецк
  //return   ymaps.geocode([47.228639, 39.715958], {}); // Ростов-на-Дону
  //return   ymaps.geocode([54.0503060853841, 58.02375854489996], {}); // Белорецк
  //return   ymaps.geocode([62.912986115138374, 73.85093749999923], {}); // Ханты-манты
  //return   ymaps.geocode([63.80332624792426, 85.8040624999952], {}); // Красноярский край
  //return   ymaps.geocode([47.122093, 39.729562], {}); // Ростовская обл.
  //return   ymaps.geocode([59.797622, 30.639642], {}); // Ленинградская обл.
  //
  if (address === undefined || address === '')
    return ymaps.geolocation.get({provider: 'auto',});
  else
    return ymaps.geocode(address);
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.findDeliveryLocation = function(addr, coord) {
  var instance = this;
  for (var i = 0; i < instance.delivery_areas.length; i++) {
    if (addr.toLowerCase().indexOf(instance.delivery_areas[i].sign.toLowerCase()) >= 0) {
      return i;
    }
  };
  return undefined;
}

/////////////////////////////////////////////////////////////////////////////////////////////
//  Рассчёт стоимости доставки до адреса
/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.calcDelivery = function(address, force = false) {

  // Если адрес не поменялся, нечего делать
  if (this.address !== undefined && address == this.address && !force) {
    this.displayDeliveryMap();
    this.calcDeliveryFinish();
    return;
  }

  var instance = this;
  $(instance.element).find('.idm-modal > #deliveryMapContainer').hide();

  // Уничтожаем ранее пролаженный маршрут
  if (instance.suburb_path) {
    instance.mapDelivery.geoObjects.remove(instance.suburb_path);
    instance.suburb_path = undefined;
  }

  instance.getDeliveryGeoLocator(address).then(function(result) {

    if (result.geoObjects.getLength() == 0)
      instance.calcDeliveryError("Could not geolocate '" + address + "'");

    var coord = result.geoObjects.get(0).geometry.getCoordinates();
    var addr = result.geoObjects.get(0).properties.get('text');
    latitude = coord[0];
    longitude = coord[1];
    //getCity(coord[0], coord[1]);
    //getDelivery(coord[0], coord[1], addr);

    // Оповещаем о нахождении адреса, если геолоцировали без адреса
    if (address === undefined || address == '') {
      if (instance.options.onCalcDeliveryAddressFound) {
        res = instance.options.onCalcDeliveryAddressFound(addr, coord);
        // Нам вернули обработанный адрес?
        if (res !== undefined && typeof res === 'string')
          address = res;
        else
          address = addr;
      } else {
        address = addr;
      }
    }

    instance.setDeliveryMapCenter(coord);
    instance.displayDeliveryMap();

    // Ищем по JSON-файлу регион доставки
    var loc = instance.findDeliveryLocation(addr, coord);
    if (loc === undefined) {
      // Нет доставки
      instance.calcDeliveryFinish(-1);
    } else if (instance.delivery_areas[loc].city) {
      // Доставка по городу
      instance.calcDeliveryFinish(0);
      instance.removeCityPolygon();
    } else {
      // Доставка за город
      instance.calcSuburbDistance(coord, instance.delivery_areas[loc].city_center, instance.delivery_areas[loc].city_area, instance.delivery_areas[loc].sign);
    }

    instance.setDeliveryPlacemark(coord, loc);

    instance.address = address;

  }, function(err) {
    // Ошибка геолокации
    instance.calcDeliveryError(err.message);
  });
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.calcSuburbDistance = function(userCoord, cityCenterCoord, cityArea, areaSign, callback) {
    var instance = this;
    // Создаем полигон с границами города и наносим на карту.
    // Без нанесения на карту многие функции работать не будут
    if (instance.lastAreaSign !== areaSign) {
      instance.removeCityPolygon();
      instance.cityPolygon = new ymaps.Polygon([cityArea]);
      instance.lastAreaSign = areaSign;
      //cityPolygon.options.set('visible', false);
      instance.mapDelivery.geoObjects.add(instance.cityPolygon);
    }

    // Строим маршрут от центра города до пользователя
    ymaps.route([cityCenterCoord, userCoord], {avoidTrafficJams: false, multiRoute: true, results: 10, reverseGeocoding: false}).then(function (multiroute){

      var dist, min_dist, route;
      multiroute.getRoutes().each(function(r) {
        dist = r.getPaths().get(0).properties.get("distance").value;
        if (min_dist === undefined || min_dist > dist) {
          min_dist = dist;
          route = r;
        }
      });

      //var coodinates = route.getPaths().get(0).geometry.getCoordinates();
      var coodinates = route.getPaths().get(0).properties.get("coordinates");

      var points = coodinates.filter(function (el, i, arr) {
        return robustPointInPolygon(cityArea, el) > 0;
      });

      instance.suburb_path = new ymaps.Polyline(points, {}, {strokeColor: '#7ed83f', strokeWidth: 5});
      instance.mapDelivery.geoObjects.add(instance.suburb_path);

      dist = instance.suburb_path.geometry.getDistance();
      instance.calcDeliveryFinish(1, dist);

    }, function (error){
      // Ошибка при построении маршрута
      instance.calcDeliveryError(error.message);
    });
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.removeCityPolygon = function() {
  if (this.cityPolygon !== undefined) {
    this.mapDelivery.geoObjects.remove(this.cityPolygon);
    this.cityPolygon = undefined;
    this.lastAreaSign = undefined;
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.calcDeliveryError = function(err) {
  if (this.options.onCalcDeliveryError) {
    this.options.onCalcDeliveryError(err);
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.calcDeliveryFinish = function(delivery_location, distance) {
  if (this.options.onCalcDeliveryFinish) {
    this.options.onCalcDeliveryFinish(delivery_location, distance);
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.onPickupSelectClick = function(pvz) {
  if (this.options.onPickupSelect) {
    this.options.onPickupSelect(pvz);
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.setCargo = function(cargo) {
  var instance = this;

  instance.options.cargo = cargo;

  el = $(instance.element).find('.idm-modal > #pickupMapContainer');
  if ($.data(el[0], 'yadc'))
    el.yadc('setCargo', cargo);
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.calculatePickupPrice = function(pvz_id, cargo) {
  var instance = this;
  $.ajax({
    url: '//api.yadc-js.ru/calculate.json',
    type: 'POST',
    cache: false,
    data: {
      'site_id': 2,
      'pickup_id': pvz_id,
      'cargo': JSON.stringify(cargo || instance.cargo),
    },
    dataType: 'json',
  }).done(function(data) {
    if (instance.options.onCalcPickupFinish) {
      instance.options.onCalcPickupFinish(data.price);
    }
  }).fail(function (jqXHR, textStatus) {
    console.log('Error calculatePickupPrice() - ' + textStatus);
    if (instance.options.onCalcPickupError) {
      instance.options.onCalcPickupError(textStatus);
    }
  });
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.onYADCReady = function() {
  if (this.options.onPickupsReady) {
    this.options.onPickupsReady();
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.getPickupCityByCoord = function(coord, cargo) {
  var instance = this;
  $.ajax({
    url: '//api.yadc-js.ru/city.json',
    type: 'POST',
    cache: false,
	dataType: 'json',
    data: {
      'site_id': 2,
      'latitude': coord[0],
      'longitude': coord[1],
      'cargo': JSON.stringify([cargo || {}]),
    },
    }).done(function(data) {
      if (instance.options.onPickupCity)
        instance.options.onPickupCity(data);
    }).fail(function(){
      if (instance.options.onPickupCityError)
        instance.options.onPickupCityError();
    });
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.getCityPickups = function(city, cargo) {
  var instance = this;

  // Определяем координаты города
  instance.getDeliveryGeoLocator(city).then(function(result) {

    if (result.geoObjects.getLength() == 0)
      instance.calcDeliveryError("Could not geolocate '" + address + "'");

    var coord = result.geoObjects.get(0).geometry.getCoordinates();
    var el = $(instance.element).find('.idm-modal > #pickupMapContainer');
    el.yadc('setMapCenter', coord, 18);
    instance.need_set_bounds = true;
  }, function(err) {
    // Ошибка геолокации
  });

  // Запршиваем сколько ПВЗ в городе и стоимость выдачи
  $.ajax({
    url: '//api.yadc-js.ru/city.json',
    type: 'POST',
    cache: false,
	dataType: 'json',
    data: {
      'site_id': 2,
      'city': city,
      'cargo': JSON.stringify([cargo || {}]),
    },
    }).done(function(data) {
      if (instance.options.onPickupCity)
        instance.options.onPickupCity(data);
    }).fail(function(){
      if (instance.options.onPickupCityError)
        instance.options.onPickupCityError();
    });
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.getPickupCitiesList = function() {
  var instance = this;
  $.ajax({
    url: '//api.yadc-js.ru/cities.json',
    type: 'POST',
    cache: false,
	dataType: 'json',
    data: {
      site_id: 2,
    },
    }).done(function(data) {
      if (instance.options.onPickupCitiesList)
        instance.options.onPickupCitiesList(data);
    }).fail(function(){
      if (instance.options.onPickupCitiesListError)
        instance.options.onPickupCitiesListtError();
    });
}

/////////////////////////////////////////////////////////////////////////
//   Taken from https://github.com/mikolalysenko/robust-point-in-polygon
/////////////////////////////////////////////////////////////////////////
function robustPointInPolygon(vs, point) {
  var x = point[0]
  var y = point[1]
  var n = vs.length
  var inside = 1
  var lim = n
  for(var i = 0, j = n-1; i<lim; j=i++) {
    var a = vs[i]
    var b = vs[j]
    var yi = a[1]
    var yj = b[1]
    if(yj < yi) {
      if(yj < y && y < yi) {
        var s = orient(a, b, point)
        if(s === 0) {
          return 0
        } else {
          inside ^= (0 < s)|0
        }
      } else if(y === yi) {
        var c = vs[(i+1)%n]
        var yk = c[1]
        if(yi < yk) {
          var s = orient(a, b, point)
          if(s === 0) {
            return 0
          } else {
            inside ^= (0 < s)|0
          }
        }
      }
    } else if(yi < yj) {
      if(yi < y && y < yj) {
        var s = orient(a, b, point)
        if(s === 0) {
          return 0
        } else {
          inside ^= (s < 0)|0
        }
      } else if(y === yi) {
        var c = vs[(i+1)%n]
        var yk = c[1]
        if(yk < yi) {
          var s = orient(a, b, point)
          if(s === 0) {
            return 0
          } else {
            inside ^= (s < 0)|0
          }
        }
      }
    } else if(y === yi) {
      var x0 = Math.min(a[0], b[0])
      var x1 = Math.max(a[0], b[0])
      if(i === 0) {
        while(j>0) {
          var k = (j+n-1)%n
          var p = vs[k]
          if(p[1] !== y) {
            break
          }
          var px = p[0]
          x0 = Math.min(x0, px)
          x1 = Math.max(x1, px)
          j = k
        }
        if(j === 0) {
          if(x0 <= x && x <= x1) {
            return 0
          }
          return 1
        }
        lim = j+1
      }
      var y0 = vs[(j+n-1)%n][1]
      while(i+1<lim) {
        var p = vs[i+1]
        if(p[1] !== y) {
          break
        }
        var px = p[0]
        x0 = Math.min(x0, px)
        x1 = Math.max(x1, px)
        i += 1
      }
      if(x0 <= x && x <= x1) {
        return 0
      }
      var y1 = vs[(i+1)%n][1]
      if(x < x0 && (y0 < y !== y1 < y)) {
        inside ^= 1
      }
    }
  }
  return 2 * inside - 1
}

/////////////////////////////////////////////////////////////////////////
var EPSILON     = 1.1102230246251565e-16
var ERRBOUND3   = (3.0 + 16.0 * EPSILON) * EPSILON

function orient(a, b, c) {
    var l = (a[1] - c[1]) * (b[0] - c[0])
    var r = (a[0] - c[0]) * (b[1] - c[1])
    var det = l - r
    var s
    if(l > 0) {
      if(r <= 0) {
        return det
      } else {
        s = l + r
      }
    } else if(l < 0) {
      if(r >= 0) {
        return det
      } else {
        s = -(l + r)
      }
    } else {
      return det
    }
    var tol = ERRBOUND3 * s
    if(det >= tol || det <= -tol) {
      return det
    }
    return orientation3Exact(a, b, c)
}

/////////////////////////////////////////////////////////////////////////
function orientation3Exact(m0, m1, m2) {
    var p = linearExpansionSum(linearExpansionSum(twoProduct(m1[1], m2[0]), twoProduct(-m2[1], m1[0])), linearExpansionSum(twoProduct(m0[1], m1[0]), twoProduct(-m1[1], m0[0])))
    var n = linearExpansionSum(twoProduct(m0[1], m2[0]), twoProduct(-m2[1], m0[0]))
    var d = robustSubtract(p, n)
    return d[d.length - 1]
  }

//Easy case: Add two scalars
function scalarScalar(a, b) {
  var x = a + b
  var bv = x - a
  var av = x - bv
  var br = b - bv
  var ar = a - av
  var y = ar + br
  if(y) {
    return [y, x]
  }
  return [x]
}

function linearExpansionSum(e, f) {
  var ne = e.length|0
  var nf = f.length|0
  if(ne === 1 && nf === 1) {
    return scalarScalar(e[0], f[0])
  }
  var n = ne + nf
  var g = new Array(n)
  var count = 0
  var eptr = 0
  var fptr = 0
  var abs = Math.abs
  var ei = e[eptr]
  var ea = abs(ei)
  var fi = f[fptr]
  var fa = abs(fi)
  var a, b
  if(ea < fa) {
    b = ei
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
      ea = abs(ei)
    }
  } else {
    b = fi
    fptr += 1
    if(fptr < nf) {
      fi = f[fptr]
      fa = abs(fi)
    }
  }
  if((eptr < ne && ea < fa) || (fptr >= nf)) {
    a = ei
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
      ea = abs(ei)
    }
  } else {
    a = fi
    fptr += 1
    if(fptr < nf) {
      fi = f[fptr]
      fa = abs(fi)
    }
  }
  var x = a + b
  var bv = x - a
  var y = b - bv
  var q0 = y
  var q1 = x
  var _x, _bv, _av, _br, _ar
  while(eptr < ne && fptr < nf) {
    if(ea < fa) {
      a = ei
      eptr += 1
      if(eptr < ne) {
        ei = e[eptr]
        ea = abs(ei)
      }
    } else {
      a = fi
      fptr += 1
      if(fptr < nf) {
        fi = f[fptr]
        fa = abs(fi)
      }
    }
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    }
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
  }
  while(eptr < ne) {
    a = ei
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    }
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
    }
  }
  while(fptr < nf) {
    a = fi
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    }
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
    fptr += 1
    if(fptr < nf) {
      fi = f[fptr]
    }
  }
  if(q0) {
    g[count++] = q0
  }
  if(q1) {
    g[count++] = q1
  }
  if(!count) {
    g[count++] = 0.0
  }
  g.length = count
  return g
}

var SPLITTER = +(Math.pow(2, 27) + 1.0)

function twoProduct(a, b, result) {
  var x = a * b

  var c = SPLITTER * a
  var abig = c - a
  var ahi = c - abig
  var alo = a - ahi

  var d = SPLITTER * b
  var bbig = d - b
  var bhi = d - bbig
  var blo = b - bhi

  var err1 = x - (ahi * bhi)
  var err2 = err1 - (alo * bhi)
  var err3 = err2 - (ahi * blo)

  var y = alo * blo - err3

  if(result) {
    result[0] = y
    result[1] = x
    return result
  }

  return [ y, x ]
}

//Easy case: Add two scalars
function scalarScalar(a, b) {
  var x = a + b
  var bv = x - a
  var av = x - bv
  var br = b - bv
  var ar = a - av
  var y = ar + br
  if(y) {
    return [y, x]
  }
  return [x]
}

function robustSubtract(e, f) {
  var ne = e.length|0
  var nf = f.length|0
  if(ne === 1 && nf === 1) {
    return scalarScalar(e[0], -f[0])
  }
  var n = ne + nf
  var g = new Array(n)
  var count = 0
  var eptr = 0
  var fptr = 0
  var abs = Math.abs
  var ei = e[eptr]
  var ea = abs(ei)
  var fi = -f[fptr]
  var fa = abs(fi)
  var a, b
  if(ea < fa) {
    b = ei
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
      ea = abs(ei)
    }
  } else {
    b = fi
    fptr += 1
    if(fptr < nf) {
      fi = -f[fptr]
      fa = abs(fi)
    }
  }
  if((eptr < ne && ea < fa) || (fptr >= nf)) {
    a = ei
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
      ea = abs(ei)
    }
  } else {
    a = fi
    fptr += 1
    if(fptr < nf) {
      fi = -f[fptr]
      fa = abs(fi)
    }
  }
  var x = a + b
  var bv = x - a
  var y = b - bv
  var q0 = y
  var q1 = x
  var _x, _bv, _av, _br, _ar
  while(eptr < ne && fptr < nf) {
    if(ea < fa) {
      a = ei
      eptr += 1
      if(eptr < ne) {
        ei = e[eptr]
        ea = abs(ei)
      }
    } else {
      a = fi
      fptr += 1
      if(fptr < nf) {
        fi = -f[fptr]
        fa = abs(fi)
      }
    }
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    }
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
  }
  while(eptr < ne) {
    a = ei
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    }
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
    eptr += 1
    if(eptr < ne) {
      ei = e[eptr]
    }
  }
  while(fptr < nf) {
    a = fi
    b = q0
    x = a + b
    bv = x - a
    y = b - bv
    if(y) {
      g[count++] = y
    }
    _x = q1 + x
    _bv = _x - q1
    _av = _x - _bv
    _br = x - _bv
    _ar = q1 - _av
    q0 = _ar + _br
    q1 = _x
    fptr += 1
    if(fptr < nf) {
      fi = -f[fptr]
    }
  }
  if(q0) {
    g[count++] = q0
  }
  if(q1) {
    g[count++] = q1
  }
  if(!count) {
    g[count++] = 0.0
  }
  g.length = count
  return g
}

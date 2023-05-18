if (!$) throw new Error('InteractiveDeliveryMap: jQuery not found');
if (!ymaps) throw new Error('InteractiveDeliveryMap: Yandex.Maps not found');

/////////////////////////////////////////////////////////////////////////////////////////////
// Конструктор экземпляра плагина
/////////////////////////////////////////////////////////////////////////////////////////////
function InteractiveDeliveryMap(options) {
  var defaults = {
    hash: '#map',
    clear_hash_on_startup: true,
    onCalcDeliveryFinish: undefined,
    onCalcDeliveryError: undefined,
    onCalcDeliveryAddressFound: undefined,
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
  $('.idm-modal-background').on('click', $.proxy(this.onBackgroundClick, this));
  $(document).on('keyup', $.proxy(this.onKeyPress, this));
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
InteractiveDeliveryMap.prototype.showDelivery = function(address) {
  var instance = this;
  $(this.element).find('.idm-modal > div').hide();
  //$(this.element).find('.idm-modal > #deliveryMapContainer').hide();
  this.show();
  setTimeout(function(){
    instance.calcDelivery(address);
  }, 10);
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
      draggable: true
    });
    this.mapDelivery.geoObjects.add(this.placemark);
  } else {
    this.placemark.geometry.setCoordinates(coord);
    this.placemark.options.set('preset', preset);
  }
}

/////////////////////////////////////////////////////////////////////////////////////////////
InteractiveDeliveryMap.prototype.getDeliveryGeoLocator = function(address) {
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
InteractiveDeliveryMap.prototype.calcDelivery = function(address) {

  // Если адрес не поменялся, нечего делать
  if (this.address !== undefined && address == this.address) {
    this.displayDeliveryMap();
    this.calcDeliveryFinish();
    return;
  }

  var instance = this;
  $(instance.element).find('.idm-modal > #deliveryMapContainer').hide();

  // Уничтожаем ранее пролаженный маршрут
  if (instance.suburb_path) {
    instance.suburb_path.removeFromMap(instance.mapDelivery);
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
        res = instance.options.onCalcDeliveryAddressFound(addr);
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
    ymaps.route([cityCenterCoord, userCoord], {avoidTrafficJams: false, multiRoute: false, results: 10, reverseGeocoding: false}).then(function (route){
      var pathsObjects = ymaps.geoQuery(route.getPaths());
      // Перебераем все сегменты и разобиваем их на отрезки
      var edges = [];
      pathsObjects.each(function (path) {
        var coordinates = path.geometry.getCoordinates();
        for (var i = 1, l = coordinates.length; i < l; i++) {
          edges.push({ type: 'LineString', coordinates: [coordinates[i], coordinates[i - 1]] });
        }
      });
      // Создаем новую выборку, состоящую из отрезков
      var routeObjects = ymaps.geoQuery(edges);
      routeObjects.addToMap(instance.mapDelivery);
      // Выбираем отрезки, находящиеся внутри города
      var objectsInCity = routeObjects.searchInside(instance.cityPolygon);
      // Выбираем отрезки, пересекающие черту города
      var boundaryObjects = routeObjects.searchIntersect(instance.cityPolygon);
      // Выбираем отрезки, находящиеся за городом
      instance.suburb_path = routeObjects.remove(objectsInCity).remove(boundaryObjects);

      routeObjects.removeFromMap(instance.mapDelivery);

      //routeObjects.setOptions('strokeWidth', 3);
      //objectsInCity.setOptions({strokeColor: '#0500ff'});
      //boundaryObjects.setOptions({strokeColor: '#06ff00'});

      //outsideObjects.setOptions({strokeColor: '#7aba58', strokeWidth: 4, width: 10});
      instance.suburb_path.setOptions({strokeColor: '#7ed83f', strokeWidth: 5}); //58883f
      instance.suburb_path.addToMap(instance.mapDelivery);

      var dist = 0;
      instance.suburb_path.each(function(path) {
        dist += path.geometry.getDistance();
      });

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

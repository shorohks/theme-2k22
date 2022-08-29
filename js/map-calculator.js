function calcSuburbDistance(userCoord, cityCenterCoord, cityArea, callback) {
    // Скрытые слои для карты
    $('body').append('<div style="display: none;"><div id="calcSuburbDistance" style="height: 600px; width: 600px;"></div></div>');
    // Создаем карту
    var map = new ymaps.Map("calcSuburbDistance", {
              center: cityCenterCoord,
              zoom: 9
    });
    // Создаем полигон с границами города и наносим на карту.
    // Без нанесения на карту многие функции работать не будут
    cityPolygon = new ymaps.Polygon([cityArea]);
    //cityPolygon.options.set('visible', false);
    map.geoObjects.add(cityPolygon);
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
      routeObjects.addToMap(map);
      // Выбираем отрезки, находящиеся внутри города
      var objectsInCity = routeObjects.searchInside(cityPolygon);
      // Выбираем отрезки, пересекающие черту города
      var boundaryObjects = routeObjects.searchIntersect(cityPolygon);
      // Выбираем отрезки, находящиеся за городом
      var outsideObjects = routeObjects.remove(objectsInCity).remove(boundaryObjects);
      //routeObjects.removeFromMap(map);

      routeObjects.setOptions('strokeWidth', 3);
      objectsInCity.setOptions({strokeColor: '#0500ff'});
      boundaryObjects.setOptions({strokeColor: '#06ff00'});
      outsideObjects.setOptions({strokeColor: '#ff0005'});
      outsideObjects.addToMap(map);

      var dist = 0;
      outsideObjects.each(function(path) {
        dist += path.geometry.getDistance();
      });

      if (callback instanceof Function)
        callback(dist);

    }, function (error){
      // Ошибка при построении маршрута
      alert("ERROR: calcSuburbDistance() " + error.message);
    });
}
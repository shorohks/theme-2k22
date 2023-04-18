$(document).ready(function() {

  preparePages();
  $('.tabs a').on('click', onTabClick);
  $('.tabs>.active>a').click();

  $('#detailed-descr').on('click', onDetailDescrClick);
  $('#detailed-chars').on('click', onDetailCharsClick);

  window.swiper = new Swipe(document.querySelector('#slider'), { speed: 200, callback: onSwipe});

  $('.product .gallery > a').on('click', onGalleryItemClick)

  Fancybox.bind("[data-fancybox]", {});

  loadDeliveryJSON();
  ymaps.ready(getGeo);


/*
  citySelector = new autoComplete({
            placeHolder: "Search for Food...",
            data: {
                src: ["Sauce - Thousand Island", "Wild Boar - Tenderloin", "Goat - Whole Cut"],
                cache: true,
            },
            resultItem: {
                highlight: true
            },
            events: {
                input: {
                    selection: (event) => {
                        const selection = event.detail.selection.value;
                        citySelector.input.value = selection;
                    }
                }
            }

  });
*/
});

//////////////////////////////////////////////
function preparePages() {
  var characteristics_header = $('#page_details').find('h2').detach();
  var characteristics_table = $('#page_details').find('table').detach();
  $('#page_char').append(characteristics_table);
}

//////////////////////////////////////////////
function onTabClick(event) {
  event.preventDefault();
  $('.pages > *').hide();
  $(event.target).parents('.tabs').children().removeClass('active');
  $(event.target).parents('li').addClass('active');
  var page = $(event.target).parents('li').attr('page');
  $('.pages > #'+page).show();
}

function onDetailDescrClick() {
  $('.tabs > li').removeClass('active')
  $(".tabs > li[page='page_details']").addClass('active')
  $('.pages > *').hide();
  $('.pages > #page_details').show();
}

function onDetailCharsClick(e) {
  $('.tabs > li').removeClass('active')
  $(".tabs > li[page='page_char']").addClass('active')
  $('.pages > *').hide();
  $('.pages > #page_char').show();
}

//////////////////////////////////////////////
function onGalleryItemClick(event) {
  event.preventDefault();
  var index = $(this).index();
  window.swiper.slide(index, 200);
  $('.product .gallery > a').removeClass('active');
  $(event.currentTarget).addClass('active');
}

//////////////////////////////////////////////
function onSwipe(event, index, element) {
  $('.product .gallery > a').removeClass('active');
  $('.product .gallery > a').eq(index).addClass('active');
}

//////////////////////////////////////////////
function getGeo() {

  ymaps.geolocation.get({
    provider: 'auto',
  })

/*
  ymaps.geocode(
    //[55.76, 37.64], // Москва
    //[55.91842865097746, 37.67366708755087],  // Мытищи
    //[54.0503060853841, 58.02375854489996],   // Белорецк
    //[62.912986115138374, 73.85093749999923], //Ханты-манты
    //[63.80332624792426, 85.8040624999952],   // Красноярский край
    //[47.228639, 39.715958], // Ростов-на-Дону
    //[47.122093, 39.729562], // Ростовская обл.
    [59.797622, 30.639642], // Ленинградская обл.
    {}
  )
*/
  .then(function(result) {
    var coord = result.geoObjects.get(0).geometry.getCoordinates();
    var addr = result.geoObjects.get(0).properties.get('text');
    latitude = coord[0];
    longitude = coord[1];
    getCity(coord[0], coord[1]);
    getDelivery(coord[0], coord[1], addr);
  }, function(err) {
    console.log('Ошибка: ' + err)
  });
}

//////////////////////////////////////////////
function getCity(lat, lon) {
  $.ajax({
    url: '//api.yadc-js.ru/city.json',
    type: 'POST',
    cache: false,
	dataType: 'json',
    data: {
      'site_id': 2,
      'latitude': lat,
      'longitude': lon,
      'cargo': JSON.stringify([cargo || {}]),
    },
    }).done(function(data) {
      setPickups(data)
    }).fail(function(){});
}

//////////////////////////////////////////////
function setPickups(data) {
  if (data.hasOwnProperty('city')) {
    $('#city-spinner').hide();
    $('#city').text(data.city).css('display', 'inline');
    $('#pickup-spinner').hide();
    $('#pickup-points').text(data.pickups + ' ' + num_word(data.pickups, ['пункт', 'пункта', 'пунктов']));
    switch (data.term) {
      case 0:
        term = 'Сегодня';
        break;
      case 1:
        term = 'Завтра';
        break;
      default:
        term = data.term + ' ' + num_word(data.term, ['день', 'дня', 'дней']);
        break;
    }
    $('#pickup_term').text(term);
    pickup_price = (data.price > 0) ? '<b>' + data.price + '</b>&nbsp;&#8381' : '<b>Бесплатно</b>';
    $('#pickup_price').html(pickup_price);
    $('#pickup').show();
    PICKUP_PRICE = data.price;
  }
}

//////////////////////////////////////////////
function getDelivery(lat, lon, addr) {
  for (var i = 0; i < delivery_details.length; i++) {
    if (addr.toLowerCase().indexOf(delivery_details[i].sign.toLowerCase()) >= 0) {
      if (delivery_details[i].city) {
        // Пользователь в пределах города
        setDeliveryTerm(1);
        setDeliveryPrice(0);
      } else {
        // Пользователь в пригороде
        setDeliveryTerm(1);
        dist = calcSuburbDistance([lat, lon], delivery_details[i].city_center, delivery_details[i].city_area, setDeliveryPrice);
      }
      return;
    }
  };
  setDeliveryTerm(-1, 0);
}

//////////////////////////////////////////////
function setDeliveryTerm(term) {
  $('#delivery-spinner').hide();
  switch (term) {
    case -1:
      $('#delivery').text('Нет доставки');
      break;
    case 0:
      $('#delivery').html('<span id="delivery_term">Сегодня</span> - <span id="delivery_price"><i class="powericon-spinner powericon-pulse"></i></span>');
      break;
    case 1:
      $('#delivery').html('<span id="delivery_term">Завтра</span> - <span id="delivery_price"><i class="powericon-spinner powericon-pulse"></i></span>');
      break;
    default:
      $('#delivery').html('<span id="delivery_term"></span> - <span id="delivery_price"><i class="powericon-spinner powericon-pulse"></i></span>');
      $('#delivery_term').text(term + ' ' + num_word(term, ['день', 'дня', 'дней']));
      break;
  }
  $('#delivery').show();
}

//////////////////////////////////////////////
function setDeliveryPrice(suburbDist) {
  //console.log('Outside distance: ' + suburbDist);
  var price = (product_price < DELIVERY_FREE_LIMIT) ? DELIVERY_PRICE : 0;
  price += Math.round(suburbDist * DELIVERY_EXTRA_PAY / 1000);
  delivery_price = (price > 0) ? '<b>' + price + '</b>&nbsp;&#8381' : '<b>Бесплатно</b>';
  $('#delivery_price').html(delivery_price);
}

//////////////////////////////////////////////
function num_word(value, words) {
    cases = [2, 0, 1, 1, 1, 2];  
    return words[ (value%100>4 && value%100<20)? 2 : cases[(value%10<5)?value%10:5] ];  
/*
	value = Math.abs(value) % 100; 
	var num = value % 10;
	if(value > 10 && value < 20) return words[2]; 
	if(num > 1 && num < 5) return words[1];
	if(num == 1) return words[0]; 
	return words[2];
*/
}

//////////////////////////////////////////////
function loadDeliveryJSON() {
  $.ajax({
    url: '/products/delivery.json',
    dataType: 'json',
  }).done(function(data) {
    window.delivery_details = data;
  }).fail(function(jqXHR, textStatus, errorThrown){
    console.log(errorThrown);
  });
}

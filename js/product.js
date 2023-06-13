$(document).ready(function() {

  preparePages();
  $('.tabs a').on('click', onTabClick);
  $('.tabs>.active>a').click();

  $('#detailed-descr').on('click', onDetailDescrClick);
  $('#detailed-chars').on('click', onDetailCharsClick);

  window.swiper = new Swipe(document.querySelector('#slider'), { speed: 200, callback: onSwipe});

  $('.product .gallery > a').on('click', onGalleryItemClick);
  $('#city').on('click', onCityClick);

  Fancybox.bind("[data-fancybox]", {});

  $('#pickup-points').on('click', function(e){
    e.preventDefault();
    window.idm.showPickup();
  });

  var city = getCookie('idm_city');
  var delivery_location = getCookie('idm_delivery_location');
  var distance = getCookie('idm_suburb_distance');
  if (city)
    displayCity(city);
  if (delivery_location !== undefined)
    onCalcDeliveryFinish(delivery_location, distance);

  ymaps.ready(function(){
    window.idm = new InteractiveDeliveryMap({
      pickup_button: false,
      cargo: cargo || {},
      onCalcDeliveryAddressFound: function(addr, coord) {
        window.idm.getPickupCityByCoord(coord, cargo || {});
      },
      onCalcDeliveryFinish: onCalcDeliveryFinish,
      onCalcDeliveryError: function() {
        displayDelivery(-2);
      },
      onPickupCity: function(data) {
        displayPickups(data);
        document.getElementById("city_input").setAttribute("placeholder", data.city);
      },
      onPickupCityError: function() {
      },
      onPickupCitiesList: function(cities) {
        autocomplete(document.getElementById("city_input"), cities, {
          onBlur: onCitiesListBlur,
          onSelect: onCitySelect,
        });
      },
    });

    window.idm.getPickupCitiesList();

    if (city = getCookie('idm_city')) {
      window.idm.getCityPickups(city, cargo);
      if (isNaN(Number(delivery_location)))
        window.idm.calcDelivery(city);
    } else {
      window.idm.calcDelivery();
    }
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
function displayPickups(data) {
  if (data.hasOwnProperty('city')) {
    displayCity(data.city);
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

    setCookie('idm_city', data.city, false);
  }
}

//////////////////////////////////////////////
function displayCity(city) {
  $('#city-spinner').hide();
  $('#city').text(city)
  if ($('.autocomplete').css("display") == "none")
    $('#city').css('display', 'inline');
}

//////////////////////////////////////////////
function displayDelivery(term, suburbDist) {
  $('#delivery-spinner').hide();
  switch (term) {
    case -2:
      $('#delivery').text('Ошибка');
      break;
    case -1:
      $('#delivery').text('Нет доставки');
      break;
    case 0:
      $('#delivery').html('<span id="delivery_term">Сегодня</span> - <span id="delivery_price">' + getDeliveryPriceStr(suburbDist) + '</span>');
      break;
    case 1:
      $('#delivery').html('<span id="delivery_term">Завтра</span> - <span id="delivery_price">' + getDeliveryPriceStr(suburbDist) + '</i></span>');
      break;
    default:
      $('#delivery').html('<span id="delivery_term"></span> - <span id="delivery_price">' + getDeliveryPriceStr(suburbDist) + '</span>');
      $('#delivery_term').text(term + ' ' + num_word(term, ['день', 'дня', 'дней']));
      break;
  }
  $('#delivery').show();
}

//////////////////////////////////////////////
function getDeliveryPriceStr(suburbDist) {
  var price = (product_price < DELIVERY_FREE_LIMIT) ? DELIVERY_PRICE : 0;
  price += Math.round(suburbDist * DELIVERY_EXTRA_PAY / 1000);
  delivery_price = (price > 0) ? '<b>' + price + '</b>&nbsp;&#8381' : '<b>Бесплатно</b>';
  return delivery_price;
}

//////////////////////////////////////////////
function onCityClick(e) {
  e.preventDefault();
  $(e.target).hide(0);
  $('.autocomplete').show();
  $('.autocomplete input').focus();
}

//////////////////////////////////////////////
function onCitiesListBlur() {
  $('.autocomplete').hide();
  $('#city').show();
}

//////////////////////////////////////////////
function onCitySelect(city) {
  $('#city').text(city);

  $('#pickup').hide();
  $('#pickup-spinner').show();
  window.idm.getCityPickups(city, cargo);

  $('#delivery').hide();
  $('#delivery-spinner').show();

  clearCookie('idm_city');
  clearCookie('idm_delivery_location');
  clearCookie('idm_suburb_distance');

  window.idm.calcDelivery(city, true);
}

//////////////////////////////////////////////
function onCalcDeliveryFinish(delivery_location, distance) {
  switch (Number(delivery_location)) {
    case -1:
      // Нет доставки
      displayDelivery(-1);
      break;
    case 0:
      // Пользователь в пределах города
      displayDelivery(1, 0);
      break;
    case 1:
      // Пользователь в пригороде
      displayDelivery(1, Number(distance))
      break;
  }
  setCookie('idm_delivery_location', delivery_location, false);
  setCookie('idm_suburb_distance', distance, false);
}


//////////////////////////////////////////////
function num_word(value, words) {
    cases = [2, 0, 1, 1, 1, 2];  
    return words[ (value%100>4 && value%100<20)? 2 : cases[(value%10<5)?value%10:5] ];  
}

});

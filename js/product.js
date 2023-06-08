$(document).ready(function() {

  preparePages();
  $('.tabs a').on('click', onTabClick);
  $('.tabs>.active>a').click();

  $('#detailed-descr').on('click', onDetailDescrClick);
  $('#detailed-chars').on('click', onDetailCharsClick);

  window.swiper = new Swipe(document.querySelector('#slider'), { speed: 200, callback: onSwipe});

  $('.product .gallery > a').on('click', onGalleryItemClick)

  Fancybox.bind("[data-fancybox]", {});

  $('#pickup-points').on('click', function(e){
    e.preventDefault();
    window.idm.showPickup();
  })

  ymaps.ready(function(){
    window.idm = new InteractiveDeliveryMap({
      cargo: cargo || {},
      onCalcDeliveryAddressFound: function(addr, coord) {
        window.idm.getPickupCityByCoord(coord, cargo || {});
      },
      onCalcDeliveryFinish: function(delivery_location, distance) {
        switch (delivery_location) {
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
            displayDelivery(1, distance)
            break;
        }
      },
      onCalcDeliveryError: function() {
        displayDelivery(-2);
      },
      onPickupCity: function(data) {
        displayPickups(data);
      },
      onPickupCityError: function() {
      },
    });
    window.idm.calcDelivery();
  });


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
function displayPickups(data) {
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
function num_word(value, words) {
    cases = [2, 0, 1, 1, 1, 2];  
    return words[ (value%100>4 && value%100<20)? 2 : cases[(value%10<5)?value%10:5] ];  
}


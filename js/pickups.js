$(document).ready(function() {

  if (location.hash == '#pickups') {
    history.replaceState(undefined, document.title, ' ');
  }

  $(window).on('hashchange', onHashChange);

  $('.modal-close').on('click', closePickups);
  $('.modal-background').on('click', onModalBackgroundClick);
  $(document).on('keyup', onKeyPress);

});

//////////////////////////////////////////////
function onHashChange(){
  if (location.hash == '#pickups') {
    showPickups();
  } else if ($('.modal-background').hasClass('active')) {
    hidePickups();
  }
}

//////////////////////////////////////////////
function showPickups(){
  $('.modal-background').addClass('active');
  createYADC(latitude, longitude);
  $('#yadc').yadc('updateMap');
}

//////////////////////////////////////////////
function hidePickups(){
    $('.modal-background').removeClass('active');
}

//////////////////////////////////////////////
function createYADC(lat, lon) {
  $('#yadc').yadc({
    site_id: 2,
    height: '100%',
    map_сenter: [lat, lon],
    auto_geolocation: false,
    mark_center: true,
    smart_zoom: true,
    geolocation_provider: 'auto',
    auto_open_custom_pickup: (PICKUP_PRICE == 0),
    map_scale: 14,
    cargo: cargo,
  });
}

//////////////////////////////////////////////
function closePickups(){
  if (location.hash == '#pickups')
    window.history.go(-1);
}

//////////////////////////////////////////////
function onModalBackgroundClick(e) {
  if ($(e.target).hasClass('modal-background') || $(e.target).hasClass('modal-container') ) {
    closePickups();
    e.stopPropagation();
    e.preventDefault();
  }
}

//////////////////////////////////////////////
function onKeyPress(e) {
	if ((e.key === "Escape") && ($('.modal-background').hasClass('active')))
	  closePickups();
}

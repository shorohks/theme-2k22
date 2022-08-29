$(document).ready(function(){
  var menu = $('.catalog');

  $('.catalog-btn').on('click', function(event){
    $(this).toggleClass('sm-activated');
    menu.toggleClass('sm-activated');
    event.preventDefault();
  });

  $(menu).on('mouseleave', function(event){
    menu.removeClass('sm-activated');
	$('.catalog-btn').removeClass('sm-activated');
  });

  $(menu).find('a').on('click', function(event){
    $(event.target).parent('li').toggleClass('sm-active');
  });

});
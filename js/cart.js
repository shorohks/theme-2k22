$(function() {

loadDeliveryJSON();

auth = new Vue({
  data: {
    DELIVERY_COURIER: 0,
    DELIVERY_PICKUP: 2,
    PAYER_INDIVIDUAL: 1,
    PAYER_LEGAL: 2,
    PAY_CASH: 1,
    PAY_BILL: 2,
    PAY_CARD: 3,
    products: CART,
    delivery: 0,
    payer: 1,
    pay: 1,
    address: undefined,
  },
  methods: {
    getProductSum: getProductSum,
    getProductsCount: getProductsCount,
    onDeleteProductClick: onDeleteProductClick,
    onProductQuantityChange: onProductQuantityChange,
    onChoosePickupClick: onChoosePickupClick,
    ajaxDeleteProduct: ajaxDeleteProduct,
    ajaxUpdateCart: ajaxUpdateCart,
    updateCounterIcon: updateCounterIcon,
    calcDelivery: calcDelivery,
  },
  computed: {
    totalCost: getTotalCost,
  },
  filters: {
    currency: formatPrice,
  },
  watch: {
    payer: onPayerChange,
    pay: onPayChange,
  },
  components: {},
  mounted: function() {},
  created: function() {},
  el: '#cartapp',
  template: '#cartapp-template',
});

//////////////////////////////////////////////////////////////
function getProductSum(product) {
  return product.price * product.quantity;
}

/////////////////////////////////////////////////////////////
function getTotalCost(){
  return this.products.reduce(function(acc, item, index, arr){
    return acc + getProductSum(item);
  }, 0);
}

/////////////////////////////////////////////
function getProductsCount(){
  return this.products.reduce(function(acc, item, index, arr){
    return acc + item.quantity;
  }, 0);
}

/////////////////////////////////////////////////////////////
function onDeleteProductClick(product){
  this.products = this.products.filter(function(prod){
    return prod.code != product.code;
  });
  this.ajaxDeleteProduct(product);
  this.updateCounterIcon();
}

/////////////////////////////////////////////
function onProductQuantityChange(product){
  this.ajaxUpdateCart();
  this.updateCounterIcon();
}

/////////////////////////////////////////////
function ajaxDeleteProduct(product) {
  $.ajax({
    type: 'GET',
    url: 'remove.php?product=' + product.code,
    dataType: 'html',
    data: {},
    cache: false,
    beforeSend : function(req) {},
    complete: function() {},
    error: function(xhr, ajaxOptions, thrownError) {},
    success: function(data) {},
  });
}

/////////////////////////////////////////////////////////////
function ajaxUpdateCart() {
  var data = {};
  this.products.forEach(function(product, index, arr){
    data[product.code] = (parseInt(product.quantity) || 1);
  });
  $.ajax({
    type: 'POST',
    url: 'update.php',
    dataType: 'html',
    data: data,
    cache: false,
    beforeSend : function(req) {},
    complete: function() {},
    error: function(xhr, ajaxOptions, thrownError) {},
    success: function(data) {},
  });
}

/////////////////////////////////////////////////////////////
function updateCounterIcon(){
  $('.powericon-cart + sup').text(this.getProductsCount());
}

/////////////////////////////////////////////////////////////
function formatPrice(amount) {
  return formatPriceCustom(amount, (amount == Math.round(amount) ? 0 : 2));
}

/////////////////////////////////////////////////////////////
function formatPriceCustom(amount, denomination) {
  return (amount !== null) ? parseFloat(amount).toFixed(denomination).replace(/(\d)(?=(\d{3})+(\.|$))/g, '$1 ') : '';
}

/////////////////////////////////////////////////////////////
function onChoosePickupClick(){
  window.history.pushState({}, '', '#pickups');
  showPickups();
}

/////////////////////////////////////////////////////////////
function onPayerChange(newVal, oldVal){
  if (newVal == this.PAYER_LEGAL)
    this.pay = this.PAY_BILL;
}

/////////////////////////////////////////////////////////////
function onPayChange(newVal, oldVal){
  if (newVal == this.PAY_CASH || newVal == this.PAY_CARD)
    this.payer = this.PAYER_INDIVIDUAL;
}

/////////////////////////////////////////////////////////////
function calcDelivery() {
var myGeocoder = ymaps.geocode(this.address);
myGeocoder.then(
    function (res) {
        //map.geoObjects.add(res.geoObjects);
        // Выведем в консоль данные, полученные в результате геокодирования объекта.
        console.log(res.geoObjects.get(0));
        console.log(res.geoObjects.get(0).properties.get('metaDataProperty').getAll());
    },
    function (err) {
        // Обработка ошибки
        console.log(err);
    }
);
}

});
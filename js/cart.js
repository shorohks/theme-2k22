$(function() {

cart = new Vue({
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
    distance: 0,
    calculating_delivery: false,
    calculating_pickup: false,
    delivery_location: undefined,		// 0/1/2 - нет доставки/по городу/за город
    pvz: undefined,
    ymaps_ready: false,
    pickups_ready: false,
  },
  methods: {
    getProductSum: getProductSum,
    getProductsCount: getProductsCount,
    onDeleteProductClick: onDeleteProductClick,
    onProductQuantityChange: onProductQuantityChange,
    ajaxDeleteProduct: ajaxDeleteProduct,
    ajaxUpdateCart: ajaxUpdateCart,
    updateCounterIcon: updateCounterIcon,
    calcDelivery: calcDelivery,
    showDeliveryMap: showDeliveryMap,
    onCalcDeliveryFinish: onCalcDeliveryFinish,
    onCalcDeliveryError: onCalcDeliveryError,
    onCalcDeliveryAddressFound: onCalcDeliveryAddressFound,
    onCalcPickupFinish: onCalcPickupFinish,
    onCalcPickupError: onCalcPickupError,
    focusAddrInput: focusAddrInput,
    showPickup: showPickup,
    showDelivery: showDelivery,
    onPickupSelect: onPickupSelect,
    onPickupsReady: onPickupsReady,
    getCargo: getCargo,
    updateCargo: updateCargo,
  },
  computed: {
    cartCost: getCartCost,
    totalCost: getTotalCost,
    deliveryCost: getDeliveryCost,
    suburbDistance: getSuburbDistance,
  },
  filters: {
    currency: formatPrice,
  },
  watch: {
    payer: onPayerChange,
    pay: onPayChange,
    address: onAddressChange,
  },
  components: {},
  mounted: function() {},
  created: function() {
      var instance = this;
      ymaps.ready(function(){
        window.idm = new InteractiveDeliveryMap({
          cargo: instance.getCargo(),
          onPickupsReady: instance.onPickupsReady,
          onCalcDeliveryFinish: instance.onCalcDeliveryFinish,
          onCalcDeliveryError: instance.onCalcDeliveryError,
          onCalcDeliveryAddressFound: instance.onCalcDeliveryAddressFound,
          onPickupSelect: instance.onPickupSelect,
          onCalcPickupFinish: instance.onCalcPickupFinish,
          onCalcPickupError: instance.onCalcPickupError,
        });
        instance.ymaps_ready = true;
      });
  },
  el: '#cartapp',
  template: '#cartapp-template',
});

//////////////////////////////////////////////////////////////
function getProductSum(product) {
  return product.price * product.quantity;
}

/////////////////////////////////////////////////////////////
function getTotalCost(){
  return this.cartCost + this.deliveryCost;
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
  this.updateCargo();
}

/////////////////////////////////////////////
function onProductQuantityChange(product){
  this.ajaxUpdateCart();
  this.updateCounterIcon();
  this.updateCargo();
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
function showDeliveryMap() {
  var instance = this;
  window.idm.showDelivery(this.address, false);
}

/////////////////////////////////////////////////////////////
function calcDelivery() {
  if (this.calculating_delivery || !this.ymaps_ready)
    return;
  var instance = this;
  instance.calculating_delivery = true;
  window.idm.calcDelivery(String(instance.address).trim());
}

/////////////////////////////////////////////////////////////
function onCalcDeliveryFinish(delivery_location, dist) {
  this.calculating_delivery = false;
  if (delivery_location === undefined)
    return;
  this.delivery_location = delivery_location;
  if (dist !== undefined)
    this.distance = dist;
}

/////////////////////////////////////////////////////////////
function onCalcDeliveryError(err) {
  this.calculating_delivery = false;
  console.log('calcDelivery() error: ' + err);
}

/////////////////////////////////////////////////////////////
function onCalcDeliveryAddressFound(addr) {
  addr = this.$refs.addrinput.transformAddress(addr);
  this.address = addr;
  return addr;
}

/////////////////////////////////////////////////////////////
function focusAddrInput(){
  this.$refs.addrinput.focus();
}

/////////////////////////////////////////////////////////////
function getCartCost() {
  return this.products.reduce(function(acc, item, index, arr){
    return acc + getProductSum(item);
  }, 0);
}

/////////////////////////////////////////////////////////////
function getDeliveryCost() {
  if (this.delivery_location >= 0) {
    var delivery_cost = (this.cartCost < DELIVERY_FREE_LIMIT) ? DELIVERY_PRICE : 0;
    delivery_cost += (this.delivery_location > 0) ? Math.round(this.suburbDistance * DELIVERY_EXTRA_PAY) : 0;
    return delivery_cost
  } else
    return 0;
}

/////////////////////////////////////////////////////////////
function onAddressChange(newVal, oldVal) {
  if (typeof newVal === 'string' && newVal.trim() != oldVal)
    this.delivery_location = undefined;
}

/////////////////////////////////////////////////////////////
function getSuburbDistance() {
  return (this.delivery_location > 0) ? Math.round(this.distance / 100) / 10 : 0;
}

/////////////////////////////////////////////////////////////
function showPickup() {
  var instance = this;
  //setTimeout(function(){
  window.idm.showPickup(instance.pvz ? instance.pvz.id : undefined);
  //}, 1);
}

/////////////////////////////////////////////////////////////
function showDelivery() {
var instance = this;
setTimeout(function(){
  window.idm.showDelivery();
}, 1);
}

/////////////////////////////////////////////////////////////
function getCargo(){
  return this.products.map(function(item, index, arr){
    var newItem = {
      id: item.code,
      count: item.quantity,
      price: item.price,
    };
    if (item.weight)
      newItem.weight = item.weight;
    if (item.volume)
      newItem.volume = item.volume;
    return newItem;
  });
}
/////////////////////////////////////////////////////////////
function onPickupSelect(pvz) {
  this.pvz = JSON.parse(JSON.stringify(pvz));
  if (this.pvz.inprogress == 1) {
    this.calculating_pickup = true;
    window.idm.calculatePickupPrice(this.pvz.id, this.getCargo());
  }
}

/////////////////////////////////////////////////////////////
function updateCargo() {
  window.idm.setCargo(this.getCargo());
  if (this.pvz) {
    this.calculating_pickup = true;
    window.idm.calculatePickupPrice(this.pvz.id, this.getCargo());
  }
}

/////////////////////////////////////////////////////////////
function onCalcPickupFinish(price) {
  if (this.pvz)
    this.pvz.price = price;
  this.calculating_pickup = false;
}

/////////////////////////////////////////////////////////////
function onCalcPickupError(err) {
  if (this.pvz)
    this.pvz.price = undefined;
  this.calculating_pickup = false;
}

/////////////////////////////////////////////////////////////
function onPickupsReady() {
  this.pickups_ready = true;
}

});
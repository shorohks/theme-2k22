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
    name: '',
    address: '',
    phone: '',
    email: '',
    comments: '',
    yur_payer: '',
    yur_address: '',
    yur_inn: '',
    yur_kpp: '',
    yur_rs: '',
    yur_bank: '',
    yur_ks: '',
    yur_bik: '',
    distance: 0,
    calculating_delivery: false,
    calculating_pickup: false,
    delivery_location: undefined,		// 0/1/2 - нет доставки/по городу/за город
    pvz: undefined,
    ymaps_ready: false,
    pickups_ready: false,
    inprogress: false,
    order_num: undefined,
    coupons: [],
    coupon: '',
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
    getYMClientID: getYMClientID,
    validate: validate,
    onSubmit: onSubmit,
    indexOfCoupon: indexOfCoupon,
    loadCoupons: loadCoupons,
    MD5: function(d){var r = M(V(Y(X(d),8*d.length)));return r.toLowerCase();function M(d){for(var _,m="0123456789ABCDEF",f="",r=0;r<d.length;r++)_=d.charCodeAt(r),f+=m.charAt(_>>>4&15)+m.charAt(15&_);return f}function X(d){for(var _=Array(d.length>>2),m=0;m<_.length;m++)_[m]=0;for(m=0;m<8*d.length;m+=8)_[m>>5]|=(255&d.charCodeAt(m/8))<<m%32;return _}function V(d){for(var _="",m=0;m<32*d.length;m+=8)_+=String.fromCharCode(d[m>>5]>>>m%32&255);return _}function Y(d,_){d[_>>5]|=128<<_%32,d[14+(_+64>>>9<<4)]=_;for(var m=1732584193,f=-271733879,r=-1732584194,i=271733878,n=0;n<d.length;n+=16){var h=m,t=f,g=r,e=i;f=md5_ii(f=md5_ii(f=md5_ii(f=md5_ii(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_hh(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_gg(f=md5_ff(f=md5_ff(f=md5_ff(f=md5_ff(f,r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+0],7,-680876936),f,r,d[n+1],12,-389564586),m,f,d[n+2],17,606105819),i,m,d[n+3],22,-1044525330),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+4],7,-176418897),f,r,d[n+5],12,1200080426),m,f,d[n+6],17,-1473231341),i,m,d[n+7],22,-45705983),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+8],7,1770035416),f,r,d[n+9],12,-1958414417),m,f,d[n+10],17,-42063),i,m,d[n+11],22,-1990404162),r=md5_ff(r,i=md5_ff(i,m=md5_ff(m,f,r,i,d[n+12],7,1804603682),f,r,d[n+13],12,-40341101),m,f,d[n+14],17,-1502002290),i,m,d[n+15],22,1236535329),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+1],5,-165796510),f,r,d[n+6],9,-1069501632),m,f,d[n+11],14,643717713),i,m,d[n+0],20,-373897302),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+5],5,-701558691),f,r,d[n+10],9,38016083),m,f,d[n+15],14,-660478335),i,m,d[n+4],20,-405537848),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+9],5,568446438),f,r,d[n+14],9,-1019803690),m,f,d[n+3],14,-187363961),i,m,d[n+8],20,1163531501),r=md5_gg(r,i=md5_gg(i,m=md5_gg(m,f,r,i,d[n+13],5,-1444681467),f,r,d[n+2],9,-51403784),m,f,d[n+7],14,1735328473),i,m,d[n+12],20,-1926607734),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+5],4,-378558),f,r,d[n+8],11,-2022574463),m,f,d[n+11],16,1839030562),i,m,d[n+14],23,-35309556),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+1],4,-1530992060),f,r,d[n+4],11,1272893353),m,f,d[n+7],16,-155497632),i,m,d[n+10],23,-1094730640),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+13],4,681279174),f,r,d[n+0],11,-358537222),m,f,d[n+3],16,-722521979),i,m,d[n+6],23,76029189),r=md5_hh(r,i=md5_hh(i,m=md5_hh(m,f,r,i,d[n+9],4,-640364487),f,r,d[n+12],11,-421815835),m,f,d[n+15],16,530742520),i,m,d[n+2],23,-995338651),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+0],6,-198630844),f,r,d[n+7],10,1126891415),m,f,d[n+14],15,-1416354905),i,m,d[n+5],21,-57434055),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+12],6,1700485571),f,r,d[n+3],10,-1894986606),m,f,d[n+10],15,-1051523),i,m,d[n+1],21,-2054922799),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+8],6,1873313359),f,r,d[n+15],10,-30611744),m,f,d[n+6],15,-1560198380),i,m,d[n+13],21,1309151649),r=md5_ii(r,i=md5_ii(i,m=md5_ii(m,f,r,i,d[n+4],6,-145523070),f,r,d[n+11],10,-1120210379),m,f,d[n+2],15,718787259),i,m,d[n+9],21,-343485551),m=safe_add(m,h),f=safe_add(f,t),r=safe_add(r,g),i=safe_add(i,e)}return Array(m,f,r,i)}function md5_cmn(d,_,m,f,r,i){return safe_add(bit_rol(safe_add(safe_add(_,d),safe_add(f,i)),r),m)}function md5_ff(d,_,m,f,r,i,n){return md5_cmn(_&m|~_&f,d,_,r,i,n)}function md5_gg(d,_,m,f,r,i,n){return md5_cmn(_&f|m&~f,d,_,r,i,n)}function md5_hh(d,_,m,f,r,i,n){return md5_cmn(_^m^f,d,_,r,i,n)}function md5_ii(d,_,m,f,r,i,n){return md5_cmn(m^(_|~f),d,_,r,i,n)}function safe_add(d,_){var m=(65535&d)+(65535&_);return(d>>16)+(_>>16)+(m>>16)<<16|65535&m}function bit_rol(d,_){return d<<_|d>>>32-_}},
  },
  computed: {
    cartCost: getCartCost,
    totalCost: getTotalCost,
    deliveryCost: getDeliveryCost,
    suburbDistance: getSuburbDistance,
    couponDiscountPercent: getCouponDiscountPercent,
    couponDiscount: getCouponDiscount,
    commentsWithMessage: getcommentsWithMessage,
  },
  filters: {
    currency: formatPrice,
  },
  watch: {
    payer: onPayerChange,
    pay: onPayChange,
    address: onAddressChange,
    coupon: onCouponChange,
  },
  components: {},
  mounted: function() {},
  created: function() {
      this.loadCoupons();
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
  return this.cartCost + this.deliveryCost - this.couponDiscount;
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
  ecommerce_remove([{
    'id': product.code,
    'name': product.trademark + ' ' + product.model,
    'brand': product.trademark,
    'category': product.category,
    'price': product.price,
    'quantity': product.quantity,
  }]);
}

/////////////////////////////////////////////
function onProductQuantityChange(product){
  this.ajaxUpdateCart();
  this.updateCounterIcon();
  this.updateCargo();
  if (product.old_qty != product.quantity) {
    prod = {
      'id': product.code,
      'name': product.trademark + ' ' + product.model,
      'brand': product.trademark,
      'category': product.category,
      'price': product.price,
      'quantity': Math.abs(product.quantity - product.old_qty),
    }
    if (product.quantity > product.old_qty)
      ecommerce_add([prod]);
    else
      ecommerce_remove([prod]);
    product.old_qty = product.quantity;
  }
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

/////////////////////////////////////////////////////////////
function getYMClientID() {
  try {
    if (!window.hasOwnProperty('Ya') || !window.Ya.hasOwnProperty('_metrika') ||
        !window.Ya._metrika.hasOwnProperty('counter') ||
        !window.Ya._metrika.counter.hasOwnProperty('getClientID'))
      return undefined;
    return window.Ya._metrika.counter.getClientID();
  } catch(e) {
    console.log("Ошибка " + e.name + ": " + e.message);
  }
}

/////////////////////////////////////////////////////////////
function validate() {
  // Задан адрес доставки?
  if (this.delivery == this.DELIVERY_COURIER && String(this.address).length < 5 ) {
    alert('Укажите адрес доставки');
    return false;
  }
  // Задан пункт выдачи?
  if (this.delivery == this.DELIVERY_PICKUP && this.pvz === undefined ) {
    alert('Выберите пункт выдачи');
    return false;
  }
  // Указан получатель?
  if (String(this.name).length < 3 ) {
    alert('Укажите Ф.И.О получателя');
    return false;
  }
  // Указан телефон?
  if (String(this.phone).length < 5 ) {
    alert('Укажите контактный телефон');
    return false;
  }
  // Указан e-mail при безналичной оплате?
  if (this.pay == this.PAY_BILL && String(this.email).length < 5 ) {
    alert('Укажите e-mail для получения счёта');
    return false;
  }
  return true;
}

/////////////////////////////////////////////////////////////
function onSubmit() {
  if (this.inprogress)
    return;
  var instance = this;
  if (instance.validate()) {
    instance.inprogress = true;
    var tt = {
      dellin: 3,
      cdek: 5,
    }
    var data = {
      lname: instance.name,
      phone: instance.phone,
      comments: instance.commentsWithMessage,
      customer: instance.payer,
      payment: instance.pay,
      delivery: instance.delivery,
      address: instance.address,
      yur_payer: instance.yur_payer,
      yur_address: instance.yur_address,
      yur_inn: instance.yur_inn,
      yur_kpp: instance.yur_kpp,
      yur_rs: instance.yur_rs,
      yur_bank: instance.yur_bank,
      yur_ks: instance.yur_ks,
      yur_bik: instance.yur_bik,
      email: instance.email,
      ym_client_id: instance.getYMClientID(),
    };
    if (instance.pay == instance.PAY_BILL && instance.payer == instance.PAYER_INDIVIDUAL) {
      data['fiz_fname'] = instance.name;
    }
    if (instance.delivery == instance.DELIVERY_PICKUP) {
      data['delivery_city'] = instance.pvz.city;
      if (instance.pvz.service_code === 'custom') {
        data['delivery'] = 1;
      } else {
        data['transport_company'] = tt[instance.pvz.service_code];
      }
    }
    $.ajax({
      type: 'POST',
      url: '/order.php',
      dataType: 'html',
      data: data,
      cache: false,
      beforeSend : function(req) {},
      complete: function() {
        instance.inprogress = false;
      },
      error: function(xhr, ajaxOptions, thrownError) {
        errorMsg(AJAXErrorMessage(xhr, thrownError));
      },
      success: function(data) {
        var res = data.match(/Order: (\d+)/i);
        if (res.length == 2) {
          instance.order_num = parseInt(res[1]);
          var order_products = instance.products.map(function(item){
            return {
              'id': item.code,
              'name': item.trademark + ' ' + item.model,
              'brand': item.trademark,
              'category': item.category,
              'price': item.price,
              'quantity': item.quantity,
            };
          });
          ecommerce_purchase(instance.order_num, order_products);
        } else {
          errorMsg('Неизвестная ошибка. Попробуйте еще раз.');
        }
      },
    });
  }
}

/////////////////////////////////////////////////////////////
function onCouponChange(newVal, olVal) {
  if (newVal !== olVal) {
    this.coupon = String(newVal).toUpperCase();
  }
}

/////////////////////////////////////////////////////////////
function indexOfCoupon(coupon) {
  var hashed = this.MD5(coupon);
  for (var i = 0; i < this.coupons.length; i++) {
    if (this.coupons[i].hasOwnProperty('hash') && hashed == this.coupons[i].hash)
      return i;
  }
  return -1;
}

/////////////////////////////////////////////////////////////
function getCouponDiscountPercent() {
  if (!this.coupon.length)
    return 0;
  var i = this.indexOfCoupon(this.coupon)
  if  (i >= 0) {
    return this.coupons[i].hasOwnProperty('discount') ? this.coupons[i].discount : 0;
  } else
    return 0;
}

/////////////////////////////////////////////////////////////
function getCouponDiscount() {
  return this.couponDiscountPercent ? this.cartCost / 100 * this.couponDiscountPercent : 0;
}

/////////////////////////////////////////////////////////////
function loadCoupons() {
  var instance = this;
  $.ajax({
    type: 'GET',
    url: 'custom/coupons.json',
    dataType: 'json',
    cache: false,
    beforeSend : function(req) {},
    complete: function() {},
    error: function(xhr, ajaxOptions, thrownError) {},
    success: function(data) {
      if (data.constructor === Array && data.length > 0)
        instance.coupons = data;
    },
  });
}

/////////////////////////////////////////////////////////////
function getcommentsWithMessage() {
  var note = this.comments;
  if (this.couponDiscountPercent) {
    note += note.length ? "\n\n" : '';
    note += 'Использован промо-код "' + this.coupon + '".';
    note += ' Скидка ' + this.couponDiscountPercent + '% (' + this.couponDiscount + ' руб).';
    note += ' Сумма заказа с учетом скидки ' + (this.cartCost - this.couponDiscount) + ' руб.';
  }
  return note;
}

});
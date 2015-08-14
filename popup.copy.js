/**
 * @file Popup组件
 * @author Haonan Wang
 * @version 0.1.1
 * @copyright Haonan Wang
 */

/**
 * @namespace window
 */
;(function() {
	/**
	 * 语言增强支持
	 * @ignore
	 * @static
	 * @memberOf window
	 * @property {Function} isString 是否为字符串
	 * @property {Function} isArray 是否为数组
	 * @property {Function} isFunction 是否为方法
	 * @property {Function} isObject 是否为对象
	 */
	var UL = {
		isString: isType("String"),
		isArray: Array.isArray || isType("Array"),
		isFunction: isType("Function"),
		isObject: isType("Object"),
	};
	/**
	 * DOM增强支持
	 * @ignore
	 * @static
	 * @memberOf window
	 * @property {Function} querySelector 查询节点
	 * @property {Function} hasClass 是否含有类名
	 * @property {Function} addClass 添加类
	 * @property {Function} removeClass 删除类
	 */
	var	UD = {
		querySelector: querySelector,
		hasClass: hasClass,
		addClass: addClass,
		removeClass: removeClass
	};
	/**
	 * 事件增强支持
	 * @ignore
	 * @static
	 * @memberOf window
	 * @property {Function} addEvent 添加事件
	 * @property {Function} removeEvent 删除事件
	 */
	var UE = {
		addEvent: addEvent,
		removeEvent: removeEvent
	};

	/**
	 * 接收一个选择器,生成基于该DOM节点的弹框对象,类似于jQuery的用法
	 * @class Popup
	 * @memberOf window
	 * @param {String} [selector=document.body] 选择器
	 * @example
	 * Popup('.test')
	 */
	var Popup = function(selector) {
		/**
		 * 通过选择器获取目标节点
		 * @ignore
		 * @private
		 * @memberOf window.Popup
		 * @type {Element}
		 */
		this.targetEl = selector ? (UD.querySelector(selector) && document.body) : document.body;
		/**
		 * 是否为临时创建
		 * @ignore
		 * @private
		 * @memberOf window.Popup
		 * @type {Boolean}
		 */
		this.disposable = true;
		/**
		 * 是否有遮罩层,遮罩层上禁止页面滚动
		 * @ignore
		 * @private
		 * @memberOf window.Popup
		 * @type {Boolean}
		 */
		this.mask = true;
		/**
		 * 点击遮罩层时是否关闭弹框
		 * @ignore
		 * @private
		 * @memberOf window.Popup
		 * @type {Boolean}
		 */
		this.closeOnMask = false;
		/**
		 * 弹框节点
		 * @ignore
		 * @private
		 * @memberOf window.Popup
		 * @type {Element}
		 */
		this.popupEl = void 0;
		/**
		 * 内容层节点
		 * @ignore
		 * @private
		 * @memberOf window.Popup
		 * @type {Element}
		 */
		this.containerEl = void 0;
		/**
		 * 遮罩层节点
		 * @ignore
		 * @private
		 * @memberOf window.Popup
		 * @type {Element}
		 */
		this.maskEl = void 0;
		/**
		 * 弹框大小位置是否自适应
		 * @ignore
		 * @private
		 * @memberOf window.Popup
		 * @type {Boolean}
		 */
		this.autoSize = true;
		/**
		 * 存储目标节点滚动事件
		 * @ignore
		 * @private
		 * @memberOf window.Popup
		 * @type {Function}
		 */
		this._scrollEvent = void 0;
	};

	Popup.prototype = {
		/**
		 * 创建自定义弹框,使用该方式创建的弹框对象将会保存至手动销毁[.destroy()]
		 * @memberOf window.Popup#
		 * @param {Object} options 创建弹框所需参数
		 * @param {String} options.content 弹框内容
		 * @param {String} [options.prefixClass=''] 前缀class
		 * @param {Boolean} [options.closeOnMask=false] 点击遮罩层时是否关闭弹框
		 * @param {Boolean} [options.autoSize=true] 弹框大小位置是否自适应,若否则需在css中自行设置
		 * @param {Number} [options.delayCalculate] 打开弹框时延迟计算弹框位置与大小,单位ms,适用于autoSize为true且弹窗打开有耗时动画效果时
		 * @param {Function} [options.beforeClose] 关闭前调用函数
		 * @param {Function} [options.afterClose] 关闭后调用函数
		 * @return {Object} 返回实例
		 * @example
		 * Popup('.test').create({
		 *     content: document.getElementById('showNode').innerHTML,
		 *     prefixClass: 'mypopup-',
		 *     closeOnMask: true,
		 *     autoSize: true,
		 *     delayCalculate: 1000,
		 *     beforeClose: function(){console.log('我要关闭了')},
		 *     afterClose: function(){console.log('我已经关闭了')}
		 * })
		 */
		create: function(options) {
			var content = options.content;
			this.prefixClass = options.prefixClass || '';
			this.closeOnMask = options.closeOnMask || false;
			this.autoSize = options.autoSize === undefined ? true : options.autoSize;
			this.delayCalculate = options.delayCalculate;
			this._eventsList.beforeClose = options.beforeClose;
			this._eventsList.beforeClose = options.afterClose;
			this.disposable = false;

			this._createDOM(content);
			this._bindEvents();

			return this;
		},

		/**
		 * 打开弹框
		 * @memberOf window.Popup#
		 * @return {Object} 返回实例
		 * @example
		 * //popup为实例
		 * popup.open()
		 */
		open: function() {
			var self = this,
				top = this.targetEl.scrollTop;

			this.isClosed = false;
			// 如果有遮罩层则禁止目标元素滚动
			if (this.mask) {
				if (typeof this._scrollEvent === 'undefined'){
					this._scrollEvent = this.targetEl.onscroll;
				}

				this.targetEl.onscroll = function() {
					self.targetEl.scrollTop = top;
				}
			}

			this.popupEl.style.display = '';

			// 重新计算size
			if (this.autoSize) {
				if (this.delayCalculate != undefined) {
					setTimeout(function(){
						self._calculateSize();
					},this.delayCalculate)
				} else {
					this._calculateSize();
				}
			}

			return this;
		},

		/**
		 * 关闭弹框,如果是非create方式创建的对象则关闭的同时销毁自身
		 * @memberOf window.Popup#
		 * @return {Object} 返回实例
		 * @example
		 * //popup为实例
		 * popup.close()
		 */
		close: function() {
			this.isClosed = true;
			// 如果有遮罩层则恢复目标元素滚动
			if (this.mask) {
				this.targetEl.onscroll = this._scrollEvent;
			}

			this.popupEl.style.display = 'none';

			// 如果是非create创建的对象,则关闭同时调用destroy
			if (this.disposable) {
				this.destroy();
				return true;
			} else {
				return this;
			}
		},

		/**
		 * 基于弹框内容,重新渲染
		 * @memberOf window.Popup#
		 * @return {Object} 返回实例
		 * @example
		 * //popup为实例
		 * popup.refresh()
		 */
		refresh: function() {
			this._calculateSize();
			return this;
		},

		/**
		 * 销毁实例
		 * @memberOf window.Popup#
		 * @return {Object} 返回实例
		 * @example
		 * //popup为实例
		 * popup.destroy()
		 */
		destroy: function() {
			var self = this;
			// 若弹窗未关闭，则先关闭
			if (!this.isClosed) {
				// 防止close中重复调用destroy
				this.disposable = false;
				this.close();
			}
			// 销毁事件
			UE.removeEvent(this.containerEl, 'click touchstart', function(e){
				self._onContainer.call(self, e);
			});
			if (this.mask) {
				UE.removeEvent(this.maskEl, 'click touchstart', function(e){
					self._onMask.call(self, e);
				});
			} 

			this.targetEl.style.position = '';
			this.targetEl = null;
			this.disposable = null;
			this.mask = null;
			this.popupEl.parentNode.removeChild(this.popupEl);
			this.popupEl = null;
		},

		/**
		 * 警告框 无需create,可直接调用
		 * @method alert
		 * @memberOf window.Popup#
		 * @param {String} txt 显示文本
		 * @param {Callback} [okCallback] 点击确定后回调
		 * @return {Object} 返回实例
		 * @example
		 * Popup('.test').alert('js是世界第二好的语言',function(){console.log('第一是谁')})
		 */
		/** 
		 * 警告框 无需create,可直接调用
		 * @method alert^2
		 * @memberOf window.Popup#
		 * @param {Object} params 可选参数
		 * @param {String} params.txt 显示文本
		 * @param {String} [params.okTxt=确定] 确定按钮文本
		 * @param {Boolean} [params.mask=true] 是否有遮罩层
		 * @param {Boolean} [params.closeOnMask=false] 点击遮罩层时是否关闭弹框
		 * @param {Boolean} [params.autoSize=true] 弹框大小位置是否自适应,若否则需在css中自行设置
		 * @param {Number} [params.delayCalculate] 打开弹框时延迟计算弹框位置与大小,单位ms,适用于autoSize为true且弹窗打开有耗时动画效果时
		 * @param {Callback} [params.okCallback] 点击确定后回调
		 * @return {Object} 返回实例
		 * @example
		 * Popup().alert({
		 * 	   txt: 'js是世界第二好的语言',
		 * 	   okTxt: 'ok',
		 * 	   mask: true,
		 * 	   autoSize: true,
		 * 	   delayCalculate: 200,
		 * 	   closeOnMask: true,
		 * 	   okCallback: function(){console.log('第一是谁')}
		 * })
		 */
		alert: function() {
			var txt, okTxt = '确定', content;

			if (UL.isObject(arguments[0])) {
				txt = arguments[0].txt;
				okTxt = arguments[0].okTxt || okTxt;
				this.mask = arguments[0].mask === undefined ? true : arguments[0].mask;
				this.closeOnMask = arguments[0].closeOnMask || false;
				this.autoSize = arguments[0].autoSize === undefined ? true : arguments[0].autoSize;
				this.delayCalculate = arguments[0].delayCalculate;
				this._eventsList.okCallback = arguments[0].okCallback;
			} else if (UL.isFunction(arguments[1])) {
				txt = arguments[0];
				this._eventsList.okCallback = arguments[1];
			} else {
				txt = arguments[0];
			}

			this.prefixClass = 'alert-';

			content = '<p class="alert-content">' + txt + '</p><a class="alert-ok popup-ok">' + okTxt + '</a>';

			this._createDOM(content);
			this._bindEvents();
			this.open();

			return this;
		},

		/**
		 * 确认框 无需create,可直接调用
		 * @method confirm
		 * @memberOf window.Popup#
		 * @param {String} txt 显示文本
		 * @param {Callback} [okCallback] 点击确定后回调
		 * @param {Callback} [cancelCallback] 点击取消后回调
		 * @return {Object} 返回实例
		 * @example
		 * Popup('.test').confirm('js是世界第二好的语言',function(){console.log('是的')},function(){console.log('我再想想')})
		 */
		/** 
		 * 确认框 无需create,可直接调用
		 * @method confirm^2
		 * @memberOf window.Popup#
		 * @param {Object} params 可选参数
		 * @param {String} params.txt 显示文本
		 * @param {String} [params.okTxt=确定] 确定按钮文本
		 * @param {String} [params.cancelTxt=取消] 取消按钮文本
		 * @param {Boolean} [params.mask=true] 是否有遮罩层
		 * @param {Boolean} [params.closeOnMask=false] 点击遮罩层时是否关闭弹框
		 * @param {Boolean} [params.autoSize=true] 弹框大小位置是否自适应,若否则需在css中自行设置
		 * @param {Number} [params.delayCalculate] 打开弹框时延迟计算弹框位置与大小,单位ms,适用于autoSize为true且弹窗打开有耗时动画效果时
		 * @param {Callback} [params.okCallback] 点击确定后回调
		 * @param {Callback} [params.cancelCallback] 点击取消后回调
		 * @return {Object} 返回实例
		 * @example
		 * Popup('#test').confirm({
		 *     txt: 'js是世界第二好的语言',
		 *     okTxt: 'ok',
		 *     cancelTxt: 'cancel',
		 *     mask: true,
		 *     closeOnMask: true,
		 *     autoSize: true,
		 *     delayCalculate: 200,
		 *     okCallback: function(){console.log('就是')},
		 *     cancelCallback: function(){console.log('我再想想')}
		 * })
		 */
		confirm: function() {
			var okTxt = '确定', cancelTxt = '取消', content;

			if (UL.isObject(arguments[0])) {
				txt = arguments[0].txt;
				okTxt = arguments[0].okTxt || okTxt;
				cancelTxt = arguments[0].cancelTxt || cancelTxt;
				this.mask = arguments[0].mask === undefined ? true : arguments[0].mask;
				this.closeOnMask = arguments[0].closeOnMask || false;
				this.autoSize = arguments[0].autoSize === undefined ? true : arguments[0].autoSize;
				this.delayCalculate = arguments[0].delayCalculate;
				this._eventsList.okCallback = arguments[0].okCallback;
				this._eventsList.cancelCallback = arguments[0].cancelCallback;
			} else if (UL.isFunction(arguments[1])) {
				txt = arguments[0];
				this._eventsList.okCallback = arguments[1];
				this._eventsList.cancelCallback = arguments[2];
			} else {
				txt = arguments[0];
			}

			this.prefixClass = 'confirm-';

			content = '<p class="confirm-content">' + txt + '</p><a class="confirm-ok popup-ok">' + okTxt + '</a><a class="confirm-cancel popup-cancel">' + cancelTxt + '</a>';

			this._createDOM(content);
			this._bindEvents();
			this.open();

			return this;
		},

		/**
		 * 提示框 无需create,可直接调用
		 * @method prompt
		 * @memberOf window.Popup#
		 * @param {String} txt 显示文本
		 * @param {Callback} [okCallback] 点击确定后回调
		 * @param {Callback} [cancelCallback] 点击取消后回调
		 * @return {Object} 返回实例
		 * @example
		 * Popup('.test').prompt('世界上最好的语言是什么',function(){console.log('就是这个')},function(){console.log('我再想想')})
		 */
		/** 
		 * 提示框 无需create,可直接调用
		 * @method prompt^2
		 * @memberOf window.Popup#
		 * @param {Object} params 可选参数
		 * @param {String} params.txt 显示文本
		 * @param {String} [params.okTxt=确定] 确定按钮文本
		 * @param {String} [params.cancelTxt=取消] 取消按钮文本
		 * @param {String} [params.placeholder=请输入] 输入框默认文本
		 * @param {Boolean} [params.mask=true] 是否有遮罩层
		 * @param {Boolean} [params.closeOnMask=false] 点击遮罩层时是否关闭弹框
		 * @param {Boolean} [params.autoSize=true] 弹框大小位置是否自适应,若否则需在css中自行设置
		 * @param {Number} [params.delayCalculate] 打开弹框时延迟计算弹框位置与大小,单位ms,适用于autoSize为true且弹窗打开有耗时动画效果时
		 * @param {Callback} [params.okCallback] 点击确定后回调
		 * @param {Callback} [params.cancelCallback] 点击取消后回调
		 * @return {Object} 返回实例
		 * @example
		 * Popup('#test').prompt({
		 *     txt: '世界上最好的语言是什么',
		 *     okTxt: 'ok',
		 *     cancelTxt: 'cancel',
		 *     placeholder: 'js'
		 *     mask: true,
		 *     closeOnMask: true,
		 *     autoSize: true,
		 *     delayCalculate: 200,
		 *     okCallback: function(){console.log('就是这个')},
		 *     cancelCallback: function(){console.log('我再想想')}
		 * })
		 */
		prompt: function() {
			var self = this, 
				okTxt = '确定', 
				cancelTxt = '取消', 
				placeholder = '请输入';

			if (UL.isObject(arguments[0])) {
				txt = arguments[0].txt;
				okTxt = arguments[0].okTxt || okTxt;
				cancelTxt = arguments[0].cancelTxt || cancelTxt;
				placeholder = arguments[0].placeholder || placeholder;
				this.mask = arguments[0].mask === undefined ? true : arguments[0].mask;
				this.closeOnMask = arguments[0].closeOnMask || false;
				this.autoSize = arguments[0].autoSize === undefined ? true : arguments[0].autoSize;
				this.delayCalculate = arguments[0].delayCalculate;
				this._eventsList.okCallback = arguments[0].okCallback;
				this._eventsList.cancelCallback = arguments[0].cancelCallback;
			} else if (UL.isFunction(arguments[1])) {
				txt = arguments[0];
				this._eventsList.okCallback = arguments[1];
				this._eventsList.cancelCallback = arguments[2];
			} else {
				txt = arguments[0];
			}

			this.prefixClass = 'prompot-';

			var content = '<p class="prompot-content">' + txt + '</p><input class="prompot-input" type="text" placeholder=' + placeholder + '><a class="prompot-ok popup-ok">' + okTxt + '</a><a class="prompot-cancel popup-cancel">' + cancelTxt + '</a>';

			this._createDOM(content);
			this._bindEvents();

			// 自定义事件
			var okEl = UD.querySelector(this.containerEl, '.prompot-ok'),
				inputEl = UD.querySelector(this.containerEl, '.prompot-input');

			UE.addEvent(okEl, 'click touchstart', function(e) {
				var val = inputEl.value;

				self._eventsList.okCallback && self._eventsList.okCallback(val);
				self.close();

				if (typeof e.stopPropagation === 'function') {
    				e.stopPropagation();
				} else {
					e.cancelBubble = true;
				}
			});

			this.open();

			inputEl.focus();

			return this;
		},

		/**
		 * 计算弹框尺寸
		 * @ignore
		 * @private
		 * @memberOf window.Popup#
		 */
		_calculateSize: function() {
			// 重置innerEl尺寸，以使其自适应所包含内容的大小
			this.innerEl.style.width = '';
			this.innerEl.style.height = '';
			
			var adjustWidth = this.innerEl.offsetWidth,
				adjustHeight = this.innerEl.offsetHeight,
				adjustWidthMinusSB = adjustWidth,
				adjustHeightMinusSB = adjustHeight,
				scrollBarWidth,
				rootEl = (this.targetEl === document.body) ? document.documentElement : this.targetEl,
				maxHeight = rootEl.clientHeight,
				maxWidth = rootEl.clientWidth;

			if (adjustWidth > maxWidth - 100) {
				adjustWidth = adjustWidthMinusSB = maxWidth - 100;

				this.innerEl.style.overflowX = 'scroll';
				// scrollBarWidth = scrollBarWidth || this.innerEl.offsetHeight - adjustHeight;
				adjustHeight = this.innerEl.offsetHeight;
				//adjustHeightMinusSB = adjustHeight - scrollBarWidth;
			} else {
				this.innerEl.style.overflowX = 'hidden';
			}
			if (adjustHeight > maxHeight - 80) {
				adjustHeight = adjustHeightMinusSB = maxHeight - 80;

				this.innerEl.style.overflowY = 'scroll';
				//scrollBarWidth = scrollBarWidth || this.innerEl.offsetWidth - adjustWidth;
				adjustWidth = this.innerEl.offsetWidth;
				//adjustWidthMinusSB = adjustWidth - scrollBarWidth;
			} else {
				this.innerEl.style.overflowY = 'hidden';
			}

			this.innerEl.style.width = adjustWidth + 'px';
			this.innerEl.style.height = adjustHeight + 'px';
			this.containerEl.style.width = adjustWidth + 'px';
			this.containerEl.style.height = adjustHeight + 'px';

			if (this.mask) {
				this.containerEl.style.top = '50%';
				this.containerEl.style.left = '50%';
				this.containerEl.style.marginTop = -adjustHeight/2 + 'px';
				this.containerEl.style.marginLeft = -adjustWidth/2 + 'px';
			} else {
				this.containerEl.style.position = 'relative';
				this.containerEl.style.top = 0;
				this.containerEl.style.left = 0;
				this.containerEl.style.marginTop = 0;
				this.containerEl.style.marginLeft = 0;

				this.popupEl.style.width = adjustHeight + 'px';
				this.popupEl.style.height = adjustHeight + 'px';
				this.popupEl.style.top = '50%';
				this.popupEl.style.left = '50%';
				this.popupEl.style.marginTop = -adjustHeight/2 + 'px';
				this.popupEl.style.marginLeft = -adjustWidth/2 + 'px';
			}
		},
		/**
		 * 创建弹框DOM
		 * @ignore
		 * @private
		 * @memberOf window.Popup#
		 * @param {String} content 弹框内容HTML字符串
		 */
		_createDOM: function(content) {
			var popupEl = this.popupEl = document.createElement('div'),
				containerEl = this.containerEl = document.createElement('div'),
				innerEl = this.innerEl = document.createElement('div'),
				maskEl = this.maskEl = document.createElement('div'),
				closeEl = this.closeEl = document.createElement('div');

			this.targetEl.style.position = 'relative';

			// 如果目标元素是body，则对弹框进行fixed定位
			this._addPrefixClass(popupEl, 'popup-wrapper');
			if (this.targetEl === document.body) {
				UD.addClass(popupEl, 'popup-inwindow');
			}

			// 若有遮罩层则创建之
			if (this.mask) {
				this._addPrefixClass(maskEl, 'popup-mask');
				popupEl.appendChild(maskEl);
			}

			// 创建关闭按钮
			this._addPrefixClass(closeEl, 'popup-close');
			containerEl.appendChild(closeEl);

			// 创建内容包裹节点
			this._addPrefixClass(containerEl, 'popup-container');
			this._addPrefixClass(innerEl, 'popup-inner');
			innerEl.innerHTML = content;
			containerEl.appendChild(innerEl);
			popupEl.appendChild(containerEl);

			popupEl.style.display = 'none';
			this.targetEl.appendChild(popupEl);
		},
		/**
		 * 添加前缀class
		 * @ignore
		 * @private
		 * @memberOf window.Popup#
		 * @param {Element} ele class添加节点
		 * @param {String} cls 未加前缀的原class
		 */
		_addPrefixClass: function(ele, cls) {
			var newCls = this.prefixClass ? this.prefixClass + cls + ' ' + cls : cls;
			UD.addClass(ele, newCls);
		},
		/**
		 * 绑定弹框事件
		 * @ignore
		 * @private
		 * @memberOf window.Popup#
		 */
		_bindEvents: function() {
			var self = this;

			UE.addEvent(this.containerEl, 'click touchstart', function(e){
				self._onContainer.call(self, e);
			});

			if (this.mask) {
				UE.addEvent(this.maskEl, 'click touchstart', function(e){
					self._onMask.call(self, e);
				});
			} 
		},
		/**
		 * 内容层事件
		 * @ignore
		 * @private
		 * @memberOf window.Popup#
		 * @param {Event} e 事件对象
		 */
		_onContainer: function(e) {
			var e = e || window.event,
				src = e.target || e.srcElement,
				eventsList = this._eventsList;

			switch (true){
				case UD.hasClass(src, 'popup-close'):
					eventsList.beforeClose && eventsList.beforeClose();
					this.close();
					eventsList.afterClose && eventsList.afterClose();
					break;
				case UD.hasClass(src, 'popup-ok'):
					this.close();
					eventsList.okCallback && eventsList.okCallback();
					break;
				case UD.hasClass(src, 'popup-cancel'):
					this.close();
					eventsList.cancelCallback && eventsList.cancelCallback();
			}
		},
		/**
		 * 遮罩层事件
		 * @ignore
		 * @private
		 * @memberOf window.Popup#
		 * @param {Event} e 事件对象
		 */
		_onMask: function(e) {
			var e = e || window.event,
				src = e.target || e.srcElement,
				eventsList = this._eventsList;

			if (this.closeOnMask) {
				eventsList.beforeClose && eventsList.beforeClose();
				this.close();
				eventsList.afterClose && eventsList.afterClose();
			}
		},
		/**
		 * 自定义事件列表
		 * @ignore
		 * @private
		 * @memberOf window.Popup#
		 * @param {Event} e 事件对象
		 */
		_eventsList: {}
	}

	Popup.prototype.constructor = Popup;

	window.Popup = function(selector) {
		return new Popup(selector);
	}

	/* 依赖函数 */
	function eventHandler(els, types, callback, onCatch, handler) {
		onCatch = onCatch ? true : false;

		var fn = {
			add: ['addEventListener', 'attachEvent'],
			remove: ['removeEventListener', 'detachEvent']
		},
		fn1 = fn[handler][0],
		fn2 = fn[handler][1];

		var eventStream = document[fn1] ? true : false,
			typeArr = types.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '').split(' '),
			elArr = [].concat(els);

		for (var i = 0, len1 = elArr.length; i < len1; i++) {
	        var o = elArr[i];
	        for (var j = 0, len2 = typeArr.length; j < len2; j++) {
	        	eventStream ? o[fn1](typeArr[j], callback, onCatch) : o[fn2]("on" + typeArr[j], callback);
	        }
	    }
	}
	function addEvent(els, types, callback, onCatch) {
		eventHandler(els, types, callback, onCatch, 'add');
	}

	function removeEvent(els, types, callback, onCatch) {
		eventHandler(els, types, callback, onCatch, 'remove');
	}
	function isType(type) {
		return function(obj) {
			return Object.prototype.toString.call(obj) === '[object ' + type + ']';
		}
	}
	function querySelector() {
		var root, selector;
		if (typeof arguments[1] === 'undefined') {
			root = document;
			selector = arguments[0];
		} else {
			root = arguments[0];
			selector = arguments[1];
		}
		return root.querySelector(selector);
	}
	function hasClass(el, cls) {
		var reg = new RegExp('(^|\\s)' + cls + '($|\\s)');

		return reg.test(el.className);
	}
	function addClass(el, cls) {
		if (!hasClass(el, cls)) {
			return el.className += ' ' + cls;
		}
	}
	function removeClass(el, cls) {
		var reg = new RegExp('(^|\\s)' + cls + '($|\\s)', 'g');

		return el.className = el.className.replace(reg, '');
	}
})();
//
// This file is part of the Savory Framework
//
// Copyright 2011-2012 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the LGPL version 3.0:
// http://www.gnu.org/copyleft/lesser.html
//
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

document.executeOnce('/savory/service/rpc/')
document.executeOnce('/prudence/resources/')
document.executeOnce('/sincerity/templates/')
document.executeOnce('/sincerity/xml/')
document.executeOnce('/sincerity/jvm/')
document.executeOnce('/mongo-db/')

var Savory = Savory || {}

/**
 * Integration with Sencha's Ext JS client framework. Extensible
 * server-side implementations for Ext.data.Store and Ext.tree.TreeLoader,
 * with MongoDB integration.
 * <p>
 * See front-end companion utilities:
 *   /web/static/script/ext/savory/sencha.js
 * 
 * @namespace
 * @see Visit <a href="http://www.sencha.com/products/extjs/">Ext JS</a>
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Sencha = Savory.Sencha || function() {
	/** @result Public as Savory.Sencha */
    var Public = {}
    
    Public.extJsHead = function(conversation, theme) {
    	var filler = {
    		pathToBase: conversation.pathToBase,
    		theme: theme || 'ext-all'
    	}
    	println('<!-- Ext JS -->');
    	println('<link rel="stylesheet" type="text/css" href="{pathToBase}/style/ext-js/style/css/{theme}.css" id="ext-theme" />'.cast(filler));
    	println('<script type="text/javascript" src="{pathToBase}/scripts/ext-js/ext-all.js"></script>'.cast(filler));
    	println('<script type="text/javascript" src="{pathToBase}/scripts/savory/integration/ext-js.js"></script>'.cast(filler));
    }

	/**
	 * Translates form fields into the format expected by Sencha forms.
	 * <p>
	 * You can translate the result into client-side code via Sincerity.JSON.to(result, true, true).
	 * See {@link Sincerity.JSON#to}. 
	 * 
	 * @param conversation The Savory conversation
	 * @param {Prudence.Resources.Form} form The form
	 * @param [results] The results from a call to {@link Prudence.Resources.Form#handle}, used it initialize field
	 *        values
	 * @param {Boolean} [clientValidation=form.clientValidation] True to include validator
	 * @param {Boolean} [clientMasking=true] True to include maskRe
	 * @returns {Array}
	 */
	Public.getFormFields = function(conversation, form, results, clientValidation, clientMasking) {
		clientValidation = Sincerity.Objects.ensure(clientValidation, form.clientValidation)
		clientMasking = Sincerity.Objects.ensure(clientMasking, true)
		var textPack = Sincerity.Objects.exists(conversation) ? Savory.Internationalization.getCurrentPack(conversation) : null

		var sencha = []
		
		for (var name in form.fields) {
			var field = form.fields[name]
			var senchaField = {name: name, fieldLabel: field.label}
			
			if (results) {
				if (results.values && results.values[name]) {
					senchaField.value = results.values[name]
				}
				if (results.errors && results.errors[name]) {
					senchaField.activeError = results.errors[name]
				}
			}
			else if (field.value) {
				senchaField.value = field.value
			}
			
			switch (field.type) {
				case 'hidden':
					senchaField.xtype = 'hiddenfield'
					break
				case 'password':
					senchaField.inputType = 'password'
					break
				case 'reCaptcha':
					senchaField.xtype = 'recaptchafield'
					senchaField.code = field.code
					break
				case 'reCaptchaChallenge':
					senchaField.xtype = 'recaptchachallengefield'
					break
			}

			var validation
			if (clientValidation) {
    			if (field.required) {
    				senchaField.allowBlank = false
    			}

				var validator = field.validator
				validation = Sincerity.Validation[field.type || 'string']
				
				var allowed = field.clientValidation
				if (!Sincerity.Objects.exists(allowed) && validation) {
					allowed = validation.clientValidation
				}
				if (!Sincerity.Objects.exists(allowed)) {
					allowed = true
				}
				
				if (allowed) {
					var textKeys = field.textKeys
					if (!textKeys && validation && validation.textKeys) {
						textKeys = validation.textKeys
					}
					
					if (textKeys) {
						senchaField.textPack = {text: {}, get: function(name) { return this.text[name]; }}
						for (var t in textKeys) {
							var textKey = textKeys[t]
							senchaField.textPack.text[textKey] = textPack ? textPack.get(textKey) : textKey
						}
					}
					
					if (!validator) {
						if (validation && validation.fn) {
							validator = validation.fn
						}
					}
					
					if (validator) {
						if (typeof validator != 'function') {
							validator = eval(validator)
						}
						senchaField.validator = validator
					}
				}
			}
			
			if (clientMasking) {
				var mask = field.mask
				if (!mask) {
					if (!validation) {
						validation = Sincerity.Validation[field.type || 'string']
					}
					if (validation && validation.mask) {
						mask = validation.mask
					}
				}
    			if (mask) {
    				senchaField.maskRe = mask
    			}
			}
			
			Sincerity.Objects.merge(senchaField, field.sencha)

			sencha.push(senchaField)
		}
		
		return sencha
	}
	
	/**
	 * @class
	 * @name Savory.Sencha.TreeResource
	 * @augments Savory.REST.Resource
	 * 
	 * @param config
	 */
	Public.TreeResource = Sincerity.Classes.define(function(Module) {
		/** @exports Public as Savory.Sencha.TreeResource */
		var Public = {}

		/** @ignore */
		Public._inherit = Savory.REST.Resource

		/** @ignore */
		Public._configure = ['separator', 'rootId', 'idProperty', 'childrenProperty', 'getNodeText']

		/** @ignore */
		Public._construct = function(config) {
			this.separator = this.separator || '/'
			this.rootId = this.rootId || this.separator
			this.idProperty = this.idProperty || 'id'
			this.childrenProperty = this.childrenProperty || 'documents'

			arguments.callee.overridden.call(this, this)
		}
		
		Public.mediaTypes = [
			'application/json',
			'application/java',
			'text/plain',
			'text/html'
		]

		Public.getChildren = function(id) {
			node = this.getNode(id)
			
			var children = []
			
			if (Sincerity.Objects.exists(node)) {
				if (id == this.rootId) {
					id = ''
				}
				if (Sincerity.Objects.isDict(node)) {
					for (var c in node) {
						addNode.call(this, id + this.separator + c, c, node[c], children)
					}
				}
				else {
					addNode.call(this, id, null, node, children)
				}
			}
			
			return children
		}

		Public.doGet = function(conversation) {
			var query = Prudence.Resources.getQuery(conversation, {human: 'bool'})
			var id = String(decodeURIComponent(conversation.locals.get(this.idProperty)))
			query.human = query.human || false

			var node = this.getChildren(id)
			
			if (!Sincerity.Objects.exists(node)) {
				return Prudence.Resources.Status.ClientError.NotFound
			}
			
			if (conversation.mediaTypeName == 'application/java' && conversation.internal) {
				return node
			}
			else if (conversation.mediaTypeName == 'text/html') {
				return '<html><body><pre>' + Sincerity.JSON.to(node, true).escapeElements() + '</pre></body></html>'
			}
			else {
				return Sincerity.JSON.to(node, query.human)
			}
		}
		
		Public.getNodeText = function(id, node) {
			return id
		}
		
		//
		// Private
		//
		
		function addNode(id, nodeId, node, array) {
			if (!Sincerity.Objects.exists(nodeId)) {
				var paths = id.split(this.separator)
				if (paths.length > 0) {
					nodeId = paths[paths.length - 1]
				}
			}
			
			if (Sincerity.JVM.instanceOf(node, com.mongodb.DBRef)) {
				array.push({
					id: id,
					text: Sincerity.XML.escapeElements(this.getNodeText(nodeId, null))
				})
				return
			}
			
			var n = {
				id: id,
				text: Sincerity.XML.escapeElements(this.getNodeText(nodeId, node)),
				expanded: true
			}
			array.push(n)

			if (Sincerity.Objects.isDict(node)) {
				var children = n[this.childrenProperty] = []
				for (var c in node) {
					addNode.call(this, id + this.separator + c, c, node[c], children)
				}
			}
			else {
				n.leaf = true
			}
		}

		return Public
	}(Public))

	Public.InMemoryTreeResource = Sincerity.Classes.define(function(Module) {
		/** @exports Public as Savory.Sencha.InMemoryTreeResource */
		var Public = {}

		/** @ignore */
		Public._inherit = Module.TreeResource

		Public._configure = ['tree']

		/** @ignore */
		Public._construct = function(config) {
			arguments.callee.overridden.call(this, this)
		}

		Public.getNode = function(id) {
			if (id == this.rootId) {
				return this.tree
			}
			else {
				var node
				var paths = id.split(this.separator)
				for (var p in paths) {
					var path = paths[p]
					if (path) {
						node = node[path]
						if (!Sincerity.Objects.exists(node)) {
							break
						}
					}
				}
				return node
			}
		}
		
		return Public
	}(Public))
	
	/**
	 * @class
	 * @name Savory.Sencha.MongoDbTreeResource
	 * @augments Savory.Sencha.TreeResource
	 * 
	 * @param config
	 */
	Public.MongoDbTreeResource = Sincerity.Classes.define(function(Module) {
		/** @exports Public as Savory.Sencha.MongoDbTreeResource */
		var Public = {}

		/** @ignore */
		Public._inherit = Module.TreeResource

		Public._configure = ['collection', 'query', 'field']

		/** @ignore */
		Public._construct = function(config) {
			this.collection = Sincerity.Objects.isString(this.collection) ? new MongoDB.Collection(this.collection) : this.collection
			this.separator = this.separator || '/'
			this.rootId = this.rootId || this.separator
			this.childrenProperty = this.childrenProperty || 'documents'
			
			arguments.callee.overridden.call(this, this)
		}

		Public.getNode = function(id) {
			var query = this.query || {_id: {$oid: id}}
			
			if (Sincerity.Objects.exists(this.field)) {
				var fields = {}
				fields[this.field] = 1
				var node = this.collection.findOne(query, fields)
				node = node ? node[this.field] : null
			}
			else {
				var node = this.collection.findOne(query)
				if (Sincerity.Objects.exists(node)) {
					delete node._id
				}
			}
			
			if (Sincerity.Objects.exists(node) && (id != this.rootId)) {
				var paths = id.split(this.separator)
				for (var p in paths) {
					var path = paths[p]
					if (path) {
						node = node[path]
						if (!Sincerity.Objects.exists(node)) {
							break
						}
						else if (Sincerity.JVM.instanceOf(node, com.mongodb.DBRef)) {
							var collection = new MongoDB.Collection(node.ref, {db: node.getDB()})
							node = collection.findOne({_id: {$oid: node.id}})
							if (Sincerity.Objects.exists(node)) {
								if (Sincerity.Objects.exists(this.field)) {
									node = node[this.field]
								}
								else {
									delete node._id
								}
							}
						}
					}
				}
			}
			
			return node
		}
		
		return Public
	}(Public))
	
	/**
	 * An implementation of Ext Direct, an RPC protocol supported by Ext JS
	 * and Sencha Touch.
	 *
	 * @class
	 * @name Savory.Sencha.DirectResource
	 * @augments Savory.RPC.Resource
	 * 
	 * @param config
	 * @param {Object[]} [config.namespaces] A dict of namespaces
	 * @param {Object[]} [config.objects] A dict of objects
	 */
	Public.DirectResource = Sincerity.Classes.define(function(Module) {
		/** @result Public as Savory.Sencha.DirectResource */
	    var Public = {}

	    /** @ignore */
	    Public._inherit = Savory.RPC.Resource

	    /** @ignore */
	    Public._configureOnly = ['name', 'namespaces', 'objects']

	    /** @ignore */
	    Public._construct = function(config) {
	    	arguments.callee.overridden.call(this, this)
	    }

	    Public.mediaTypes = [
 			'application/json',
 			'application/x-www-form-urlencoded',
 			'text/plain'
 		]
	    
	    Public.doGet = function(conversation) {
	    	var query = Prudence.Resources.getQuery(conversation, {
	    		namespace: 'string',
	    		human: 'bool'
	    	})
	    	
	    	// Remove query from URL
	    	var url = new org.restlet.data.Reference(conversation.reference)
	    	url.query = null
	    	url = String(url)
	    	
	    	var result = {
	    		type: 'remoting',
	    		url: url,
	    		actions: {}
	    	}
	    	if (this.name) {
	    		result.namespace = this.name
	    	}
	    	
	    	for (var n in this.namespaces) {
	    		var methods = this.namespaces[n]
	    		var action = result.actions[n] = []
	    		for (var m in methods) {
	    			var method = methods[m]
	    			var directMethod = {
	    				name: m,
	    				len: method.arity
	    			}
	    			action.push(directMethod)
	    		}
	    	}
	    	
	    	return Sincerity.JSON.to(result, query.human || false)
	    }
	    
	    Public.doPost = function(conversation) {
	    	var query = Prudence.Resources.getQuery(conversation, {
	    		namespace: 'string',
	    		human: 'bool'
	    	})
	    	query.human = query.human || false

	    	if (query.namespace && (query.namespace != this.name)) {
	    		return Prudence.Resources.Status.ClientError.NotFound
	    	}
	    	
	    	var isWebForm = false
	    	var calls
	    	if (Sincerity.Objects.exists(conversation.entity) && (conversation.entity.mediaType == 'application/x-www-form-urlencoded')) {
	    		isWebForm = true
	    		
	    		// Unpack web form into the regular structure
	    		var web = Prudence.Resources.getEntity(conversation, 'web')
	    		calls = {}
	    		calls.type = web.extType
	    		delete web.extType
	    		calls.tid = web.extTID
	    		delete web.extTID
	    		calls.action = web.extAction
	    		delete web.extAction
	    		calls.method = web.extMethod
	    		delete web.extMethod
	    		calls.upload = (web.extUpload == 'true')
	    		delete web.extUpload
	    		calls.data = []
	    		for (var w in web) {
	    			calls.data.push(web[w])
	    		}
	    	}
	    	else {
	    		calls = Prudence.Resources.getEntity(conversation, 'json')
	    	}

	    	calls = Sincerity.Objects.array(calls)
	    	for (var c in calls) {
	    		var call = calls[c]
	    		if ((call.type != 'rpc') || !call.tid || !call.action || !call.method) {
	    			return Prudence.Resources.Status.ClientError.BadRequest
	    		}
	    	}

	    	var results = []
	    	
	    	for (var c in calls) {
	    		var call = calls[c]

	    		var result
	    		var namespace = this.namespaces[call.action]
	    		if (namespace) {
	    			var method = namespace[call.method]
	    			if (method) {
						if (call.data && (call.data.length > method.arity)) {
							result = {
								type: 'exception',
								tid: call.tid,
								action: call.action,
								method: call.method,
								message: 'Too many arguments for method: {action}.{method}'.cast(call)
							}
						}
						else {
							var fn = method.fn
							if (fn) {
								try {
    								var context = method.scope ? method.scope : {
    									namespace: n,
    									definition: method,
    									resource: this,
    									conversation: conversation,
    									call: call
    								}
									result = fn.apply(context, call.data)
									result = {
										type: 'rpc',
										tid: call.tid,
										action: call.action,
										method: call.method,
										result: result
									}
								}
								catch (x) {
									var details = Sincerity.Rhino.getExceptionDetails(x)
									result = {
										type: 'exception',
										tid: call.tid,
										action: call.action,
										method: call.method,
										message: details.message,
										where: details.stackTrace
									}
								}
							}
							else {
								result = {
									type: 'exception',
									tid: call.tid,
									action: call.action,
									method: call.method,
									message: 'No function for: {action}.{method}'.cast(call)
								}
							}
						}
    				}
	    		}
	    		
	    		if (!result) {
	    			result = {
	    				type: 'exception',
	    				tid: call.tid,
	    				action: call.action,
	    				method: call.method,
	    				message: 'Unsupported action: {action}'.cast(call)
	    			}
	    		}
	    		
	    		results.push(result)
	    	}
	    	
	    	return Sincerity.JSON.to(results, query.human)
	    }

		return Public
	}(Public))

    return Public
}()

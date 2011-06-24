//
// This file is part of the Savory Framework for Prudence
//
// Copyright 2011 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the LGPL version 3.0:
// http://www.opensource.org/licenses/lgpl-3.0.html
//
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

document.executeOnce('/savory/integration/backend/oauth/')
document.executeOnce('/savory/foundation/objects/')
document.executeOnce('/savory/foundation/classes/')

var Savory = Savory || {}

/**
 * Integration with Twitter's OAuth implementation.
 * <p>
 * See the Savory Authentication module for a full-blown, ready-to-use
 * implementation.
 * 
 * @namespace
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.Twitter = Savory.Twitter || function() {
	/** @exports Public as Savory.Twitter */
    var Public = {}

	/**
	 * Represents a registered Twitter application, which is an OAuth provider.
	 * 
	 * @class
	 * @param {String} [consumerKey=application.globals.get('savory.integration.backend.twitter.consumerKey')]
	 * @param {String} [consumerSecret=application.globals.get('savory.integration.backend.twitter.consumerSecret')]
	 * @param {String} [oauthToken=application.globals.get('savory.integration.backend.twitter.oauthToken')] Unused
	 * @param {String} [oauthTokenSecret=application.globals.get('savory.integration.backend.twitter.oauthTokenSecret')] Unused
	 * @param {String} [callbackUri=application.globals.get('savory.integration.backend.twitter.callbackUri')]
	 * @see Savory.OAuth.Provider
	 */
	Public.Application = Savory.Classes.define(function() {
    	/** @exports Public as Savory.Twitter.Application */
        var Public = {}
        
        /** @ignore */
        Public._construct = function(consumerKey, consumerSecret, oauthToken, oauthTokenSecret, callbackUri) {
    		this.provider = new Savory.OAuth.Provider(consumerKey || defaultConsumerKey, consumerSecret || defaultConsumerSecret, requestTokenUri, accessTokenUri, callbackUri || defaulCallbackUri)
        }

        /**
		 * The URI to which the user's browser should be redirected to in order to authenticate.
		 * 
		 * @param {String} from The URI to which we will redirect after authentication
		 * @returns {String}
		 */
		Public.getAuthenticationUri = function(from) {
			var authenticationToken = this.provider.getAuthenticationToken(from, true) // Note: it seems Twitter authorizes us even if we don't use the saved secret!
			if (authenticationToken) {
				return Savory.Resources.buildUri(authenticateUri, {
					oauth_token: authenticationToken
				})
			}
			else {
				return null
			}
		}
		
		/**
		 * @param conversation The Prudence conversation
		 * @returns {Object} The session, should contain at least Twitter 'id' and 'screenName'
		 */
		Public.getSession = function(conversation) {
			var session = this.provider.getSession(conversation)
			if (session) {
				session.screenName = session.attributes.screen_name
			}
			return session
		}
		
		return Public
	}())
	
	//
	// Initialization
	//

	var requestTokenUri = 'https://api.twitter.com/oauth/request_token'
	var accessTokenUri = 'https://api.twitter.com/oauth/access_token'
	var authorizeUri = 'https://api.twitter.com/oauth/authorize'
	var authenticateUri = 'https://api.twitter.com/oauth/authenticate'
	var defaultConsumerKey = application.globals.get('savory.integration.backend.twitter.consumerKey')
	var defaultConsumerSecret = application.globals.get('savory.integration.backend.twitter.consumerSecret')
	var defaultOauthToken = application.globals.get('savory.integration.backend.twitter.oauthToken')
	var defaultOauthTokenSecret = application.globals.get('savory.integration.backend.twitter.oauthTokenSecret')
	var defaultCallbackUri = Savory.Objects.string(application.globals.get('savory.integration.backend.twitter.callbackUri'))
	
	return Public
}()

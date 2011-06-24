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

var Savory = Savory || {}

/**
 * Integration with Microsoft's Messenger Connect API.
 * <p>
 * See the Savory Authentication module for a full-blown, ready-to-use
 * implementation.
 * 
 * @namespace
 * @see Vist <a href="http://msdn.microsoft.com/en-us/library/bb264574.aspx">the Messenger Connect documentation</a>
 * 
 * @author Tal Liron
 * @version 1.0
 */
Savory.MessengerConnect = Savory.MessengerConnect || function() {
	/** @exports Public as Savory.MessengerConnect */
    var Public = {}

	Public.getVerificationUri = function(callbackUri) {
		// Popup window:		
		// Height=375
		// Width=465
		// Status=yes
		// Toolbar=no
		// Menubar=no
		// Location=yes
		// Resizable=yes
		// Scrollbars=yes

		return Savory.Resources.uri({
			uri: verificationUri,
			query: {
				wrap_client_id: clientId,
				wrap_scope: Savory.Objects.array(verificationScope).join(','),
				wrap_callback: callbackUri
			}
		})
	}
	
	//
	// Initialization
	//

	var verificationUri = 'https://consent.live.com/Connect.aspx'
	var restUri = 'http://{locator}.apis.live.net/V{version}/cid-{cid}/{resource}/{collection}/{id}'

	var clientId = application.globals.get('savory.integration.backend.messengerConnect.clientId')
	var verificationScope = application.globals.get('savory.integration.backend.messengerConnect.scope') || ['WL_Contacts.View']
}()

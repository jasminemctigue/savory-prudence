//
// This file is part of the Savory Framework for Prudence
//
// Copyright 2011 Three Crickets LLC.
//
// The contents of this file are subject to the terms of the LGPL version 3.0:
// http://www.gnu.org/copyleft/lesser.html
//
// Alternatively, you can obtain a royalty free commercial license with less
// limitations, transferable or non-transferable, directly from Three Crickets
// at http://threecrickets.com/
//

document.executeOnce('/savory/integration/backend/pay-pal/')

/** @ignore */
function handleInit(conversation) {
    conversation.addMediaTypeByName('text/plain')
}

/** @ignore */
function handleGet(conversation) {
	var expressCheckout = Savory.PayPal.getExpressCheckout(conversation)
	if (expressCheckout) {
		var result = expressCheckout.complete()
		if (result) {
			return 'Payment succeeded!\n' + Sincerity.JSON.to(result, true)
		}
	}
	else if (Savory.PayPal.cancelOrder(conversation)) {
		if (conversation.query.get('PayerID')) {
			return 'Invalid payment!'
		}
		else {
			return 'Buyer cancelled payment!'
		}
	}
	
	return 'Payment failed!'
}

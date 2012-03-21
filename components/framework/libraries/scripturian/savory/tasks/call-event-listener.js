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

document.executeOnce('/savory/service/events/')
document.executeOnce('/sincerity/json/')

function call(context) {
	if (context) {
		context = Sincerity.JSON.from(context, true)
		if (context.event && context.listener) {
			Savory.Events.callListener(context.event, context.listener, context.context)
		}
	}
}

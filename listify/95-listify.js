/**
 * Copyright 2016 Tom Lodge
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/


var _extractkeys = (payload) => {
	if (payload.values) {
		if (Array.isArray(payload.values)) {
			return Object.keys(payload.values.reduce((acc, obj) => {
				return Object.keys(obj).reduce((acc, key) => {
					acc[key] = true;
					return acc;
				}, acc);
			}, {}));
		} else {
			return Object.keys(payload.values)
		}
	}
	return Object.keys(payload);
}

var _extractdata = (payload) => {
	if (payload.values) {
		if (Array.isArray(payload.values)) {
			return payload.values;
		} else {
			return Object.keys(payload.values).reduce((acc, key) => {
				return [...acc, JSON.stringify(payload.values[key])];
			}, []);
		}
	}
	return [payload];
}

const _aContainsAllOfb = (a, b) => {

	if (a.length <= 0)
		return false;

	return a.reduce((acc, item) => {
		return acc && b.indexOf(item) != -1;
	}, true);
}

const _personal = (msg, ptype = {}) => {
	const items = Object.keys(msg.payload || {}).map(k => `payload.${k}`);

	const ptypes = ptype[msg.id] || [];

	return items.reduce((acc, item) => {
		return ptypes.reduce((acc, ptype) => {
			if (ptype.required.indexOf(item) !== -1 && _aContainsAllOfb(ptype.required, items)) {
				acc[item] = [...(acc[item] || []), ptype];
			}
			return acc;
		}, acc);
	}, {});
}

module.exports = function (RED) {
	"use strict";

	//Listify assumes that the incoming object with have a payload that either has
	//a single object, or had an object with a values array (though should now be able to handle object too!)

	function Listify(n) {
		// Create a RED node
		console.log("creating listify node")
		RED.nodes.createNode(this, n);

		var sources = {};
		var keys = [];
		var ticks = {};
		var node = this;
		var TICK_TTL = 2;

		this.on('input', function (msg) {

			console.log("listify, getting personal from", JSON.stringify(msg), "and ptype", JSON.stringify(n.ptype || {}));

			const personalfields = _personal(msg, n.ptype);

			if (!sources[msg.payload.id]) {

				//collect list of unique keys of objects contained in the payload values array.  Could
				//assume that all objects will have same attributes and just pull out keys from the
				//first element, but probably better to pick up all.
				var newkeys = _extractkeys(msg.payload);
				//combine current set of keys with new keys discovered above
				keys = keys.concat(newkeys.filter((item) => {
					return keys.indexOf(item) < 0;
				}));
			}

			TICK_TTL = Math.max(Object.keys(sources).length * 2, TICK_TTL);

			//remember last set of values for this data source
			sources[msg.payload.id] = _extractdata(msg.payload);


			//record how many ticks (a tick === datasource event);

			ticks[msg.payload.id] = 0;

			ticks = Object.keys(ticks).reduce(function (acc, key) {
				acc[key] = (key === msg.payload.id) ? ticks[key] : ticks[key] + 1;
				return acc;
			}, {});


			//flush old data          	
			var flushed = false;

			sources = Object.keys(sources).reduce(function (acc, item) {
				if (ticks[item] < TICK_TTL) {
					acc[item] = sources[item];
				} else {
					delete sources[item];
					delete ticks[item];
					flushed = true;
				}
				return acc;
			}, {})

			if (flushed) { //recalculate all keys
				keys = [];

				Object.keys(sources).forEach(function (key) {

					var newkeys = Object.keys(sources[key].reduce(function (acc, obj) {
						return Object.keys(obj).reduce(function (acc, key) {
							acc[key] = true;
							return acc;
						}, acc);
					}, {}));

					//combine current set of keys with new keys discovered above
					keys = keys.concat(newkeys.filter(function (item) {
						return keys.indexOf(item) < 0;
					}));

				});
			}



			//create rows as a combination of all of the last values for each datasource
			var rows = Object.keys(sources).reduce(function (acc, key) {
				return acc.concat(sources[key]);
			}, []);

			msg.type = "list";
			msg.sourceId = node.id;
			//msg.ptype = _ptype((node.ptype || {})[msg.id]);

			msg.payload = {
				values: {
					timestamp: Date.now(),
					keys: keys,
					rows: rows,
				}
			};

			//console.log("sending message");
			console.log("listify, sending", JSON.stringify(msg));
			node.send(msg);

		});

		this.on("close", function () {

		});
	}

	// Register the node by name. This must be called before overriding any of the
	// Node functions.
	RED.nodes.registerType("listify", Listify);

}
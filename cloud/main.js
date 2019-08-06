Parse.Cloud.define("upcLookup", function(request) {
	const upc = request.params.upc;
	return Parse.Cloud.httpRequest({
		url: 'https://api.upcitemdb.com/prod/trial/lookup',
		params: {
			upc: upc
		}
	}).then(httpResponse => {
		const data = httpResponse.data;
		if (httpResponse.status == 200 && data.total > 0) {
			const item = data.items[0];
			return {
				name: item.title,
				notes: item.description,
				barcodeInfo: item
			};
		}else {
			throw "Not found"
		}
	});
})
Parse.Cloud.define("upcLookup", function(request, response) {
	const upc = request.params.upc;
	Parse.Cloud.httpRequest({
		url: 'https://api.upcitemdb.com/prod/trial/lookup',
		params: {
			upc: upc
		}
	}).then(httpResponse => {
		const data = httpResponse.data;
		if (httpResponse.status == 200 && data.count > 0) {
			const item = data.items[0];
			response.success({
				name: item.title,
				notes: item.description,
				barcodeInfo: item
			});
		}else {
			response.error("Not found");
		}
	},error => {
		response.error(error);
	})
})
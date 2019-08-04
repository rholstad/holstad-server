Parse.Cloud.define("upcLookup", function(request, response) {
	const upc = request.params.upc;
	Parse.Cloud.httpRequest({
		url: 'https://api.upcitemdb.com/prod/trial/lookup',
		params: {
			upc: upc
		}
	}).then(httpResponse => {
		response.success(httpResponse);
	},error => {
		response.error(error);
	})
})
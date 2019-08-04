Parse.Cloud.define("upcLookup", function(request, response) {
	const upc = request.params.upc;
	Parse.Cloud.httpRequest({
		url: 'https://api.upcitemdb.com/prod/trial/lookup',
		params: {
			upc: upc
		}
	}).then(httpResponse => {
		if (httpResponse.status == 200) {
			response.success(httpResponse.data);
		}else {
			response.error("Not found");
		}
	},error => {
		response.error(error);
	})
})
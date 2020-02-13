jQuery.fn.tableToCSV = function(ftitle) {
    
    var clean_text = function(text){
        text = text.replace(/"/g, '""');
        return '"'+text+'"';
    };
    
	$(this).each(function(){
			var table = $(this);
			var caption = ftitle;//$(this).find('#feature-title').text();
			var title = [];
			var rows = [];

			$(this).find('tr').each(function(){
				var data = [];
				$(this).find('th').each(function(){
                    var text = clean_text($(this).text());
					data.push(text);
					});
				$(this).find('td').each(function(){
                    var text = clean_text($(this).text());
					data.push(text);
					});
				data = data.join(",");
				rows.push(data);
				});
			title = title.join(",");
			var ts = new Date();

			rows.push("Source: 2020 SRF Disadvantaged Community Data Application");

			rows.push(ts);
			rows = rows.join("\n");

			var csv = rows;
			var uri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
			var download_link = document.createElement('a');
			download_link.href = uri;

			if(caption==""){
				download_link.download = ts+".csv";
			} else {
				download_link.download = caption+".csv";
			}
			document.body.appendChild(download_link);
			download_link.click();
			document.body.removeChild(download_link);
	});
    
};

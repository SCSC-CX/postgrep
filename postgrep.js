
function renderStatus(statusText) {
  document.getElementById('status').textContent = statusText;
}

// url ��û ����� json���� �Ľ�
function getJSONResults(url, callback, errorCallback) {
	var x = new XMLHttpRequest();
	x.open('GET', url);
	x.onload = function() {
		var j = JSON.parse(x.responseText);
		if (!j) {
			errorCallback('Invalid response from Facebook!');
			return;
		}
		if (x.status != 200) {
			errorCallback(j.error.message);
			return;
		}
		callback(j);
	};
	x.onerror = function() {
		errorCallback(url);
	};
	x.send();
}

var obj;

function search(url) {

	// url�� ������� ���������� �о url ����
	if (!url || url == '')  {
		var token = document.getElementById('token').value;
		if (token == '') {
			renderStatus('token is required!');
			return;
		}
		url = 'https://graph.facebook.com/me?fields=posts.limit(50)&access_token=' + token;
	}

	// searchStr
	var searchStr = document.getElementById('searchstr').value;
	if (searchStr == '') {
		renderStatus('text to search is required!');
		return;
	}

	renderStatus('searching: ' + searchStr);

	// url ��û
	getJSONResults(url, function(j) {
		obj = j;
		var re = new RegExp(searchStr, "i");
		var out = "";
		// "{ data: [...] }" ������ ���� �ְ�, "{ posts { data: [...] } }" ������ ���� �ִ�.
		var data = j.data;
		if (!data)
			data = j.posts.data;

		// "data: [...]"
		for (var i = 0; i < data.length; i++) {
			if (!data[i] || !data[i].message || !data[i].message.search)
				continue;
			if (data[i].message.search(re) > 0) {
				// searchStr�� �ִ� ����Ʈ �߰�
				// id�� "userid_messageid" ����
				var pos = data[i].id.indexOf('_');
				// �ش� ����Ʈ�� ��ũ�� �����ؼ� ����Ʈ �޽����� ���
				out += '<p><a href="http://facebook.com/' + data[i].id.substring(0,pos) + '/posts/' + data[i].id.substring(pos+1) + '" target="_blank">[' + data[i].type + '] ' + data[i].created_time + '</a><br>';
				out += data[i].message.replace(re, '<b style="color:red;background-color:yellow">' + searchStr + '</b>') + '</p>\n';
			}
	}
	if (out == "")
		out = "No results...<p\n>";
	out += '<p>\n';

	// "{ paging: {...} }" ������ ���� �ְ�, "{ posts { paging: {...} } }" ������ ���� �ִ�.
	var paging = j.paging;
	if (!paging)
		paging = j.posts.paging;
	
	// ���� ������ �˻� ��ư
	if (paging.previous) {
		out += '<button id="prev">previous</button> ';
	}
	// ���� ������ �˻� ��ư
	if (paging.next) {
		out += '<button id="next">next</button>';
	}

	// �ϼ��� HTML �ڵ� ����
    document.getElementById('results').innerHTML = out;
	
	// ���� ������, ���� ������ ��ư�� Ŭ�� �̺�Ʈ ����
	document.getElementById('prev').addEventListener('click', function(e) {
		search(paging.previous.replace('%amp;','&'));
	});
	document.getElementById('next').addEventListener('click', function(e) {
		search(paging.next.replace('%amp;','&'));
	});
  },
  function(errorMessage) {
      renderStatus('Cannot search Facebook. ' + errorMessage);
  });
}

function startSearch(e) {
	search();
}

document.addEventListener('DOMContentLoaded', function() {
	// �˻� ��ư Ŭ�� �̺�Ʈ
	document.getElementById('searchbtn').addEventListener('click', startSearch);
});

// �ͽ��ټǿ��� �޽����� �޾��� ��
chrome.runtime.onMessage.addListener(function(msg, _, sendResponse) {
	// �޽����� ��ū�� �˻� ���ڿ��� �����ϸ� �������� �ٷ� ����
	if (msg.token)
		document.getElementById('token').value = msg.token;
	if (msg.searchStr)
		document.getElementById('searchstr').value = msg.searchStr;
	// �˻� ����
	if (msg.searchNow)
		search();
});

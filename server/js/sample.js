$('#pingBtn').on('click', () => {
  $.get('http://localhost:30000/api/ping', (data) => {
    $('#result').text(JSON.stringify(data, null, 2));
  });
});

$('#saveBtn').on('click', () => {
  const data = {
    member1: $('#m1').val(),
    member2: $('#m2').val(),
    member3: $('#m3').val(),
    member4: $('#m4').val(),
  };

  $.ajax({
    url: 'http://localhost:30000/api/member-sets',
    method: 'POST',
    contentType: 'application/json',
    data: JSON.stringify(data),
    success: (res) => {
      $('#dbResult').text('保存成功 ID=' + res.id);
    },
    error: () => {
      $('#dbResult').text('保存失敗');
    }
  });
});


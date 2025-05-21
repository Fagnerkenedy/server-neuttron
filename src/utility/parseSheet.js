const XLSX = require("xlsx");

const ArrToJsonKeys = (arr) => {
  let response = {};
  arr.map((key) => (response[key] = null));
  return response;
};

module.exports.parseSheet = (filename, skipLines) => {
  skipLines = skipLines || 1;
  var workbook = 0;
  try {
    workbook = XLSX.readFile(filename);
  } catch (err) {
    return;
  }




  var sheet_name_list = workbook.SheetNames;

  const data = sheet_name_list.map((name) => {
    let data = [];

    var worksheet = workbook.Sheets[name];
    var headers = {};

    Object.keys(worksheet).map((column) => {
      if (column[0] === "!") return;
      let tt = 0;
      for (var i = 0; i < column.length; i++) {
        if (!isNaN(column[i])) {
          tt = i;
          break;
        }
      }

      var col = column.substring(0, tt);
      var row = parseInt(column.substring(tt));
      //var value = worksheet[column].v;
      var value = worksheet[column].w;

      //store header names
      if (row == skipLines && value) {
        headers[col] = value;
        return;
      }

      if (!data[row])
        data[row] = ArrToJsonKeys(
          Object.keys(headers).map((col) => headers[col])
        );
      data[row][headers[col]] = value;
    });

    if (data.length) {
      data.shift();
      data.shift();
    }

    data = data.filter(function (el) {
      return el != null;
    });

    return { name, data };
  });

  const associate = {};
  data.map((sheet) => {
    associate[sheet.name] = sheet.data;
  });

  return associate;
};

var xslx = require("xlsx");
var fs = require('fs');
// const zoho = require("importzoho");
//const { depara: columns } = require("../../utils/depara.js");
const { parseSheet } = require("../../utility/parseSheet.js");
// const { getTags } = require("../../utils/getTags");
// const convertDate = require("../../utils/convertDate")
// const convertPrice = require("../../utils/convertPrice")
const modelIntegration = require("../../model/modelIntegration")
const Field = modelIntegration();

function clean(val) {
  return encodeURIComponent(val.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/(?=[(),])/g, '\\').replace(/\(/g, "%28").replace(/\)/g, "%29"))
}

module.exports = {
  // processing: async (req, res) => {

  //   let { filename } = req.params;


  //   const fileParsed = parseSheet(`./uploads/${filename}`, 0);

  //   if (!fileParsed) return res.status(404).send({ error: "file not found" })
  //   const sheetName = Object.keys(fileParsed)[0];

  //   let sheetRows = fileParsed[sheetName];

  //   sheetRows = sheetRows.map((row) => {
  //     row["Escola Nome"] = row["CNPJ contratante"];
  //     return row;
  //   })

  //   const findColumns = await Field.find()
  //   const columns = {};

  //   findColumns.forEach(record => {
  //     console.log(record);

  //     columns[record.name] = {
  //       api: record.api,
  //       type: record.type,
  //       module: record.module,
  //       lookup_field: record.lookup_field
  //     };
  //   });
  //   console.log(columns);

  //   // Find out what fields are lookup fields
  //   const lookupCols = Object.keys(columns).filter(col => columns[col].type === "lookup" && columns[col].module != "" && columns[col].lookup_field != "")


  //   // Group the unique sheetRows of those columns to mass search
  //   const lookupFields = {};
  //   lookupCols.forEach(key => {
  //     const col = columns[key];
  //     const objKey = `${col.module}|${col.lookup_field}`;
  //     if (!lookupFields.hasOwnProperty(objKey)) {
  //       lookupFields[objKey] = [];
  //     }
  //     sheetRows.forEach(row => {
  //       // Check if row value is already in lookupFields
  //       if (row[key] != '' && row[key] != undefined && row[key] != null) {
  //         // console.log([ lookupFields[objKey], lookupFields[objKey].indexOf(row[key]), objKey, row[key] ]);
  //         if (lookupFields[objKey].indexOf(row[key]) === -1)
  //           lookupFields[objKey].push(row[key]);
  //       }
  //     })
  //   })

  //   // Lookup promises
  //   const lookupPromises = [];
  //   // Loop lookup fields to find in zoho

  //   const lookupResults = {};
  //   Object.keys(lookupFields).forEach(field => {
  //     const split = field.split("|")
  //     console.log(split, lookupFields[field])
  //     const search = zoho.searchRecords(split[0], `(${split[1]}:equals:$_val)`,
  //       (error, res) => {
  //         if (!error) {
  //           res.forEach(row => {
  //             if (!lookupResults.hasOwnProperty(field)) {
  //               lookupResults[field] = {};
  //             }
  //             lookupResults[field][row[split[1]]] = row;
  //           })
  //         }
  //       },
  //       lookupFields[field].map(tmp => {
  //         return { val: tmp }
  //       })
  //     )
  //     lookupPromises.push(search)

  //   })

  //   //get the tags already filled in the registry to concatenate with the added ones

  //   const registersId = sheetRows.map((row) => {
  //     return row["SALESORDERID"].toLowerCase().replace("zcrm_", "");
  //   })

  //   let registers = await zoho.getId("Sales_Orders", registersId);

  //   //verificando se todos os registros existem

  //   let allRegistersFound = true;
  //   registers.forEach(register => {
  //     if (register.error === true) {
  //       allRegistersFound = false;
  //     }
  //   })

  //   if (!allRegistersFound) {
  //     console.log("retornou");
  //     return res.status(404).json({ message: "O Registro Não foi encontrado no CRM" });
  //   }

  //   let registerTags = registers.reduce((acc, register) => {

  //     return {
  //       ...acc,
  //       [register.response.id]: register.response.Tag
  //     }

  //   }, {})



  //   //pega tags cadastradas no crm
  //   const responseTagsNoCrm = await getTags();

  //   const tags = responseTagsNoCrm.tags.reduce((acc, tag) => {
  //     return { ...acc, [tag.name.replace(/[`~!@#$%^&*()_|+\-–=?;:'"" ",.<>\{\}\[\]\\\/]/gi, '')]: tag.id }
  //   }, {})

  //   console.log("Tags:",tags);
  //   Promise.all(lookupPromises).then(() => {
  //     // Build final [object] for API
  //     const apiData = sheetRows.map(row => {
  //       const returnObj = {};
  //       const keys = Object.keys(row);
  //       let id = row["SALESORDERID"];

  //       keys.map(key => {
  //         if (columns.hasOwnProperty(key)) {
  //           const info = columns[key]
  //           // Only add to object if column is filled
  //           if (row[key] != "" && row[key] != null) {
  //             // If column is a lookup field, check if it was looked up and if it did find a value to it
  //             let lookupInfo = null;
  //             if (info.type === "lookup" && lookupResults.hasOwnProperty(`${info.module}|${info.lookup_field}`) && lookupResults[`${info.module}|${info.lookup_field}`].hasOwnProperty(row[key]))
  //               lookupInfo = lookupResults[`${info.module}|${info.lookup_field}`][row[key]];
  //             returnObj[info.api] = fieldTreatment(row[key], info, { lookup: lookupInfo, tags: tags, registerTags: (Object.keys(registerTags).length === 0 ? null : registerTags[id]) });
  //           }
  //         }
  //       })
  //       return returnObj;
  //     })



  //     console.log("apidata: ", JSON.stringify(apiData));
  //     let successArray = [], errorArray = [];

  //     zoho.updateRecords("Sales_Orders", apiData, (error, resultado) => {
  //       successArray.push(...resultado.success)
  //       console.log("successArray",successArray)
  //       errorArray.push(...resultado.error)
  //       console.log("errorArray",errorArray[0].error.details)

  //     }).then(response => {
  //       fs.unlinkSync("./uploads/" + filename, (err) => {
  //         if (err) return res.json({ message: "erro" })
  //       });
  //       return res.send({ success: successArray, error: errorArray });
  //     })
  //   });

  // },
};

function fieldTreatment(value, info, extraInfo) {

  let returnVal = value;


  switch (info.type) {

    case 'id':
      returnVal = `${value}`.toLowerCase().replace("zcrm_", "");
      break;
    case 'currency':
      returnVal = convertPrice(value, 2);
      break;
    case 'percentage':
      returnVal = parseFloat(value)
      break;
    case 'date':
      returnVal = convertDate(value)
      break;
    case 'lookup':
      returnVal = extraInfo.lookup !== null ? extraInfo.lookup.id : null;
      break;
    case 'multiselect':
      returnVal = value.split(";").map(val => val.trim());
      break;
    case 'boolean':
      returnVal = `${value}`.toLowerCase() === 'verdadeiro' ? true : false;
      break;
    case 'number':
      returnVal = parseInt(value);
      break;
    case 'decimal':
    case 'percent':
      returnVal = parseFloat(value);
      break;
    case 'tag':
      if (extraInfo.registerTags) {
        console.log("value: ---------", extraInfo.tags[value.replace(/[`~!@#$%^&*()_|+\-–=?;:'"" ",.<>\{\}\[\]\\\/]/gi, '')]);
        returnVal = [...extraInfo.registerTags, { id: extraInfo.tags[value.replace(/[`~!@#$%^&*()_|+\-–=?;:'"" ",.<>\{\}\[\]\\\/]/gi, '')] }]
      } else {
        returnVal = [{ id: extraInfo.tags[value.replace(/[`~!@#$%^&*()_|+\-–=?;:'"" ",.<>\{\}\[\]\\\/]/gi, '')] }]
      }
    default:
      break;
  }



  return returnVal;
}

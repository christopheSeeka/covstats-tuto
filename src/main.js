// IT'S ALWAYS GOOD PRACTICE TO SANITIZE STRING DATA WHEN YOU DON'T KNOW THE SOURCE THAT ADDED IT TO AVOID XSS ATTACKS
import sanitizeHtml from "sanitize-html";

// IMPORT GETDATA TOOLS, THIS FILE INCLUDE METHODS USED IN DIFFERENT PAGES TO AVOID REPETITION
import Getdata from "./getdata";
// INIT THE TOOLS
let getdata = new Getdata();


// DECLARE YOUR VARIABLES TO STORE THE DIFFERENT CASES NUMBERS
let countActive = 0,
  countRecovered = 0,
  countDeceased = 0,
  countTotal = 0,
  dataGroupedByDate;

// GET/SET PAGE NAME FROM DATA STORAGE
getdata.getDataByKey(getdata.userAddress + "_name").then((res) => {
  // NOTICE THE USE OF SANITIZE, THIS WILL REMOVE ALL POSSIBLE JAVASCRIPT AND UNWANTED CODE
  document.getElementById("title").innerHTML = sanitizeHtml(res[0].value, { allowedTags: [] });
  document.title = sanitizeHtml(res[0].value, { allowedTags: [] });
}).catch(err => {
  console.log("no data")
});

// GET/SET PAGE DESCRIPTION FROM DATA STORAGE
getdata.getDataByKey(getdata.userAddress + "_intro").then((res) => {
  document.getElementById("introtop").innerHTML = sanitizeHtml(res[0].value, { allowedTags: [] });
}).catch(err => {
  console.log("no data")
});

// THIS INITIALIZE AND CONFIGURE OUR TABLE USING DATATABLE PLUBGIN, WE ACTIVATE FILTERS, SORTING ETC.
let initTable = function(){
  if (getdata.userAddress != "" && getdata.userAddress != "undefined") {
    $("#results").DataTable({
      dom:'rt<"showing d-flex justify-content-between mt-3"li><"d-flex justify-content-center mb-3"p><"clear">',
      responsive: true,
      "order": [[ 0, "desc" ]],
      "columnDefs" : [{"targets":1, "type":"date-eu"}],
      "oLanguage": {
         "sInfo": "Showing _START_ to _END_ of _TOTAL_"
       },
      initComplete: function () {
        var counting = 0;
        this.api()
          .columns()
          .every(function () {
            
            var column = this;
            var select = $('<select class="custom-select mr-2 select_'+counting+'"><option value="">All</option></select>')
              .appendTo("#filtering")
              .on("change", function () {
                var val = $.fn.dataTable.util.escapeRegex($(this).val());
                column.search(val ? "^" + val + "$" : "", true, false).draw();
              });
            
              if (counting == 3){
                // WE WANT A SPECIAL SELECT FILTER FOR AGE COLUMN WITH RANGE SELECTION
                select.append(
                  '<option value="" class="1-25">1-25</option><option value="" class="26-50">26-50</option><option value="" class="51-75">51-75</option><option value="" class="76">76+</option>'
                );
              }else{
                column
                  .data()
                  .unique()
                  .sort((a, b) => {
                    return a - b;
                  })
                  .each(function (d, j) {
                    select.append('<option value="' + d + '">' + d + "</option>");
                  });
              }
                
              counting ++
          });

       
        document.querySelector(".dataTables_length select").classList.add("custom-select");
        document.querySelector(".loading").style.display = "none"
        if (dataGroupedByDate){
           initChart(dataGroupedByDate);
        }
      },
    });
  }

  // ADD COLUMNS NAME TO FILTERS
  document.querySelectorAll("thead td").forEach(function(th, index){
    document.querySelector(`#filtering .custom-select:nth-child(${index+1})`).options[0].textContent += " "+th.textContent.toLowerCase()
  })

  // HERE WE OVERRIDE THE DATATABLE FILTER TO CONVERT THE AGE COLUMN INTO A RANGE FILTER
  $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {

      let min = 1
      let max = 130
      let age = parseFloat(data[3]); // use data for the age column

      switch ($(".select_3 option:selected").attr("class")) {
        case "1-25": min = 1; max = 25;
        break;

        case "26-50": min = 26; max = 50;
        break;

        case "51-75": min = 51; max = 75;
        break;

        case "76": min = 76; max = 130;
        break;

        default:
      }

      if ((isNaN(min) && isNaN(max)) ||
        (isNaN(min) && age <= max) ||
        (min <= age && isNaN(max)) ||
        (min <= age && age <= max)) {
        return true;
      }

  });
}

let initChart = function(data){
  // CONVERT DATA INTO CANVASJS READABLE OBJECT
  let canvasjsData = [] 
  Object.keys(data).forEach(function (key, index) {
    canvasjsData.push({ x: new Date(data[key][0].value), y: data[key].length });
  });

  // WE SORT THE DATA BY DATE
  let keysSorted = canvasjsData.sort((a, b) => ( a.x - b.x));

  // WE START CREATE OUR CHART
    var chart = new CanvasJS.Chart("chartContainer", {
      title: {
        text: "",
      },
      axisX: {
        title: "",
        gridThickness: 1,
        valueFormatString: "DD-MMM",
        labelFontSize: 13,
        titleFontSize: 13,
        margin: 10,
        lineColor: "#bbbbbb",
        gridColor: "#bbbbbb",
      },
      axisY: {
        title: "Number of cases",
        gridThickness: 1,
        labelFontSize: 13,
        titleFontSize: 13,
        lineColor: "#bbbbbb",
        gridColor: "#bbbbbb",
      },
      data: [
        {
          type: "line",
          dataPoints: keysSorted,
        },
      ],
    });

    chart.render();
}

// WE GET THE TOTAL NUMBER OF CASES FOR THE CURRENT ACCOUNT/PAGE THEN WE PROCESS THE DATA
getdata.getDataByKey(getdata.userAddress+"_counterNum").then(async res => {

  let getAllJson = await getdata.getDataByKey(getdata.userAddress+"_patient_(.*)_json");

  // HERE WE REDUCE THE DATA FOR THE CHART BY GROUPING BY DATES AND COUNTING NUMBER OF CASES BY DATES
      let dataCopy = JSON.stringify(getAllJson); 
      dataCopy = JSON.parse(dataCopy);
      dataCopy.reduce(function (h, obj) {
        let date, formatedDate;
        date = new Date(parseInt(JSON.parse(obj.value).date));
        formatedDate = (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
        obj.value = formatedDate;
        h[obj.value] = (h[obj.value] || []).concat(obj);
        
        dataGroupedByDate = h
        return h;
      }, {});
    // WE NOW GO OVER ALL THE DATA TO DISPLAY THEM IN THE TABLE
    getAllJson.forEach((entryData) => {
      let entry = JSON.parse(entryData.value);
      let date = new Date(parseInt(entry.date));
      let formatedDate = date.getDate() + '/' + (date.getMonth()+1) + '/' + date.getFullYear()

      // WE CHECK THE STATUS PER ENTRY (1, 2 OR 3) AND ASSIGN CORRESPONDING STRING
      // WE ALSO INCREMENT THE DIFFERENT COUNTER ACCORDING TO IT
      let status = "";

      switch (entry.status) {
        case "1":
          status = "CONFIRMED";
          countActive++;
          break;

        case "2":
          status = "RECOVERED";
          countRecovered++;
          break;

        case "3":
          status = "DECEASED";
          countDeceased++;
          break;

        default:
      }

      countTotal++;

      // WE CREATE OUR NEW TABLE ROW
      let tempTR = `<tr>
        <td class="id">${entry.identifiant}</td>
        <td class="gender">${formatedDate}</td>
          <td class="gender">${sanitizeHtml(entry.gender, { allowedTags: [] })}</td>
          <td class="age">${entry.age}</td>
          <td class="location">${sanitizeHtml(entry.location, { allowedTags: [] })}</td>
          <td class="pec">${sanitizeHtml(entry.pec, { allowedTags: [] })}</td>
          <td class="status">${status}</td>
        </tr>`;

      // WE APPEND THE NEW ROW TO THE TABLE
      document.querySelector("#results tbody").innerHTML += tempTR;
    });

  // SET TOP WIDGET DATA
  document.querySelector(".active").textContent = countActive;
  document.querySelector(".recovered").textContent = countRecovered;
  document.querySelector(".deceased").textContent = countDeceased;
  document.querySelector(".total").textContent = countTotal;

  // SET FOOTER LINKS DATA
  document.getElementById("pageaddress").href = "https://www.wavesexplorer.com"+getdata.explorerSegment+"/address/"+getdata.userAddress
  document.getElementById("pageaddress").innerHTML = getdata.userAddress;
  document.getElementById("smartcontract").href = "https://www.wavesexplorer.com"+getdata.explorerSegment+"/address/"+getdata.dappAddress+"/data"
  document.getElementById("smartcontract").innerHTML = getdata.dappAddress;

  // INITIATE THE TABLE AND DISPLAY IT IF THERE IS DATA
  if (dataGroupedByDate) {
    document.getElementById("chartContainer").style.display = "block";
    initTable();
  }else{
    document.querySelector(".loading").innerHTML = "No data available.";
    document.getElementById("chartContainer").style.display = "none";
  }



}).catch(err => {
  // WE GET AN ERROR IF THERE IS NO ENTRY FOR THE ACCOUNT
  console.log(err)
});
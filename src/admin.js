// IMPORT SIGNER AND PROVIDER LIB
import Signer from "@waves/signer";
import Provider from "@waves.exchange/provider-web";

// IMPORT GETDATA TOOLS, THIS FILE INCLUDE METHODS USED IN DIFFERENT PAGES TO AVOID REPETITION
import Getdata from "./getdata";
// INIT THE TOOLS
let getdata = new Getdata();

// INIT AND CONFIGURE WAVES SIGNER
let signer = new Signer({
  NODE_URL: getdata.nodeUrl,
}); 
let provider = new Provider(getdata.providerUrl);
signer.setProvider(provider);

// A FUNCTION TO RESTE THE FORM AFTER NEW ENTRY
let resetForm = function(){
    document.getElementById("addEntry").value = "ADD NEW CASE";
    document.getElementById("identifiant").value = 0;
    document.getElementById("gender").value = "male";
    document.getElementById("age").value = "";
    document.getElementById("location").value = "";
    document.getElementById("pec").value = "no";
    document.getElementById("status").value = 1;
}

// WE CREATE A FONCTION TO DISPLAY ALERTS
let displayAlert = function (type, msg = "") {
  switch (type) {
    case "clear":
      document.querySelector(".alert-success").classList.add("d-none");
      document.querySelector(".alert-success").innerHTML = "";
      document.querySelector(".alert-danger").classList.add("d-none");
      document.querySelector(".alert-danger").innerHTML = "";
      break;

    case "error":
      document.querySelector(".alert-success").classList.add("d-none");
      document.querySelector(".alert-success").innerHTML = "";
      document.querySelector(".alert-danger").classList.remove("d-none");
      document.querySelector(".alert-danger").innerHTML = msg;
      break;

    case "success":
      document.querySelector(".alert-success").classList.remove("d-none");
      document.querySelector(".alert-success").innerHTML = msg;
      document.querySelector(".alert-danger").classList.add("d-none");
      document.querySelector(".alert-danger").innerHTML = "";
      break;

    default:
  }
};

// EVERYTIME WE CHANGE THE ID SELECTION WE UPDATE THE DATA
document.getElementById("identifiant").addEventListener("change", async function (e) {
document.getElementById("loader").classList.remove("fade0");
  if (e.currentTarget.value == 0) {
    resetForm()
  } else {
    let id = e.currentTarget.value;
    document.getElementById("addEntry").value = "UPDATE CASE NUM " + id;
    let gender = await getdata.getDataByKey(signer._userData.address+"_patient_" + id + "_gender");
    document.getElementById("gender").value = gender[0].value;
    let age = await getdata.getDataByKey(signer._userData.address+"_patient_" + id + "_age");
    document.getElementById("age").value = age[0].value;
    let location = await getdata.getDataByKey(signer._userData.address+"_patient_" + id + "_location");
    document.getElementById("location").value = location[0].value;
    let pec = await getdata.getDataByKey(signer._userData.address+"_patient_" + id + "_pec");
    document.getElementById("pec").value = pec[0].value;
    let status = await getdata.getDataByKey(signer._userData.address+"_patient_" + id + "_status");
    document.getElementById("status").value = status[0].value;
  }
  document.getElementById("loader").classList.add("fade0");
});

// WE CONNECT WITH WAVES SIGNER
document.getElementById("login").addEventListener("click", function(e){
    e.preventDefault();
    signer.login().then(async data => {
        
        // GET/SET PAGE NAME FROM DAPP DATA STORAGE
        getdata.getDataByKey(signer._userData.address + "_name").then((res) => {
          document.getElementById("name").value = res[0].value;
          document.getElementById("title").innerHTML = res[0].value;
          document.title = res[0].value;
        });

        // GET/SET PAGE DESCRIPTION FROM DAPP DATA STORAGE
        getdata.getDataByKey(signer._userData.address + "_intro").then((res) => {
          document.getElementById("introtop").innerHTML = res[0].value;
          document.getElementById("intro").value = res[0].value;
        });

        // DISPLAY CURRENT ACCOUNT ADDRESS AND A LINK TO GO GET THE SEED IF NEWLY CREATED ACCOUNT
        document.getElementById("infosAccount").innerHTML = `Your account address: ${signer._userData.address}<br/><br/><a href="https://waves.exchange/sign-in" target="_blank">Save your private key / Seed</a>`;
        document.getElementById("login").style.display = "none";
        document.getElementById("accordionWrapper").style.display = "block";
        
        // WE POPULATE THE IDENTIFIANT LIST WITH ALL EXISTING ID FROM THE DAPP DATA STORAGE
        let populateList = await getdata.getDataByKey(signer._userData.address + "_patient_(.*)_identifiant") 

        // WE SORT THE DATA BY IDENTIFIANT VALUE
        populateList.sort((a, b) => {
          a = a.value;
          b = b.value;
          return a - b;
        });

        populateList.forEach(id => {
          let option = document.createElement("option")
          option.value = id.value;
          option.innerHTML = id.value;
          document.getElementById("identifiant").appendChild(option);
        })
    }).catch(err => {
        console.log(err)
    })
})

// WE CREATE AN EVENT LISTENER WHEN CLICK ADD OR UPDATE ENTRY
document.getElementById("addEntry").addEventListener("click", async function(e){

    // IF YOU DONT KNOW YOU SHOULDNT BE HERE :)  
    e.preventDefault();

    // HIDE ALERT FROM POSSIBLE PREVIOUS ERROR
    document.querySelector(".alert-danger").classList.add("d-none");
    document.querySelector(".alert-danger").innerHTML = "";

    // WE DEFINE THE TYPE OF ACTION, ETHER ADD OR UPDATE
    let actionType = document.getElementById("identifiant").value == 0 ? "add" : "update"

    // WE CREATE OUR SIGNER TRANSACTION DATA OBJECT
    const data = {
      dApp: getdata.dappAddress,
      call: {
        function: "addUpdateCase",
        args: [
          { type: "integer", value: document.getElementById("identifiant").value, },
          { type: "string", value: document.getElementById("gender").value },
          { type: "integer", value: document.getElementById("age").value },
          { type: "string", value: document.getElementById("location").value },
          { type: "string", value: document.getElementById("pec").value },
          { type: "integer", value: document.getElementById("status").value },
          { type: "integer", value: Date.now() }, // Date.now()
        ],
      },
    };

    // WITH SIGNER THE INVOKESCRIPT TRANSACTION WITH OUR DATA OBJECT AS ARGUMENT THEN WE BROACAST IT
    const tx = await signer
      .invoke(data)
      .broadcast()
      .then((res) => {

        // DISPLAY THE ALERT AND CONFIRMATION MESSAGE
        document.querySelector(".alert-success").classList.remove("d-none");
        if(document.getElementById("identifiant").value == 0){
            document.querySelector(".alert-success").innerHTML = `Cases added, transaction id = <a href="https://www.wavesexplorer.com${getdata.explorerSegment}/tx/${res.id}" target="_blank">${res.id}</a>`;
        }else{
            document.querySelector(".alert-success").innerHTML = `Cases updated, transaction id = <a href="https://www.wavesexplorer.com${getdata.explorerSegment}/tx/${res.id}" target="_blank">${res.id}</a>`;
        }
        
        // RESET THE FORM TO ITS INITIAL STATE
        resetForm()

        // IF WE ADDED AN ENTRY WE NEEDS TO ADD THE NEW <OPTION> ELEMENT INTO THE ID LIST SO WE REQUEST IT THROUGH STATE CHANGE WITH THE TX ID WE JUST BROADCASTED,
        // SINCE PROPAGATION ISNT INSTANT WE NEEDS DO IT THROUGH AN INTERVAL CALL UNTILL IT IS AVAILABLE
        if(actionType == "add"){
          document.getElementById("identifiant").disabled = true;
            document.getElementById("identifiant").options[0].label = "Updating list..."

          let checkStateChange = function(){
              fetch(`${getdata.nodeUrl}/debug/stateChanges/info/${res.id}`)
              .then((jsonres) => {
                return jsonres.json();
              })
              .then((res) => {
                if (res.error) {
                  // TX HAS NOT PROPAGATED YET, CALL AGAIN
                  setTimeout(checkStateChange, 1000);
                } else {
                  let listId = document.getElementById("identifiant");
                  let newOptions = `<option value="${res.stateChanges.data[0].value}">${res.stateChanges.data[0].value}</option>`;
                  listId.innerHTML += newOptions;
                  document.getElementById("identifiant").disabled = false;
                  document.getElementById("identifiant").options[0].label = "New entry"
                }
              })
              .catch((err) => {
                console.log(err);
              });
          }
          
          setTimeout(checkStateChange, 5000);
        }

      })
      .catch((err) => {
        console.log(err);
        displayAlert("error", err.message ? err.message : err);

      });
})

// WE SET THE GENERAL INFOS RELATED TO THIS ACCOUNT / PAGE SUCH AS NAME/TITLE AND DESCRIPTION
document.getElementById("accountInfo").addEventListener("click", function(e){
    e.preventDefault();
    displayAlert("clear");
    let name = document.getElementById("name").value;
    let intro = document.getElementById("intro").value;
    const data = {
        dApp: getdata.dappAddress,
        call: {
            function: 'updateInfos',
            args: [
                { type: 'string', value: name},
                { type: 'string', value: intro }
            ],
        },
    }
    signer
      .invoke(data)
      .broadcast()
        .then((res) => {
          displayAlert("success", "Infos updated");
          document.getElementById("title").innerHTML = name;
          document.getElementById("introtop").innerHTML = intro;
        })
        .catch((err) => {
          console.log(err)
          displayAlert("error", err.message ? err.message : err);
        });
})

// HERE IS JUST TO CENTER CORRECTLY DEPENDING ON SCREEN SIZE, SWITCHING THE FLEX ALIGNMENT
let loadResize = function(e){
  if(document.querySelector('.wrap_admin').offsetHeight > document.querySelector('body').offsetHeight){ 
    document.querySelector('body').style.justifyContent = "flex-start" 
    document.querySelector('body').style.height = "auto"
  }else{
    document.querySelector("body").style.justifyContent = "center"; 
    document.querySelector("body").style.height = "100%";
  }
}
$(".collapse").on("hidden.bs.collapse", loadResize);
window.addEventListener("load", loadResize);
window.addEventListener("resize", loadResize);
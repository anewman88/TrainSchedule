//******************************************************************************
// Global Variable Declarations
var DebugOn = true;  // Debug flag
var CurDateTime = 0; // Current Date and Time string
var msCurTime = 0;   // Current time in ms
var intervalId;      // Pointer for the inerval ID

  // Initialize Firebase
  var config = {
    apiKey: "AIzaSyDGctolTRLDSzf0AaYncYIXmvy2eSAx-a8",
    authDomain: "trainscheduledb-4a1d1.firebaseapp.com",
    databaseURL: "https://trainscheduledb-4a1d1.firebaseio.com",
    projectId: "trainscheduledb-4a1d1",
    storageBucket: "trainscheduledb-4a1d1.appspot.com",
    messagingSenderId: "1050482101090"
  };

firebase.initializeApp(config);

// Create a variable to reference the database
var database = firebase.database(); // pointer to datbase

$(document.body).ready(function() {

//*************************************************************************
// function UpdateDispaly()
// The purpose of this function is to update the current time on the 
// train schedule and update the train schedule display
// This function is also called in the 1 minute interval timer
function UpdateDisplay() {

    CurDateTime = new Date();
    msCurTime = Date.parse(CurDateTime);
    if (DebugOn) console.log ("*****In Update Time: " + CurDateTime + " in ms: " + msCurTime);

    // Update the current date and time of day on screen
    var DisplayDateTime = moment(CurDateTime).format('MMMM Do YYYY, h:mm a');
    $("#curTime").text(DisplayDateTime);

    UpdateTrainSchedule();
} // function UpdateDisplay() 

//*************************************************************************
// function UpdateTrainSchedule()
// The purpose of this function is to update the current train schedule 
function UpdateTrainSchedule() {

    // Clear the existing train schedule
    $("#train-schedule").html("");

    // For each of the items in the database update the trains schedule display
    var query = firebase.database().ref().orderByKey();
    query.once("value")
        .then(function(snapshot) {
            snapshot.forEach(function(childSnapshot) {

                // key will be "ada" the first time and "alan" the second time
                var key = childSnapshot.key;
                // childData will be the actual contents of the child
                var childData = childSnapshot.val();
                if (DebugOn) console.log (childData);

                // Get the current train information   
                var curTrain = childData.TrainName;
                var curDest = childData.Destination;
                var curStart = childData.FirstTime;
                var curFreq = childData.Frequency;

                if (DebugOn) console.log ("Train: ", curTrain);
                if (DebugOn) console.log ("Dest: ", curDest);
                if (DebugOn) console.log ("Start: ", curStart);
                if (DebugOn) console.log ("Start: " + moment(curStart).format('MMMM Do YYYY, h:mm:ss a'));
                if (DebugOn) console.log ("Freq: ", curFreq);
                
                // Populate the new row of display data
                var newRow = $("<tr>");

                // Train name
                var trainDiv = $("<td>");
                trainDiv.text(curTrain);
                newRow.append(trainDiv);

                // Train destination
                var destDiv = $("<td>");
                destDiv.text(curDest);
                newRow.append(destDiv);

                // Train frequency
                var freqDiv = $("<td>");
                freqDiv.text(curFreq);
                newRow.append(freqDiv);

                // Calculate and display the next train arrival time
                // calculate the number of minutes away the next train is
                var minAway = calcTimeAway(curStart, curFreq);

                if (minAway < 0) {  // Train not online yet
                    var nextTrain = "Not Online";
                    minAway = 0;
                    
                } else {
                    // calculate the time of the next train         
                    var nextTrain = moment(CurDateTime).add(minAway, "minutes").format('LT');
                }

                var nextDiv = $("<td>");
                nextDiv.text(nextTrain);
                newRow.append(nextDiv);

                // Display the minutes to arrival 
                var awayDiv = $("<td>")
                awayDiv.text(minAway);
                newRow.append(awayDiv);
                
                // Display the new row
                $("#train-table").append(newRow)

            });   // snapshot 
        });  // query 

}  // UpdateTrainSchedule()

//*************************************************************************
// function startTime()
// The purpose of this function is to start an interval timer for 60 seconds
function startTime() {
    clearInterval(intervalId);
    intervalId = setInterval(UpdateDisplay, 1000*60);
}  // function startTime()


//*************************************************************************
// function calcTimeAway()
// The purpose of this function is to calculate (in minutes) the time
// for the next train to arrive
function calcTimeAway(msStartTime, minFreq) {
    if (DebugOn) console.log ("In calcTimeAway input StartTime: " + msStartTime + "Freq: ", minFreq);

    // Convert to minutes
    var msDiffTime = msCurTime - msStartTime;
    var minDiffTime = Math.trunc (msDiffTime / 60000);
    if (DebugOn) console.log ("minDiffTime: ", minDiffTime);

    // Check if the train has started yet
    if (minDiffTime < 0) { // train not online yet
      return(-1);
    }

    var nextMinAway = minFreq - (minDiffTime % minFreq);
    if (DebugOn) console.log ("Next Train Min Away: ", nextMinAway);
    return(nextMinAway);
} // calcTimeAway() 


//*************************************************************************
    //*  function event handler for train add button
    $("#add-train").on("click", function(event) {
        event.preventDefault();

        // Get the input new train information   
        var newTrain = $("#train-input").val().trim();
        var newDest = $("#dest-input").val().trim();
        var newStart = $("#start-input").val().trim();
        var newFreq = $("#freq-input").val()

        if (DebugOn) console.log ("Train: ", newTrain);
        if (DebugOn) console.log ("Dest: ", newDest);
        if (DebugOn) console.log ("Start: ", newStart);
        if (DebugOn) console.log ("Freq: ", newFreq);

        // Calculate the next train arrival time
        var timeStr = newStart.split(":");

        // set start date and time of train by adding the input start time 
        // (military format) to 00:00:00 of current day
        var todayDate = new Date();
        todayDate.setHours(parseInt(timeStr[0]));
        todayDate.setMinutes(parseInt(timeStr[1]));
        todayDate.setSeconds(0);
        todayDate.setMilliseconds(0);
        if (DebugOn) console.log ("Start time: " + todayDate);

        // convert the train start time to milliseconds
        var msStartTime = Date.parse(todayDate);

        //  push the data at the end of the database
        database.ref().push({
            TrainName: newTrain,
            Destination: newDest,
            FirstTime: msStartTime,
            Frequency: newFreq,
        });

        UpdateDisplay();

        // clear the Admin Screen input data form
        $("#train-input").val("");
        $("#dest-input").val("");
        $("#start-input").val("");
        $("#freq-input").val("");
        
    });  // $("#add-train").on("click", function(event)

    //*****************************************************************************
    // Main part of program:
    // Start the 1 minute interval to update the train schedule
    // And display the train schedule
    startTime();
    UpdateDisplay();

});  // $(document.body).ready(function()


const SLOTS_NUMBER = 3;
var jlinkList = [];
var testClientList = [];

function delay(milliseconds)
{
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

GeneralCommands =
{
    testConnection: function ()
    {
        for (var i = 0; i < jlinkList.length; i++)
        {
            jlinkList[i].establishConnection();
        }
    },

    readCSA: function()
    {
        for (var i = 0; i < testClientList.length; i++)
        {
            let testClient = testClientList[i];
            logger.logInfo("Measuring board " + testClient.no() + " current: " + testClient.readCSA(0) + " mA");
        }
    },

    //---

    powerOn: function ()
    {
        for (var slot = 1; slot < SLOTS_NUMBER + 1; slot++)
        {
            for (var i = 0; i < testClientList.length; i++)
            {
                if(testClientList[i].isDutAvailable(slot) && testClientList[i].isDutChecked(slot))
                {
                    let testClient = testClientList[i];
                    testClient.powerOn(slot);
                    logger.logInfo("DUT " + testClient.dutNo(slot) + " switched ON");
                }
            }
        }
    },

    //---

    powerOff: function ()
    {
        for (var slot = 1; slot < SLOTS_NUMBER + 1; slot++)
        {
            for (var i = 0; i < testClientList.length; i++)
            {
                if(testClientList[i].isDutAvailable(slot) && testClientList[i].isDutChecked(slot))
                {
                    let testClient = testClientList[i];
                    testClient.powerOff(slot);
                    logger.logInfo("DUT " + testClient.dutNo(slot) + " switched OFF");
                }
            }
        }
    },

    //---

    detectDuts: function ()
    {
        actionHintWidget.showProgressHint("Detecting DUTs in the testing fixture...");

        for (var slot = 1; slot < SLOTS_NUMBER + 1; slot++)
        {
            for (var i = 0; i < testClientList.length; i++)
            {
                let testClient = testClientList[i];
                testClient.powerOff(slot);
                testClient.resetDut(slot);
            }
        }
        delay(100);


        for (slot = 1; slot < SLOTS_NUMBER + 1; slot++)
        {
            for (i = 0; i < testClientList.length; i++)
            {
                var testClient = testClientList[i];
                testClient.commandSequenceStarted();
                testClient.setActive(false);

                testClient.commandSequenceStarted();
                testClient.setActive(false);

                var prevCSA = testClient.readCSA(0);
                testClient.powerOn(slot);
                var currCSA = testClient.readCSA(0);

                if((currCSA - prevCSA) > 15)
                {
                    logger.logSuccess("Device connected to the slot " + slot + " of the test board " + testClient.no());
                    testClient.setDutProperty(slot, "state", 1);
                    testClient.setDutProperty(slot, "checked", true);
                    testClient.setActive(true);
                }

                else
                {
                    testClient.setDutProperty(slot, "state", 0);
                    testClient.setDutProperty(slot, "checked", false);
                }

                testClient.commandSequenceFinished();
            }
        }

        actionHintWidget.showProgressHint("READY");
    },

    //---

    readChipId: function ()
    {
        actionHintWidget.showProgressHint("Reading device's IDs...");

        for(let slot = 1; slot < SLOTS_NUMBER + 1; slot++)
        {
            for (let i = 0; i < testClientList.length; i++)
            {
                if(testClientList[i].isDutAvailable(slot) && testClientList[i].isDutChecked(slot))
                {
                    let response = testClientList[i].railtestCommand(slot, "getmemw 0x0FE081F0 2");
                    let id = response[response.length - 1].slice(2) + response[response.length - 3].slice(2);
                    testClientList[i].setDutProperty(slot, "id", id.toUpperCase());
                    logger.logSuccess("ID for DUT " + testClientList[i].dutNo(slot) + " has been read: " + testClientList[i].dutProperty(slot, "id"));
                }
            }
        }

        actionHintWidget.showProgressHint("READY");
    },

    testAccelerometer: function ()
    {
        actionHintWidget.showProgressHint("Testing Accelerometer...");

        for(let slot = 1; slot < SLOTS_NUMBER + 1; slot++)
        {
            for (let i = 0; i < testClientList.length; i++)
            {
                if(testClientList[i].isDutAvailable(slot) && testClientList[i].isDutChecked(slot))
                {
                    let response = testClientList[i].railtestCommand(slot, "accl");
                    if (response[2].includes("X") && response[3].includes("Y") && response[4].includes("Z"))
                    {
                           let x = Number(response[2].slice(2, 5));
                           let y = Number(response[3].slice(2, 5));
                           let z = Number(response[4].slice(2, 5));

                           if (x > 10 || x < -10 || y > 10 || y < -10 || z < 80 || z > 100)
                           {
                               testClientList[i].setDutProperty(slot, "accelChecked", false);
                               testClientList[i].addDutError(slot, response.join(' '));
                               logger.logDebug("Accelerometer failure: X=" + x +", Y=" + y + ", Z=" + z + ".");
                               logger.logError("Accelerometer failture for DUT " + testClientList[i].dutNo(slot));
                           }
                           else
                           {
                               testClientList[i].setDutProperty(slot, "accelChecked", true);
                               logger.logSuccess("Accelerometer for DUT " + testClientList[i].dutNo(slot) + " has been tested successfully.");
                           }
                    }

                    else
                    {
                        testClientList[i].setDutProperty(slot, "accelChecked", false);
                        testClientList[i].addDutError(slot, response.join(' '));
                        logger.logError("Accelerometer failture for DUT " + testClientList[i].dutNo(slot));
                    }
                }
            }
        }

        actionHintWidget.showProgressHint("READY");
    },

    testLightSensor: function ()
    {
        actionHintWidget.showProgressHint("Testing light sensor...");

        for(let slot = 1; slot < SLOTS_NUMBER + 1; slot++)
        {
            for (let i = 0; i < testClientList.length; i++)
            {
                if(testClientList[i].isDutAvailable(slot) && testClientList[i].isDutChecked(slot))
                {
                    let response = testClientList[i].railtestCommand(slot, "lsen");
                    if (response[2].includes("opwr"))
                    {
                           let x = Number(response[2].slice(5, 5));

                           if (x < 0)
                           {
                               testClientList[i].setDutProperty(slot, "lightSensChecked", false);
                               testClientList[i].addDutError(slot, response.join(' '));
                               logger.logDebug("Light sensor failure: X=" + x  + ".");
                               logger.logError("Light sensor failture for DUT " + testClientList[i].dutNo(slot));
                           }
                           else
                           {
                               testClientList[i].setDutProperty(slot, "lightSensChecked", true);
                               logger.logSuccess("Light sensor for DUT " + testClientList[i].dutNo(slot) + " has been tested successfully.");
                           }
                    }

                    else
                    {
                        estClientList[i].setDutProperty(slot, "lightSensChecked", false);
                        testClientList[i].addDutError(slot, response.join(' '));
                        logger.logError("Light sensor failture for DUT " + testClientList[i].dutNo(slot));
                    }
                }
            }
        }

        actionHintWidget.showProgressHint("READY");
    },

    testDALI: function ()
    {
        actionHintWidget.showProgressHint("Testing DALI interface...");

        GeneralCommands.powerOff();

        for (var i = 0; i < testClientList.length; i++)
        {
            testClientList[i].daliOn();
        }

        for(let slot = 1; slot < SLOTS_NUMBER + 1; slot++)
        {
            for (let i = 0; i < testClientList.length; i++)
            {
                if(testClientList[i].isDutAvailable(slot) && testClientList[i].isDutChecked(slot))
                {
                    let testClient = testClientList[i];
                    testClient.switchSWD(slot);
                    testClient.powerOn(slot);
                    delay(2000);

                    testClientList[i].railtestCommand(slot, "dali 0xFE80 16 0 0");
                    let responseString = testClientList[i].railtestCommand(slot, "dali 0xFF90 16 0 1000000").join(' ');

                    if(responseString.includes("error:0"))
                    {
                        testClientList[i].setDutProperty(slot, "daliChecked", true);
                        logger.logSuccess("DALI interface for DUT " + testClientList[i].dutNo(slot) + " has been tested successfully.");
                    }

                    else
                    {
                        testClientList[i].setDutProperty(slot, "daliChecked", false);
                        testClientList[i].addDutError(slot, responseString);
                        logger.logError("DALI testing for DUT " + testClientList[i].dutNo(slot) + " has been failed!");
                        logger.logDebug("DALI failure: " + responseString  + ".");
                    }

                    testClientList[i].railtestCommand(slot, "dali 0xFE80 16 0 0");
                    testClient.powerOff(slot);
                }
            }
        }

        for (i = 0; i < testClientList.length; i++)
        {
            testClientList[i].daliOff();
        }

        actionHintWidget.showProgressHint("READY");
    },
}

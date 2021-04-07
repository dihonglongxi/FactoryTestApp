var SLOTS_NUMBER = 3
methodManager.addMethod("OLC Zhaga ECO");

ZhagaECO =
{
    measuringBoardIDs: ["5CDA73693935", "5CDA78693935", "5CDC87693935", "5CEE627B3935",  "5CDF60603935"],
    RfModuleId: "AL03RZIAA",

    //---

    openTestClients: function ()
    {
        GeneralCommands.openTestClients(ZhagaECO.measuringBoardIDs);
    },

    //---

    downloadRailtest: function ()
    {
        GeneralCommands.downloadRailtest("sequences/OLCZhagaECO/dummy_btl_efr32xg12.s37", "sequences/OLCZhagaECO/olc_zhaga_2l4l_railtest.hex");
//        actionHintWidget.showProgressHint("Downloading the Railtest...");

//        for (var slot = 1; slot < SLOTS_NUMBER + 1; slot++)
//        {
//            for (var i = 0; i < testClientList.length; i++)
//            {
//                let testClient = testClientList[i];
//                let jlink = jlinkList[i];
//                if(testClient.isDutAvailable(slot) && testClient.isDutChecked(slot))
//                {
//                    testClient.powerOn(slot);
//                    delay(1000);
//                    testClient.switchSWD(slot);

//                    jlink.selectByUSB();
//                    jlink.open();
//                    jlink.setDevice("EFR32FG12PXXXF1024");
//                    jlink.select();
//                    jlink.setSpeed(5000);
//                    jlink.connect();

//                    let error = jlink.erase();
//                    if(error < 0)
//                    {
//                        testClient.setDutProperty(slot, "checked", false);
//                        testClient.setDutProperty(slot, "railtestDownloaded", false);
//                        logger.logError("Unable to earase chip flash memory in DUT " + testClient.dutNo(slot));
//                        logger.logDebug("An error occured when erasing chip in DUT " + testClient.dutNo(slot) + " Error code: " + error);
//                    }

//                    else
//                    {
//                        logger.logInfo("Chip flash in DUT " + testClient.dutNo(slot) + " has been erased.");
//                    }

//                    if(testClient.isDutChecked(slot))
//                    {
//                        error = jlink.downloadFile("sequences/OLCZhagaECO/dummy_btl_efr32xg12.s37", 0);

//                        if(error < 0)
//                        {
//                            testClient.setDutProperty(slot, "checked", false);
//                            testClient.setDutProperty(slot, "railtestDownloaded", false);
//                            logger.logError("Failed to load the Railtest into the chip flash memory for DUT " + testClient.dutNo(slot));
//                            logger.logDebug("An error occured when downloading olc_zhaga_2l4l_railtest.hex for DUT " + testClient.dutNo(slot) + " Error code: " + error);
//                        }

//                        else
//                        {
//                            error = jlink.downloadFile("sequences/OLCZhagaECO/olc_zhaga_2l4l_railtest.hex", 0);

//                            if(error < 0)
//                            {
//                                testClient.setDutProperty(slot, "checked", false);
//                                testClient.setDutProperty(slot, "railtestDownloaded", false);
//                                logger.logError("Failed to load the Railtest into the chip flash memory for DUT " + testClient.dutNo(slot));
//                                logger.logDebug("An error occured when downloading olc_zhaga_2l4l_railtest.hex for DUT " + testClient.dutNo(slot) + " Error code: " + error);
//                            }

//                            else
//                            {
//                                testClient.setDutProperty(slot, "railtestDownloaded", true);
//                                logger.logInfo("Railtest firmware has been downloaded in DUT " + testClient.dutNo(slot));
//                            }
//                        }
//                    }

//                    jlink.reset();
//                    jlink.go();
//                    jlink.close();
//                }
//            }
//        }

//        actionHintWidget.showProgressHint("READY");
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

                if(!testClient.isConnected())
                    continue;

                testClient.setTimeout(500);
                testClient.powerOn(slot);
                testClient.setTimeout(10000);
            }
        }
        delay(100);

        for (slot = 1; slot < SLOTS_NUMBER + 1; slot++)
        {
            for (i = 0; i < testClientList.length; i++)
            {
                var testClient = testClientList[i];

                if(!testClient.isConnected())
                    continue;

                testClient.setTimeout(300);
//                logger.logDebug("Attempting connection to slot " + slot + " of board " + testClient.no() + "...");

                let voltage = testClient.readAIN(slot, 1, 0);

                let counter = 0;
                while((voltage === 0 || voltage === -1) && (counter < 50))
                {
                    delay(200);
                    voltage = testClient.readAIN(slot, 1, 0);
                    counter++;
                }

                if(voltage > 70000 && voltage < 72000)
                {
                    logger.logSuccess("Device connected to the slot " + slot + " of the test board " + testClient.no() + " detected.");
                    testClient.setDutProperty(slot, "state", 1);
                    testClient.setDutProperty(slot, "checked", true);
                }

                else
                {
                    testClient.setDutProperty(slot, "state", 0);
                    testClient.setDutProperty(slot, "checked", false);
                }

                testClient.setTimeout(10000);
            }
        }

        actionHintWidget.showProgressHint("READY");

    },

    //---

    downloadSoftware: function ()
    {
        GeneralCommands.downloadSoftware("sequences/OlcZhagaECO/ZhagaECO_software.hex");
//        actionHintWidget.showProgressHint("Downloading the software...");

//        for (var slot = 1; slot < SLOTS_NUMBER + 1; slot++)
//        {
//            for (var i = 0; i < testClientList.length; i++)
//            {
//                let testClient = testClientList[i];
//                let jlink = jlinkList[i];
//                if(testClient.isDutAvailable(slot) && testClient.isDutChecked(slot) && (testClient.dutState(slot) === 2))
//                {
//                    testClient.powerOn(slot);
//                    delay(1000);
//                    testClient.switchSWD(slot);

//                    jlink.selectByUSB();
//                    jlink.open();
//                    jlink.setDevice("EFR32FG12PXXXF1024");
//                    jlink.select();
//                    jlink.setSpeed(5000);
//                    jlink.connect();

//                    let error = jlink.erase();
//                    if(error < 0)
//                    {
//                        logger.logError("Unable to earase chip flash memory in DUT " + testClient.dutNo(slot));
//                        logger.logDebug("An error occured when erasing chip in DUT " + testClient.dutNo(slot) + " Error code: " + error);
//                    }

//                    else
//                    {
//                        logger.logInfo("Chip flash in DUT " + testClient.dutNo(slot) + " has been erased.");
//                    }

//                    error = jlink.downloadFile("sequences/OlcZhagaECO/ZhagaECO_software.hex", 0);

//                    if(error < 0)
//                    {
//                        testClient.setDutProperty(slot, "state", 3);
//                        testClient.addDutError(slot, "Failed to load the sowtware");
//                        logger.logError("Failed to load the sowtware into the chip flash memory for DUT " + testClient.dutNo(slot));
//                        logger.logDebug("An error occured when downloading ZhagaECO_software.hex for DUT " + testClient.dutNo(slot) + " Error code: " + error);

//                    }

//                    else
//                    {
//                        logger.logInfo("Software has been downloaded in DUT " + testClient.dutNo(slot));
//                    }

//                    jlink.close();
//                }

//                testClient.slotFullyTested(slot);
//            }
//        }

//        actionHintWidget.showProgressHint("READY");
    },

    //---

    checkAinVoltage: function ()
    {
        actionHintWidget.showProgressHint("Checking voltage on AIN1...");

        for (var slot = 1; slot < SLOTS_NUMBER + 1; slot++)
        {
            for (var i = 0; i < testClientList.length; i++)
            {
                let testClient = testClientList[i];
                if(testClient.isDutAvailable(slot) && testClient.isDutChecked(slot))
                {
                    let voltage = testClient.readAIN(slot, 1, 0);
                    if(voltage > 70000 && voltage < 72000)
                    {
                        testClientList[i].setDutProperty(slot, "voltageChecked", true);
                        logger.logSuccess("Voltage (3.3V) on AIN 1 for DUT " + testClientList[i].dutNo(slot) + " is checked.");
                    }
                    else
                    {
                        testClientList[i].setDutProperty(slot, "voltageChecked", false);
                        testClientList[i].addDutError(slot, response.join(' '));
                        logger.logDebug("Error voltage value on AIN 1 : " + voltage  + ".");
                        logger.logError("Error voltage value on AIN 1 is detected. DUT " + testClientList[i].dutNo(slot));
                    }
                }
            }
        }

        actionHintWidget.showProgressHint("READY");
    },

    //---

//    radioTest

    //---

    testRadio: function ()
    {
        GeneralCommands.testRadio(ZhagaECO.RfModuleId, 19, 80, -70, 50, 7);
    },

    //---

    startTesting: function ()
    {
        GeneralCommands.testConnection();
        ZhagaECO.openTestClients();

        if(!GeneralCommands.isMethodCorrect)
            return;

        GeneralCommands.clearDutsInfo();
        GeneralCommands.detectDuts();
        ZhagaECO.downloadRailtest();
        GeneralCommands.readChipId();
        ZhagaECO.checkAinVoltage();
        GeneralCommands.testAccelerometer();
        GeneralCommands.testLightSensor();
        ZhagaECO.testRadio();
        GeneralCommands.testDALI();
        ZhagaECO.checkTestingCompletion();
        ZhagaECO.downloadSoftware();
        GeneralCommands.powerOff();
    },

    //---

    checkTestingCompletion: function ()
    {
        for(var slot = 1; slot < SLOTS_NUMBER + 1; slot++)
        {
            for (var i = 0; i < testClientList.length; i++)
            {
                let testClient = testClientList[i];
                if(testClient.isDutAvailable(slot) && testClient.isDutChecked(slot))
                {
                    if( testClient.dutProperty(slot, "id") !== "" &&
                            testClient.dutProperty(slot, "voltageChecked") &&
                            testClient.dutProperty(slot, "lightSensChecked") &&
                            testClient.dutProperty(slot, "daliChecked") &&
                            testClient.dutProperty(slot, "radioChecked") &&
                            testClient.dutProperty(slot, "accelChecked")
                            )
                    {
                        testClient.setDutProperty(slot, "state", 2);
                    }

                    else
                    {
                        testClient.setDutProperty(slot, "state", 3);
                    }

//                    testClient.slotFullyTested(slot);
                }

                else if(testClient.isDutAvailable(slot) && !testClient.dutProperty(slot, "railtestDownloaded"))
                {
                    testClient.setDutProperty(slot, "checked", true);
                    testClient.setDutProperty(slot, "state", 3);
                }
            }
        }
    }
}

methodManager.addFunctionToGeneralList("Full cycle testing", ZhagaECO.startTesting);
methodManager.addFunctionToGeneralList("Test connection to JLink", GeneralCommands.testConnection);
methodManager.addFunctionToGeneralList("Establish connection to sockets", ZhagaECO.openTestClients);
methodManager.addFunctionToGeneralList("Clear previous test results for DUTs", GeneralCommands.clearDutsInfo);
methodManager.addFunctionToGeneralList("Detect DUTs", GeneralCommands.detectDuts);
methodManager.addFunctionToGeneralList("Erase chip", GeneralCommands.earaseChip);
methodManager.addFunctionToGeneralList("Download Railtest", ZhagaECO.downloadRailtest);
methodManager.addFunctionToGeneralList("Read CSA", GeneralCommands.readCSA);
methodManager.addFunctionToGeneralList("Read Temperature", GeneralCommands.readTemperature);
methodManager.addFunctionToGeneralList("Supply power to DUTs", GeneralCommands.powerOn);
methodManager.addFunctionToGeneralList("Power off DUTs", GeneralCommands.powerOff);
methodManager.addFunctionToGeneralList("Read unique device identifiers (ID)", GeneralCommands.readChipId);
methodManager.addFunctionToGeneralList("Check voltage on AIN 1 (3.3V)", ZhagaECO.checkAinVoltage);
methodManager.addFunctionToGeneralList("Test accelerometer", GeneralCommands.testAccelerometer);
methodManager.addFunctionToGeneralList("Test light sensor", GeneralCommands.testLightSensor);
methodManager.addFunctionToGeneralList("Test radio interface", ZhagaECO.testRadio);
methodManager.addFunctionToGeneralList("Test DALI", GeneralCommands.testDALI);
methodManager.addFunctionToGeneralList("Check Testing Completion", ZhagaECO.checkTestingCompletion);
methodManager.addFunctionToGeneralList("Download Software", ZhagaECO.downloadSoftware);



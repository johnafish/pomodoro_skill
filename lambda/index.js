// A simple pomodoro Alexa skill written by John Fish
// Sorry for the sloppy code, it was rushed
// Feel free to modify and use for noncommercial purposes without credit
// contact me for any commercial use of this code

const Alexa = require('ask-sdk-core');
const Util = require('util.js');
var PlayState = "play";

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speakOutput = 'Starting Pomodoro';
        if (supportsAPL(handlerInput)) {
            handlerInput.responseBuilder
            .addDirective(VideoViewDirective())
        }
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt("Say 'start pomodoro' to begin")
            .getResponse();
    }
};

const ControlPomodoroIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ControlPomodoroIntent'
            || handlerInput.requestEnvelope.request.type === 'Alexa.Presentation.APL.UserEvent';
    },
    handle(handlerInput) {
        const responseBuilder = handlerInput.responseBuilder;

        var speakOutput = PlayState ==="play" ? "Pausing Pomodoro" : "Playing pomodoro";

        if (handlerInput.requestEnvelope.context.System.device.supportedInterfaces['Alexa.Presentation.APL']) {
            return handlerInput.responseBuilder
            .addDirective(ControlDirective())
            .speak(speakOutput)
            .getResponse();
        }
        else {
            return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
        }
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        var speakOutput = PlayState==="play" ? "Pausing Pomodoro" : "Playing pomodoro";

        return handlerInput.responseBuilder
            .addDirective(ControlDirective())
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.stack}`);
        const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

function supportsDisplay(handlerInput) {
  const hasDisplay =
    handlerInput.requestEnvelope.context &&
    handlerInput.requestEnvelope.context.System &&
    handlerInput.requestEnvelope.context.System.device &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display;
  return hasDisplay;
}

function ControlDirective() {
    if (PlayState === "play") {
        PlayState = "pause"
    } else {
        PlayState = "play"
    }
    return {
        "type" : "Alexa.Presentation.APL.ExecuteCommands",
        "token": "ctrl-token",
        "commands": [{
            "type": "ControlMedia",
            "componentId" : "videoplayer",
            "command": PlayState
        }]
    }
}

function VideoViewDirective() {
    return {
        type: "Alexa.Presentation.APL.RenderDocument",
        token: "video-screen",
        document: {
            "type": "APL",
            "version": "1.1",
            "settings": {},
            "theme": "dark",
            "import": [],
            "resources": [],
            "styles": {},
            "onMount": [],
            "graphics": {},
            "commands": {},
            "layouts": {},
            "mainTemplate": {
                "parameters": [
                    "payload"
                ],
                "items": [
                    {
                        "type": "Container",
                        "items": [
                            {
                                "type": "Frame",
                                "position": "absolute",
                                "width": "100%",
                                "height": "100%",
                                "backgroundColor": "black"
                            },
                            {
                                "type": "Video",
                                "audiotrack": "foreground",
                                "id": "videoplayer",
                                "width": "100%",
                                "height": "100%",
                                "source": {
                                    "url": Util.getS3PreSignedUrl("Media/pomodoro.mov"),
                                    "repeatCount": -1
                                },
                                "autoplay": true,
                                "position": "absolute",
                                "alignSelf": "center"
                            },
                            {
                                "type": "TouchWrapper",
                                "height": "80dp",
                                "width": "160dp",
                                "align": "center",
                                "alignSelf": "center",
                                "position": "absolute",
                                "bottom": "20dp",
                                "onPress": {
                                    "type": "SendEvent",
                                    "arguments": [
                                        "playpause"
                                    ]
                                },
                                "item": {
                                    "type": "Image",
                                    "height": "100%",
                                    "width": "100%",
                                    "source": Util.getS3PreSignedUrl("Media/playpause.png"),
                                }
                            }
                        ],
                        "height": "100%",
                        "width": "100%"
                    }
                ]
            }
        }
    }
}

function supportsAPL(handlerInput) {
    const supportedInterfaces =
        handlerInput.requestEnvelope.context.System.device.supportedInterfaces;
    const aplInterface = supportedInterfaces['Alexa.Presentation.APL'];
    return aplInterface != null && aplInterface != undefined;
}


// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        ControlPomodoroIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    )
    .addErrorHandlers(
        ErrorHandler,
    )
    .lambda();

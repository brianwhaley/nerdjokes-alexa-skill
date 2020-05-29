const AWS = require("aws-sdk");
AWS.config.update({region: 'us-east-2'});
const LAMBDA = new AWS.Lambda();
const CRYPTO = require('crypto');
const log = true;
const firstRequest = "Would you like to hear a nerd joke?";
const subsequentRequest = "Would you like to hear another nerd joke?";

exports.handler = async (event, context, callback) => {
    if(log) console.log("NERD JOKE SKILL - Event Type : ", event.request.type);
    switch (event.request.type) {
        case "LaunchRequest":
            LaunchHandler(context);
            break;
        case "IntentRequest":
            switch (event.request.intent.name) {
                case "NerdJoke":
                    await NerdJokeHandler(context);
                    break;
                case "AMAZON.FallbackIntent":
                    FallbackHandler(context);
                    break;
                case "AMAZON.HelpIntent":
                    HelpHandler(context);
                    break;
                case "AMAZON.CancelIntent":
                case "AMAZON.StopIntent":
                    StopHandler(context);
                    break;
            }
        break;
    }
};

var LaunchHandler = (context) => {
    if(log) console.log("NERD JOKE SKILL - Launch Handler");
    context.succeed(generateResponse(buildSpeechletResponse("Welcome to Nerd Jokes.  " + firstRequest , false)));
};


var NerdJokeHandler = async (context) => {
    if(log) console.log("NERD JOKE SKILL - Nerd Joke Handler");
    var joke = await getJoke();
    if(log) console.log("RECEIVED Joke : ", joke);
    var jokePayload = JSON.parse(joke.Payload) ;
    if(log) console.log("RECEIVED Payload: ", jokePayload);
    var jokeBody = JSON.parse(jokePayload.body);
    if(log) console.log("RECEIVED Body : ", jokeBody);
    // var jokeOutput = { question: jokeBody.Items[0].question , answer: jokeBody.Items[0].answer } ;
    // if(log) console.log("RECEIVED Output : ", jokeOutput);
    // context.succeed(generateResponse(buildJokeSpeechletResponse(jokeOutput, false)));
    context.succeed(generateResponse(buildJokeSpeechletResponse(jokeBody, false)));
};


var FallbackHandler = (context) => {
    if(log) console.log("NERD JOKE SKILL - Fallback Handler");
    context.succeed(generateResponse(buildSpeechletResponse(firstRequest, false)));
};


var HelpHandler = (context) => {
    if(log) console.log("NERD JOKE SKILL - Help Handler");
    context.succeed(generateResponse(buildSpeechletResponse(`
    Thanks for using Nerd Jokes.  
    There is not a lot to do with this skill, just a bunch of nerd jokes.  
    Would you like to hear a Nerd Joke?  
    Just say yes, or no.
    `, false)));
};


var StopHandler = (context) => {
    if(log) console.log("NERD JOKE SKILL - Stop Handler");
    context.succeed(generateResponse(buildSpeechletResponse("Thanks for listening to some nerd jokes.", true)));
};



var buildSpeechletResponse = (outputText, shouldEndSession) => {
    return {
        outputSpeech: {
            type: "PlainText",
            text: outputText 
        },
        shouldEndSession: shouldEndSession
    };
};

var buildJokeSpeechletResponse = (outputText, shouldEndSession) => {
    if(log) console.log("Build Response : ", outputText);
    var output = {
        outputSpeech: {
            type: "SSML",
            ssml: `<speak> 
                <p> ${outputText.question} </p> 
                <break time="0.5s"/>
                <p> ${outputText.answer} </p> 
                <break time="0.5s"/>
                <p> ${randomResponse()} </p>
                <p> ${subsequentRequest} </p>
                </speak>`
        },
        shouldEndSession: shouldEndSession
    };
    if(log) console.log("Build Response Output : ", output);
    return output;
};


var generateResponse = (speechletResponse) => {
    return {
        version: "1.0",
        response: speechletResponse
    };
};


var getJoke = async () => {
    var lambdaPayload = {
        "httpMethod": "POST",
        "headers": {
	        "Content-Type": "application/json",
        }, 
        "body": {
            "command": "/nerdjokes",
            "text": "getjokejson",
        }
    };
    if(log) console.log("GET JOKE - Lambda - Payload : ", lambdaPayload); 
    let lambdaParams = {
        FunctionName: 'nerdjokes:PROD',
        Payload: JSON.stringify(lambdaPayload)
    };
    if(log) console.log("GET JOKE - Lambda - Params : ", lambdaParams); 
    var myjoke = await callLambda(lambdaParams);
    if(log) console.log("GET JOKE - Lambda - Joke : ", myjoke); 
    return myjoke ;
};


var callLambda = async (params) => {
    return new Promise((resolve, reject) => {
        LAMBDA.invoke(params, function(error, data) {
            if (error) {
                console.log("CALL LAMBDA - ERROR", JSON.stringify(error));
                console.log("CALL LAMBDA - ERROR Code : ", JSON.stringify(error.code));
                console.log("CALL LAMBDA - ERROR Message : ", JSON.stringify(error.message));
                console.log("CALL LAMBDA - ERROR Stack : ", JSON.stringify(error.stack));
                reject(error);
            } else {
                if(log) console.log("CALL LAMBDA - Success");
                if(log) console.log("CALL LAMBDA - Success Data", data);
                resolve(data);
            }
        });
    });
};


var randomResponse = () => {
    var responses = [
        "Hahaha! That was an awesome joke!" ,
        "That was a great joke, right?" ,
        "Oh emm gee, that was a terrible joke." ,
        "LOL." ,
        "I call shenanigans!" ,
        "You're Sir Loll-a-lot," ,
        "" ,
        "Hahaha!" ,
        "Hm.  That was cheeky." ,
        "Hee hee hee!" ,
        "ROTFL!" ,
        "Oh My Giggle!" ,
        "What a dud." ,
        "" ,
        "Tee he he." ,
        "Thats sofa knee." ,
        "Womp, womp, womp." ,
        "That one cracks me up!" ,
        "Bazinga!" ,
        "Wow, what a nerdy joke." ,
        "" ,
        "Wakka Wakka!" ,
        "That one rocked my socks!" ,
        "Doh!" ,
        "Ugh.  Maybe the next joke will be better.",
        "Ba-dum-bum.  Shhhh.",
        "Ouch.  That one hurt."
    ];
    var rnd = getRandomInt(0, responses.length - 1);
    if(log) console.log("RANDOM RESPONSE - Rnd :", rnd, " Text: ", responses[rnd]);
    return responses[rnd];
};


var getRandomInt = (min, max) => {
    var numbers = [];
    numbers.length = 20;
    for (var i = 0; i < numbers.length ; i++) {
        numbers[i] = randomCryptoInt(min, max);
    }
    if(log) console.log("GET RANDOM INT - Min: " , min , " Max: ", max , " Nums: ", numbers);
    return numbers[randomInt(0, numbers.length - 1)];
};
var randomInt = (min, max) => {
    // min and max are inclusive
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
var randomCryptoInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    if(min >= max) return false;
    const diff = max - min + 1;
    const rnd = CRYPTO.randomBytes(8).readUInt32LE() / 0xffffffff ;
    return Math.floor( rnd * diff ) + min ; 
};